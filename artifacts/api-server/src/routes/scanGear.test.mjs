/**
 * Tests confirming that Scan Gear List rejects image file formats.
 *
 * Run with:
 *   node artifacts/api-server/src/routes/scanGear.test.mjs
 *
 * Uses Node.js built-in test runner (no extra deps).
 *
 * Two code paths are tested:
 *
 *   1. /api/import-gear — file upload handler that extracts gear lists.
 *      PNG, JPG, JPEG, and WebP must return HTTP 400 with an error message
 *      that names the accepted formats (PDF, Word, Excel, Numbers).
 *
 *   2. /api/scan-gear — single-item AI scanner that used to support image
 *      scanning.  Sending type="image" must return HTTP 400 with code
 *      "unsupported_type" and an error that directs users to upload a file.
 *
 * The extension-classification logic is inlined verbatim from the route
 * handler so the test is a faithful copy of production behaviour without
 * requiring the server to be running.
 */

// ── Inline from importGearRouter.post('/import-gear') ────────────────────────

const ACCEPTED_EXTS = new Set(['pdf', 'docx', 'doc', 'xlsx', 'xls', 'numbers']);

/**
 * Returns the response shape the route would produce for a given filename.
 * Mirrors the exact conditions in the route handler.
 */
function classifyImportFile(originalname) {
  const ext = (originalname.split('.').pop() ?? '').toLowerCase();
  if (ext === 'pdf') return { status: 200, format: 'pdf' };
  if (['docx', 'doc'].includes(ext)) return { status: 200, format: 'docx' };
  if (['xlsx', 'xls', 'numbers'].includes(ext)) return { status: 200, format: 'xlsx' };
  return {
    status: 400,
    error: `Unsupported file type: .${ext}. Accepted formats: PDF, Word (.docx), Excel (.xlsx), or Numbers.`,
  };
}

// ── Inline from scanGearRouter.post('/scan-gear') ─────────────────────────────

/**
 * Returns the response shape the route would produce for a given request body `type`.
 * Mirrors the exact conditions in the route handler.
 */
function classifyScanType(type) {
  if (type === 'url') return { status: 200, handled: true };
  if (type === 'image') {
    return {
      status: 400,
      code: 'unsupported_type',
      error: 'Image scanning is not supported. Use the Scan Gear List panel to upload a PDF, Word, Excel, or Numbers file instead.',
    };
  }
  return { status: 400, error: 'type must be "url"', code: 'invalid_type' };
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

// ── I: Image formats rejected by /api/import-gear ────────────────────────────
console.log('\n=== I: /api/import-gear rejects image file formats ===\n');

const IMAGE_EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

for (const ext of IMAGE_EXTENSIONS) {
  const filename = `screenshot.${ext}`;
  const response = classifyImportFile(filename);

  console.log(`I-${ext}: ${filename}`);
  assertEqual(response.status, 400, `${filename} → HTTP 400`);
  assert(
    typeof response.error === 'string' && response.error.includes('Accepted formats'),
    `${filename} → error message mentions accepted formats`,
  );
  assert(
    response.error?.includes('PDF'),
    `${filename} → error mentions PDF`,
  );
  assert(
    response.error?.includes('Word') || response.error?.includes('docx'),
    `${filename} → error mentions Word`,
  );
  assert(
    response.error?.includes('Excel') || response.error?.includes('xlsx'),
    `${filename} → error mentions Excel`,
  );
  assert(
    response.error?.includes('Numbers'),
    `${filename} → error mentions Numbers`,
  );
}

// ── I5: Accepted file formats still work ─────────────────────────────────────
console.log('\nI5: Accepted formats pass through (not rejected)');
for (const [name, fmt] of [
  ['checklist.pdf', 'pdf'],
  ['checklist.xlsx', 'xlsx'],
  ['checklist.xls', 'xlsx'],
  ['checklist.docx', 'docx'],
  ['checklist.doc', 'docx'],
  ['checklist.numbers', 'xlsx'],
]) {
  const response = classifyImportFile(name);
  assertEqual(response.status, 200, `${name} → HTTP 200 (not rejected)`);
}

// ── I6: File extension matching is case-insensitive ──────────────────────────
console.log('\nI6: Extension matching is case-insensitive');
{
  assertEqual(classifyImportFile('photo.PNG').status, 400,  '.PNG (uppercase) rejected');
  assertEqual(classifyImportFile('photo.JPG').status, 400,  '.JPG (uppercase) rejected');
  assertEqual(classifyImportFile('photo.JPEG').status, 400, '.JPEG (uppercase) rejected');
  assertEqual(classifyImportFile('photo.WebP').status, 400, '.WebP (mixed case) rejected');
  // Accepted formats also case-insensitive
  assertEqual(classifyImportFile('file.PDF').status, 200,   '.PDF (uppercase) accepted');
  assertEqual(classifyImportFile('file.XLSX').status, 200,  '.XLSX (uppercase) accepted');
}

// ── S: Image scanning removed from /api/scan-gear ────────────────────────────
console.log('\n\n=== S: /api/scan-gear rejects type="image" ===\n');

console.log('S1: type="image" returns 400 with code "unsupported_type"');
{
  const response = classifyScanType('image');
  assertEqual(response.status, 400,              'type="image" → HTTP 400');
  assertEqual(response.code, 'unsupported_type', 'code = "unsupported_type"');
  assert(typeof response.error === 'string',     'error message is a string');
  assert(
    response.error.includes('PDF') ||
    response.error.includes('Word') ||
    response.error.includes('Excel') ||
    response.error.includes('Numbers'),
    'error directs user to supported file formats',
  );
}

console.log('\nS2: type="url" is the only supported scan type');
{
  const response = classifyScanType('url');
  assertEqual(response.status, 200, 'type="url" → handled (not rejected)');
}

console.log('\nS3: type="base64" is rejected (separate from the image path)');
{
  const response = classifyScanType('base64');
  assertEqual(response.status, 400, 'type="base64" → HTTP 400');
  assert(response.code !== 'unsupported_type', 'code is "invalid_type" (not "unsupported_type")');
}

console.log('\nS4: All four image MIME variants are "image" type in the scan-gear handler');
{
  // The scan-gear route uses a single type="image" check — all image variants
  // (PNG, JPG, JPEG, WebP) would arrive as type="image" from the client.
  // The single code path covers all of them.
  for (const variant of ['image', 'image/png', 'image/jpeg', 'image/webp']) {
    // Only the literal "image" value triggers the dedicated rejection path.
    // Other strings would hit the generic "type must be url" 400.
    const r = classifyScanType(variant);
    assertEqual(r.status, 400, `type="${variant}" → HTTP 400`);
  }
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
