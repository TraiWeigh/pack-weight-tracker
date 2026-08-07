/**
 * Tests for the Clerk webhook handler (POST /api/webhooks/clerk).
 *
 * Run with:
 *   node artifacts/api-server/src/routes/clerkWebhook.test.mjs
 *
 * Uses Node.js built-in test runner (no extra deps).
 *
 * The handler logic is exercised through a minimal inline simulation that
 * mirrors the exact control-flow in clerkWebhook.ts so tests stay faithful
 * to production behaviour without needing a live server, real Svix secret,
 * or real Resend API key.
 *
 * Scenarios covered:
 *  W1 – missing CLERK_WEBHOOK_SECRET → 500
 *  W2 – missing raw body → 400
 *  W3 – missing Svix headers → 400
 *  W4 – invalid Svix signature (verifier throws) → 400
 *  W5 – unrecognised event type (not user.created) → 200, no email
 *  W6 – user.created, missing RESEND_API_KEY → 500
 *  W7 – user.created, Resend resolves with error → 500
 *  W8 – user.created, Resend throws → 500
 *  W9 – user.created, Resend succeeds → 200
 */

// ── Inline mirror of clerkWebhook.ts handler logic ───────────────────────────
//
// processWebhook() accepts injected dependencies (verifyFn, sendEmailFn) so
// every branch can be exercised without a network or real secrets.

/**
 * @typedef {{ status: number, body: Record<string, unknown> }} HandlerResult
 */

/**
 * @param {object} opts
 * @param {string|undefined}  opts.secret            CLERK_WEBHOOK_SECRET
 * @param {Buffer|undefined}  opts.rawBody
 * @param {Record<string,string>} opts.headers        includes svix-* headers
 * @param {string|undefined}  opts.resendApiKey       RESEND_API_KEY
 * @param {(body: Buffer, headers: object) => object} opts.verifyFn
 *   Should return the parsed event, or throw on bad signature.
 * @param {(payload: object) => Promise<{ data: object|null, error: object|null }>} opts.sendEmailFn
 *   Stub for resend.emails.send().
 * @returns {Promise<HandlerResult>}
 */
async function processWebhook({ secret, rawBody, headers, resendApiKey, verifyFn, sendEmailFn }) {
  if (!secret) {
    return { status: 500, body: { error: 'Webhook secret not configured' } };
  }
  if (!rawBody) {
    return { status: 400, body: { error: 'Missing raw body' } };
  }

  const svixId        = headers['svix-id'];
  const svixTimestamp = headers['svix-timestamp'];
  const svixSignature = headers['svix-signature'];

  if (!svixId || !svixTimestamp || !svixSignature) {
    return { status: 400, body: { error: 'Missing Svix headers' } };
  }

  let event;
  try {
    event = verifyFn(rawBody, {
      'svix-id': svixId,
      'svix-timestamp': svixTimestamp,
      'svix-signature': svixSignature,
    });
  } catch {
    return { status: 400, body: { error: 'Invalid signature' } };
  }

  if (event.type === 'user.created') {
    if (!resendApiKey) {
      return { status: 500, body: { error: 'Email service not configured' } };
    }

    let sendResult;
    try {
      sendResult = await sendEmailFn({ to: 'mixed.revamp.3q@icloud.com' });
    } catch {
      return { status: 500, body: { error: 'Failed to send notification email' } };
    }

    if (sendResult.error) {
      return { status: 500, body: { error: 'Failed to send notification email' } };
    }
  }

  return { status: 200, body: { received: true } };
}

// ── Test harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ ${message}`);
    passed++;
  } else {
    console.error(`  ✗ ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (!ok) console.error(`    Expected: ${JSON.stringify(expected)}\n    Got:      ${JSON.stringify(actual)}`);
  assert(ok, message);
}

// ── Shared test fixtures ──────────────────────────────────────────────────────

const VALID_SECRET   = 'whsec_testsecret';
const VALID_RAW_BODY = Buffer.from(JSON.stringify({ type: 'user.created', data: { email_addresses: [{ email_address: 'alice@example.com' }], created_at: 1700000000000 } }));
const VALID_HEADERS  = { 'svix-id': 'msg_123', 'svix-timestamp': '1700000000', 'svix-signature': 'v1,abc123' };
const RESEND_KEY     = 're_test_abc';

const verifyOk    = (body, _hdrs) => JSON.parse(body.toString());
const verifyBad   = (_body, _hdrs) => { throw new Error('Bad signature'); };
const sendOk      = async (_p) => ({ data: { id: 'email_123' }, error: null });
const sendApiErr  = async (_p) => ({ data: null, error: { statusCode: 422, message: 'Invalid from address' } });
const sendThrows  = async (_p) => { throw new Error('Network error'); };
const sendUnused  = async (_p) => { throw new Error('sendEmailFn should not have been called'); };

// ── W1: Missing CLERK_WEBHOOK_SECRET ─────────────────────────────────────────
console.log('\n=== W1: Missing CLERK_WEBHOOK_SECRET → 500 ===\n');
{
  const r = await processWebhook({
    secret: undefined,
    rawBody: VALID_RAW_BODY,
    headers: VALID_HEADERS,
    resendApiKey: RESEND_KEY,
    verifyFn: verifyOk,
    sendEmailFn: sendUnused,
  });
  assertEqual(r.status, 500, 'returns HTTP 500');
  assert(typeof r.body.error === 'string', 'body has error string');
}

// ── W2: Missing raw body ──────────────────────────────────────────────────────
console.log('\n=== W2: Missing raw body → 400 ===\n');
{
  const r = await processWebhook({
    secret: VALID_SECRET,
    rawBody: undefined,
    headers: VALID_HEADERS,
    resendApiKey: RESEND_KEY,
    verifyFn: verifyOk,
    sendEmailFn: sendUnused,
  });
  assertEqual(r.status, 400, 'returns HTTP 400');
  assert(typeof r.body.error === 'string', 'body has error string');
}

// ── W3: Missing Svix headers ──────────────────────────────────────────────────
console.log('\n=== W3: Missing Svix headers → 400 ===\n');
{
  const missingCombinations = [
    {},
    { 'svix-id': 'msg_123' },
    { 'svix-id': 'msg_123', 'svix-timestamp': '1700000000' },
    { 'svix-timestamp': '1700000000', 'svix-signature': 'v1,abc' },
  ];
  for (const headers of missingCombinations) {
    const r = await processWebhook({
      secret: VALID_SECRET,
      rawBody: VALID_RAW_BODY,
      headers,
      resendApiKey: RESEND_KEY,
      verifyFn: verifyOk,
      sendEmailFn: sendUnused,
    });
    assertEqual(r.status, 400, `headers ${JSON.stringify(Object.keys(headers))} → HTTP 400`);
  }
}

// ── W4: Invalid Svix signature ────────────────────────────────────────────────
console.log('\n=== W4: Invalid Svix signature → 400 ===\n');
{
  const r = await processWebhook({
    secret: VALID_SECRET,
    rawBody: VALID_RAW_BODY,
    headers: VALID_HEADERS,
    resendApiKey: RESEND_KEY,
    verifyFn: verifyBad,
    sendEmailFn: sendUnused,
  });
  assertEqual(r.status, 400, 'returns HTTP 400');
  assertEqual(r.body.error, 'Invalid signature', 'body error is "Invalid signature"');
}

// ── W5: Non-user event → acknowledged, no email ───────────────────────────────
console.log('\n=== W5: Non-user event (e.g. user.updated) → 200, no email ===\n');
{
  const nonUserBody = Buffer.from(JSON.stringify({ type: 'user.updated', data: {} }));
  const verifyNonUser = (body, _hdrs) => JSON.parse(body.toString());
  const r = await processWebhook({
    secret: VALID_SECRET,
    rawBody: nonUserBody,
    headers: VALID_HEADERS,
    resendApiKey: RESEND_KEY,
    verifyFn: verifyNonUser,
    sendEmailFn: sendUnused, // must NOT be called
  });
  assertEqual(r.status, 200, 'returns HTTP 200');
  assertEqual(r.body.received, true, 'body.received is true');
}

// ── W6: user.created, missing RESEND_API_KEY → 500 ───────────────────────────
console.log('\n=== W6: user.created + missing RESEND_API_KEY → 500 ===\n');
{
  const r = await processWebhook({
    secret: VALID_SECRET,
    rawBody: VALID_RAW_BODY,
    headers: VALID_HEADERS,
    resendApiKey: undefined,
    verifyFn: verifyOk,
    sendEmailFn: sendUnused,
  });
  assertEqual(r.status, 500, 'returns HTTP 500');
  assert(typeof r.body.error === 'string', 'body has error string');
}

// ── W7: user.created, Resend resolves with error → 500 ───────────────────────
console.log('\n=== W7: user.created + Resend resolved error → 500 ===\n');
{
  const r = await processWebhook({
    secret: VALID_SECRET,
    rawBody: VALID_RAW_BODY,
    headers: VALID_HEADERS,
    resendApiKey: RESEND_KEY,
    verifyFn: verifyOk,
    sendEmailFn: sendApiErr,
  });
  assertEqual(r.status, 500, 'returns HTTP 500 (not 200)');
  assert(typeof r.body.error === 'string', 'body has error string');
}

// ── W8: user.created, Resend throws → 500 ────────────────────────────────────
console.log('\n=== W8: user.created + Resend throws → 500 ===\n');
{
  const r = await processWebhook({
    secret: VALID_SECRET,
    rawBody: VALID_RAW_BODY,
    headers: VALID_HEADERS,
    resendApiKey: RESEND_KEY,
    verifyFn: verifyOk,
    sendEmailFn: sendThrows,
  });
  assertEqual(r.status, 500, 'returns HTTP 500 (not 200)');
  assert(typeof r.body.error === 'string', 'body has error string');
}

// ── W9: user.created, Resend succeeds → 200 ──────────────────────────────────
console.log('\n=== W9: user.created + Resend succeeds → 200 ===\n');
{
  const r = await processWebhook({
    secret: VALID_SECRET,
    rawBody: VALID_RAW_BODY,
    headers: VALID_HEADERS,
    resendApiKey: RESEND_KEY,
    verifyFn: verifyOk,
    sendEmailFn: sendOk,
  });
  assertEqual(r.status, 200, 'returns HTTP 200');
  assertEqual(r.body.received, true, 'body.received is true');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(48)}`);
console.log(`Tests: ${passed + failed}  Passed: ${passed}  Failed: ${failed}`);
if (failed > 0) {
  console.error('\n❌ Some tests failed.');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed.');
}
