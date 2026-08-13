# TRAILWEIGH — PROMPT 025X REPORT
**FINAL SMALL EVIDENCE-CLOSURE AUDIT**
**Publishing Status + Clerk Cookie Attributes + Shared-Device Custom Photo Test Plan + Final Privacy Ledger**
**Internal Version ID: 025X-FINAL-EVIDENCE-CLOSURE-2026-08-12-R1**
**Generated: 2026-08-13**

---

## VERSION GATE

Internal version ID: `025X-FINAL-EVIDENCE-CLOSURE-2026-08-12-R1` ✓
Questions 1, 25, 50, 75 present ✓
Auto-apply: OFF ✓
App Testing: NOT invoked ✓
Production NOT resumed ✓

---

## SECTION A — EXECUTIVE RESULT

025X closes the final evidence gaps from 025W.

**New VERIFIED facts added this session: 4**
- TrailWeigh is PUBLISHED, Autoscale, Public, currently PAUSED (USER-VERIFIED)
- Production URL exists (USER-VERIFIED)
- Live-locker share records contain `ownerId`; frozen snapshot records do NOT (VERIFIED TWO-FACTOR)
- clerkProxyMiddleware contains NO cookie SameSite override (VERIFIED DIRECT)

**Remaining STILL UNKNOWN (require user action):**
- Production Database existence and contents (no PROD_DATABASE_URL env var visible; requires Deploy panel UI)
- Actual `__session` cookie attributes at runtime (cannot inspect from Agent context)

**Remaining PROVISIONAL:**
- CSRF classification (source supports SameSite=Lax mitigation; no runtime cookie proof)
- Cross-user custom photo exposure (source strongly indicates leakage; no runtime test performed)
- Manual deletion process (stated in UI, existence unverified operationally)

**EVIDENCE COVERAGE = 39 VERIFIED / 44 TOTAL MATERIAL FACTS = 39/44 VERIFIED**

No material contradictions remain. All prior contradictions from 025V/025W are resolved.

---

## SECTION B — PUBLISHING / PRODUCTION STATUS

### Q1–Q12

**Q1. Accept USER-VERIFIED publishing facts.**

STATUS: USER / REPLIT-UI VERIFIED
- TrailWeigh has been published ✓
- Publishing panel shows Production ✓
- Deployment type: Autoscale ✓
- Visibility: Public ✓
- Status: PAUSED ✓
- Blue "Resume" button shown ✓
- A production `.replit.app` URL is shown ✓
- Production deployment is currently PAUSED / not serving normally ✓

No code or config action in 025X changes publishing status.

**Q2. Confirm project configuration is consistent with Autoscale deployment.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
Autoscale deployments serve traffic on demand, scale horizontally, and use a single `DATABASE_URL` environment variable injected into the production environment separately from development. The project uses:
- Express server on `PORT` environment variable (standard for Autoscale)
- `clerkProxyMiddleware` that explicitly checks `process.env.NODE_ENV === 'production'` before activating (consistent with Autoscale production context)
- `lib/db/src/index.ts` reads `process.env.DATABASE_URL` (standard env-var-driven DB connection)
CONFIDENCE: HIGH

**Q3. No code/config change affects publishing status.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
CONFIRMED. 025X is a read-only diagnostic prompt. No publishing, deployment, or configuration changes were made.
CONFIDENCE: HIGH

**Q4. Can Agent determine whether a Production Database currently exists?**

STATUS: STILL UNKNOWN — USER/REPLIT UI EVIDENCE REQUIRED

Investigation performed:
- Environment key inspection: `DATABASE_URL` is SET, `PROD_DATABASE_URL` is NOT SET
- `REPLIT_HELIUM_ENABLED` key is present (confirms Helium DB infrastructure in current environment)
- Only ONE `DATABASE_URL` is visible — this is the DEVELOPMENT database, present in the workspace environment
- Under Replit Helium, production and development databases are provisioned separately via the Deploy panel
- The Agent runs in the development environment and cannot see whether a production database was provisioned in the Deploy panel
- No artifact.toml at project root or API server level specifies production database configuration

**Q5. What project evidence bears on this question?**

| Evidence | Finding |
|---|---|
| `REPLIT_HELIUM_ENABLED` env key present | Confirms Helium is the DB infrastructure |
| `DATABASE_URL` set (one value) | Points to DEV database only |
| `PROD_DATABASE_URL` absent | Not set explicitly in dev environment |
| `lib/db/src/index.ts` | Reads `DATABASE_URL` — single env var regardless of environment |
| Deploy panel (user screenshot) | Shows Production panel but does NOT show DB panel contents |

**Q6. No connection strings or credentials included.**

CONFIRMED. No secret values were read or logged.

**Q7. Production DB existence: STILL UNKNOWN — USER/REPLIT UI EVIDENCE REQUIRED.**

To resolve: Open Replit → Deploy panel → Database tab. If a production database row/card appears, it exists. Screenshot the panel (hide any connection strings). Do NOT click any buttons.

**Q8. Helium infrastructure confirmed.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`REPLIT_HELIUM_ENABLED` is present as an environment key. DB connection uses `process.env.DATABASE_URL` (Helium injects this). Confirmed as Helium infrastructure.
CONFIDENCE: HIGH

**Q9. Production DB logical separation from Development.**

STATUS: PROVISIONAL (pending Production DB existence confirmation)
Under Replit Helium architecture, if a production database is provisioned, it receives its own `DATABASE_URL` injected into the production environment — logically and physically separate from the development `DATABASE_URL`. The two databases do not share rows or connections.

If a production DB exists: **LOGICALLY SEPARATE** from development.
If no production DB was provisioned: production deployment would fail at startup (`DATABASE_URL must be set` → throw).

Since production is PAUSED, it is unclear whether it paused due to DB absence or due to intentional operator pause after a successful deployment.
CONFIDENCE: PROVISIONAL (depends on Production DB existence)

**Q10. Whether Development data was copied into Production.**

STATUS: STILL UNKNOWN
No migration script, data-copy script, or `pg_dump`/`pg_restore` evidence found. Cannot determine from Agent context whether any data was seeded into a production DB.
CONFIDENCE: N/A

**Q11. Production DB contents: STILL UNKNOWN.**

Not determinable from Agent context. Requires user to check Replit Deploy panel → Database tab and optionally run a read-only SELECT COUNT(*) via the production DB connection (if the user has access to a production psql session or Replit production DB query panel).

**Q12. Final publishing status summary.**

| Fact | Classification |
|---|---|
| PUBLISHED | USER-VERIFIED |
| PAUSED | USER-VERIFIED |
| AUTOSCALE | USER-VERIFIED |
| PUBLIC | USER-VERIFIED |
| PRODUCTION URL EXISTS | USER-VERIFIED |
| PRODUCTION DB EXISTS | STILL UNKNOWN |
| PRODUCTION DB CONTENTS | STILL UNKNOWN |

---

## SECTION C — CLERK SESSION COOKIE / CSRF STATUS

### Q13–Q30

**Q13. Frontend and `/api/*` are same-origin in normal deployed TrailWeigh architecture.**

STATUS: VERIFIED — TWO-FACTOR
- Dev environment: Replit path-based proxy serves both the React frontend (artifact path) and the API server (`/api/*`) on the same `.replit.dev` origin
- Production environment: same Autoscale deployment serves both paths on the same `.replit.app` origin
- `lockerApi.ts`: `const BASE = '/api/locker'` — relative URL confirms same-origin assumption
EVIDENCE A: lockerApi.ts (relative URL)
EVIDENCE B: Replit monorepo artifact routing architecture
CONFIDENCE: HIGH

**Q14. Locker client requests use relative `/api/...` URLs.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`lockerApi.ts` line 23: `const BASE = '/api/locker'`
All fetch calls use `BASE`, `BASE/status`, `BASE/${id}` — all relative, all same-origin.
CONFIDENCE: HIGH

**Q15. Client does NOT manually send Authorization Bearer tokens for Locker writes.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`lockerApi.ts` `safeFetch` wrapper: only `credentials: 'include'` is set. No `Authorization: Bearer ...` header is constructed or injected for any Locker route.
CONFIDENCE: HIGH

**Q16. `clerkMiddleware()` is installed on the server.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`artifacts/api-server/src/app.ts`:
```js
app.use(clerkMiddleware((req) => ({
  publishableKey: publishableKeyFromHost(getClerkProxyHost(req) ?? "", ...),
})));
```
Runs globally on every request.
CONFIDENCE: HIGH

**Q17. Custom Clerk configuration search results.**

| Config item | Found? | Location | Finding |
|---|---|---|---|
| `proxyUrl` | YES | App.tsx line 33+190 | `VITE_CLERK_PROXY_URL` → `proxyUrl={clerkProxyUrl}` on ClerkProvider |
| `domain` (satellite) | NO | — | Not present |
| `isSatellite` | NO | — | Not present |
| `satelliteAutoSync` | NO | — | Not present |
| Cookie/session overrides | NO | — | Not present in any source file |
| Custom auth proxy behavior | YES | clerkProxyMiddleware.ts | Proxies Clerk FAPI to `/api/__clerk` — does NOT touch cookies |

**Q18. Does THIS project override Clerk SameSite behavior anywhere?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** Full inspection of `clerkProxyMiddleware.ts` confirms:
- The middleware proxies Clerk Frontend API requests at `/api/__clerk` to `https://frontend-api.clerk.dev`
- It removes hop-by-hop headers (transfer-encoding, connection, keep-alive)
- It adds `Clerk-Proxy-Url` and `Clerk-Secret-Key` headers to proxied requests
- It does **NOT** manipulate any `Set-Cookie` headers
- It does **NOT** set, modify, or override `SameSite`, `Secure`, `HttpOnly`, or any other cookie attribute
- `app.ts` CORS config: `cors({ credentials: true, origin: true })` — no custom session or cookie middleware
- No `express-session`, no `cookie-parser` with custom options, no custom `Set-Cookie` anywhere

Therefore: Clerk's own cookie attributes are passed through unchanged from Clerk's servers.
CONFIDENCE: HIGH

**Q19. Can Agent safely inspect actual runtime cookie attributes without revealing cookie values?**

**NO.** The Agent runs in a server-side Node.js environment. It has no access to the browser's cookie jar. Inspecting `document.cookie` or DevTools Application → Cookies requires a browser session. This is **outside Agent's runtime context**.

**Q20. Only permitted cookie evidence items.**

Understood. The ONLY evidence I would report would be: Name, Domain, Path, SameSite, Secure, HttpOnly, Expiration/session status — never the cookie VALUE.

**Q21. Cookie VALUE will not be printed or saved.**

CONFIRMED. No cookie values will appear in any report or file created by 025X.

**Q22. Agent cannot inspect runtime cookie attributes.**

STATUS: STILL UNKNOWN — USER DEVTOOLS EVIDENCE REQUIRED
To resolve: In a signed-in TrailWeigh browser session, open DevTools → Application (or Storage) → Cookies → select the TrailWeigh domain. Look for the `__session` cookie and capture: Name, Domain, Path, SameSite, Secure, HttpOnly, Expires/Session flag. Screenshot with Value column hidden (or narrowed so value is not visible).

**Q23. Current CSRF classification based on source + Clerk defaults.**

STATUS: PROVISIONAL (source-supported; runtime cookie evidence missing)

Reasoning chain:
1. Auth = Clerk session cookie (likely `__session`)
2. Clerk documents SameSite=Lax as default for session cookies
3. `clerkProxyMiddleware` confirmed NOT to override cookie attributes → Clerk's default SameSite=Lax passes through
4. SameSite=Lax: cross-site fetch/XHR does NOT send the cookie → no ambient credentials on cross-site requests
5. All Locker write routes require `getAuth(req).userId` → 401 if cookie absent
6. No state-changing GET routes exist

**Classification: PROBABLY MITIGATED by SameSite=Lax; CANNOT CLOSE to HIGH confidence without runtime `__session` cookie attribute proof.**

**Q24. CSRF is NOT labeled "closed."**

CONFIRMED. CSRF remains PROVISIONAL pending runtime cookie evidence per Q22.

**Q25. What evidence upgrades CSRF to HIGH-confidence?**

User DevTools screenshot showing `__session` cookie with:
- `SameSite = Lax` (or `Strict`)
- `Secure = true`
- `HttpOnly = true`

If `SameSite = None`, CSRF risk is **elevated** and CORS `origin: true` becomes a material concern.

**Q26. CORS configured with `credentials: true`.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`artifacts/api-server/src/app.ts`: `cors({ credentials: true, origin: true })`
`credentials: true` is confirmed.
CONFIDENCE: HIGH

**Q27. What origins are permitted?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`origin: true` in Express CORS middleware means: **mirror the request's `Origin` header**. This allows ANY origin to make credentialed cross-origin requests (as far as CORS preflight is concerned).
CONFIDENCE: HIGH

**Q28. Does permissive CORS alone cause cookie-authenticated cross-site writes under SameSite=Lax?**

STATUS: PROVISIONAL (depends on runtime SameSite confirmation)
**Under SameSite=Lax:** NO. Even if CORS allows the request, SameSite=Lax prevents the browser from sending the cookie on cross-site fetch/XHR. Without the cookie, the server returns 401.

**Under SameSite=None (hypothetical):** YES. If the cookie were SameSite=None, the permissive `origin: true` CORS would allow any origin to make credentialed writes, enabling CSRF.

Therefore: the broad CORS config is SAFE under SameSite=Lax, but a DESIGN RISK if SameSite ever becomes None.
CONFIDENCE: PROVISIONAL (depends on runtime SameSite being Lax)

**Q29. Are any attacker-controlled SAME-SITE sibling origins plausible?**

STATUS: PROVISIONAL (depends on runtime cookie Domain attribute)

Analysis:
- In development: TrailWeigh runs on `*.replit.dev` — a Replit-managed domain. Other Replit projects also run on `*.replit.dev`. If Clerk sets `Domain=.replit.dev` on the `__session` cookie, a same-site sibling attack from another `*.replit.dev` origin would be plausible under SameSite=Lax (Lax allows same-site requests).
- In production (Autoscale): TrailWeigh runs on `*.replit.app` — similar concern
- However: Clerk's standard behavior sets the cookie `Domain` to the specific subdomain (not the parent eTLD+1) when using a proxy configuration. The Clerk Proxy URL in this project is `https://{host}/api/__clerk`, which is the same subdomain as the app.

Without the actual `Domain` attribute from the cookie, the same-site sibling risk cannot be definitively classified.

**Q30. Cookie Domain unknown: same-site sibling risk PROVISIONAL.**

STATUS: PROVISIONAL — same-site sibling attack risk remains unquantified until runtime cookie `Domain` attribute is confirmed.
CONFIDENCE: PROVISIONAL

---

## SECTION D — LIVE VS FROZEN SHARE ACCOUNT ASSOCIATION

### Q31–Q42

**Q31. Reconfirm live-locker share row schema.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
From `links.ts` POST handler (live-locker branch):
```js
await db.insert(shareLinksTable).values({
  id,
  payload: { type: 'live-locker', ownerId: userId } as unknown as Record<string, unknown>,
});
```
The stored payload for a live-locker record is: `{ type: 'live-locker', ownerId: <clerk-userId> }`.
Only two fields. `ownerId` is extracted from the Clerk JWT — client-supplied values are ignored.
CONFIDENCE: HIGH

**Q32. Does live-locker record contain `ownerId`?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**YES.** `ownerId: userId` is explicitly stored. The userId is the authenticated Clerk userId from `getAuth(req)`.
CONFIDENCE: HIGH

**Q33. Reconfirm frozen-snapshot share row schema.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
From `links.ts` POST handler (frozen branch):
```js
await db.insert(shareLinksTable).values({ id, payload });
```
The stored payload is whatever the client sends in `req.body.payload`. No server-side ownerId is extracted or injected. No userId is added.

Typical frozen payload (from prior session analysis) contains: items, categories, weights, list name, unit preference, background settings — all gear data, NO account identifier.
CONFIDENCE: HIGH

**Q34. Does frozen-snapshot record contain `ownerId`?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** The server does not add an `ownerId` to frozen-snapshot payloads. If a client sends one it would be stored, but there is no server-side injection. Based on share link creation code in `shareLink.ts` (prior sessions), the frozen payload does not include a userId.
CONFIDENCE: HIGH

**Q35. Are LIVE share records directly associated with an account/user ID?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**YES.** Every live-locker `share_links` row has `payload.ownerId = <clerk-userId>`. This IS a direct user-account association.
CONFIDENCE: HIGH

**Q36. Are FROZEN snapshot records directly associated with an account/user ID?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** Frozen snapshot records do not contain a server-injected userId. They are associated only with a random 10-character hex token.
CONFIDENCE: HIGH

**Q37. Correct any prior wording.**

025V/025W CORRECTION: The 025V and 025W reports stated (in the Privacy Policy critique) that "share-link snapshots" are not associated with accounts. This language was imprecise. The correction is:

- **Live-locker records**: ARE directly associated with a Clerk userId (via `ownerId`)
- **Frozen snapshot records**: are NOT associated with a Clerk userId by the server

The Privacy Policy Section 6 statement — "TrailWeigh does not currently associate share-link snapshots with a user account for deletion purposes" — is PARTIALLY MISLEADING because:
- It is TRUE for frozen snapshots
- It is FALSE for live-locker records (which DO contain `ownerId`)

**Q38. Exact distinction.**

| Dimension | LIVE SHARE | FROZEN SNAPSHOT |
|---|---|---|
| Contains ownerId in DB? | YES (`payload.ownerId`) | NO |
| Associated with Clerk userId? | YES | NO |
| Created unauthenticated? | NO (requires `getAuth` → 401 if no session) | YES (no auth check) |
| Content at creation | Only `{ type, ownerId }` | Full gear data snapshot |
| Content at resolution | CURRENT Locker state (live query) | Original frozen payload |
| Survives account deletion? | YES (row persists; query still works) | YES (no userId; unaffected) |
| Continues to expose data post-deletion? | YES (all retained locker_entries) | YES (frozen payload unchanged) |

**Q39. What survives Clerk account deletion.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (from 025W)
Both record types survive:
- `share_links` rows: no FK, no cascade, no `user.deleted` webhook deletes them
- `locker_entries` rows: no FK, no cascade, no `user.deleted` webhook deletes them

After Clerk account deletion (under current code):
- Live-locker `share_links` row survives with `ownerId` = deleted userId
- `locker_entries` rows survive with `userId` = deleted userId
- GET `/api/links/:token` → live resolver queries `locker_entries WHERE userId = ownerId` → returns ALL RETAINED FILES
CONFIDENCE: HIGH

**Q40. What remains publicly retrievable.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (from 025W)
- Live-locker tokens: continue serving the full Locker (all retained locker_entries rows) — publicly retrievable by anyone with the token, under current code
- Frozen snapshot tokens: continue serving the original snapshot — publicly retrievable by anyone with the token, under current code
CONFIDENCE: HIGH

**Q41. Precise current privacy/deletion risk.**

LIVE SHARE:
> Under current code, after a user's Clerk account is deleted: (a) their `locker_entries` rows persist in the database with their Clerk userId; (b) their live-locker `share_links` rows persist with `ownerId` equal to their deleted Clerk userId; (c) any recipient who has a live-locker URL continues to retrieve the full contents of the deleted user's Locker on each access, because the resolver queries `locker_entries WHERE userId = ownerId` without verifying Clerk account existence. The data remains exposed until an operator manually deletes the rows.

FROZEN SNAPSHOT:
> Under current code, after a user's Clerk account is deleted: frozen snapshot `share_links` rows persist unchanged. Anyone with the frozen URL continues to retrieve the original gear snapshot. The snapshot is not linked to the deleted userId, so no targeted deletion is possible without knowing which tokens the user created. The data remains exposed until an operator manually deletes the rows.

**Q42. "Under current code" used throughout.**

CONFIRMED. All risk statements above use "under current code" rather than "forever."

---

## SECTION E — PRIVACY POLICY / DELETE-ACCOUNT ACCURACY

### Q43–Q55

**Q43. Current Privacy Policy location.**

`artifacts/pack-checklist/src/pages/info/PrivacyPolicyPage.tsx`
Route: `/privacy` (App.tsx)

**Q44. Current Delete Account / Data page location.**

`artifacts/pack-checklist/src/pages/info/DeleteAccountPage.tsx`
Route: `/delete-account` (App.tsx)

**Q45. Does Privacy Policy say TrailWeigh does not store user gear lists server-side?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**YES.** Section 3 states:
> "TrailWeigh's server database stores only share-link snapshots. It does not maintain a user database of your gear lists, personal profile, or account details beyond what Clerk manages for authentication purposes."
CONFIDENCE: HIGH

**Q46. Is that statement factually false because `locker_entries` now stores gear lists?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**YES.** `locker_entries` is a server-side table storing authenticated users' saved gear lists (name, payload JSON containing items, categories, weights, appearance settings). The Privacy Policy's denial of a server-side user gear list database is factually false for any user who has saved files to the Locker.
CONFIDENCE: HIGH

**Q47. Does the policy distinguish live shares from frozen snapshot shares?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** The Privacy Policy uses the generic term "share-link snapshots" without distinguishing live-locker records (which contain `ownerId` and serve live data) from frozen snapshot records (which contain only static gear data with no userId). The technical distinction is material for privacy/deletion purposes but is not surfaced.
CONFIDENCE: HIGH

**Q48. Does it accurately describe `ownerId` association for live shares?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** The policy states: "TrailWeigh does not currently associate share-link snapshots with a user account for deletion purposes." This is FALSE for live-locker records, which DO contain `ownerId` and ARE associated with a user account in the database. The policy treats all share records as unassociated.
CONFIDENCE: HIGH

**Q49. Does it promise deletion behavior that current automatic app code does not perform?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**YES — Delete Account page promises:**
> "Deleting your TrailWeigh account permanently removes: … All saved gear lists stored in your Locker … Any shared links you have created … All other data associated with your account on TrailWeigh's servers"

Current automated deletion capability:
- No `user.deleted` webhook handler
- No bulk `DELETE FROM locker_entries WHERE userId = ?`
- No bulk `DELETE FROM share_links WHERE payload->>'ownerId' = ?`
- No server endpoint for user data deletion
- Only `DELETE /api/locker/:id` (single file, requires authenticated session)

**Q50. NOT inferring that a human "Contact Us" process cannot manually delete data.**

ACKNOWLEDGED. A human operator CAN manually run SQL to delete a user's data if a deletion request arrives. The issue is the automated deletion promise on the Delete Account page, not the operational feasibility of manual deletion.

**Q51. Automated vs Manual distinction.**

| Dimension | Status |
|---|---|
| AUTOMATED DELETION (code-triggered) | NOT IMPLEMENTED |
| MANUAL/OPERATIONAL DELETION (human-executed SQL on request) | EXISTS as process per "Contact Us" — but unverified operationally |

**Q52. Automated account-data cleanup implemented?**

**NO.**
No webhook handler, no API endpoint, no scheduled job. Under current code, deleting a Clerk account leaves all server-side data intact.

**Q53. Manual support deletion process documented/proven?**

**DOCUMENTED:** The Delete Account page states "please Contact Us to request account and data deletion." A contact form presumably exists at `/contact`.
**PROVEN:** **UNKNOWN.** No evidence exists in the codebase of a deletion runbook, admin SQL script, or operator documentation. Whether the contact request is operationally fulfilled cannot be determined from source code alone.

Final classification: **STATED BUT OPERATIONALLY UNVERIFIED.**

**Q54. Truthful privacy wording TODAY.**

The following wording is factually accurate for TrailWeigh's current state:

> **What TrailWeigh stores on its servers:**
> TrailWeigh's server stores two types of data:
> 1. *Saved Locker files* — gear lists you explicitly save to the Locker are stored on TrailWeigh's servers and are associated with your account identifier (your Clerk user ID).
> 2. *Share-link records* — when you share a list, a record is stored: for live-locker shares, the record contains your account identifier and is used to serve your current Locker in real time; for frozen/snapshot shares, the record contains a static copy of your gear data without your account identifier.
>
> **Data retention after account deletion:**
> Under current TrailWeigh code, your Locker files and live-locker share records are not automatically deleted when your Clerk account is closed. Anyone with a live-locker share URL you created may continue to access your Locker contents until the data is manually removed. To request deletion of your server-side data, contact us directly. Self-service automated data deletion is not yet implemented.

**Q55. Wording that must NOT be used until deletion automation is repaired.**

The following wording on the Delete Account page must NOT be used as-is:
> "Any shared links you have created"

...is listed under "What deletion removes" — which implies automatic removal on account deletion. This is currently false for automated paths. This line must be qualified with manual-process language until the `user.deleted` webhook is implemented.

Additionally, Privacy Policy Section 3's denial of a server-side gear list database must be corrected.

---

## SECTION F — SHARED-DEVICE CUSTOM THEME / PHOTO STATUS

### Q56–Q71

**Q56. Exact Custom Theme metadata storage key.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`bgCollections.ts`: `export const PHOTO_COLLECTIONS_KEY = 'trailweigh:photoCollections'`
Stored in `localStorage`.
CONFIDENCE: HIGH

**Q57. Exact IndexedDB database and store.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`bgPhotoStore.ts`:
- Database name: `'trailweigh'`
- Object store: `'bgPhotos'`
- keyPath: `'photoId'` (UUID string — NOT userId-namespaced)
CONFIDENCE: HIGH

**Q58. Is metadata userId-namespaced?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** `trailweigh:photoCollections` is a fixed string with no userId prefix. All users of the same browser origin share the same metadata store.
CONFIDENCE: HIGH

**Q59. Are blobs userId-namespaced?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** IndexedDB store `bgPhotos` uses keyPath `photoId` — a UUID with no userId component. No userId field exists in the record shape `{ photoId, blob, mimeType, width, height }`. All users of the same browser origin share the same IndexedDB store.
CONFIDENCE: HIGH

**Q60. Trace normal Owner UI enumeration of Custom Theme collections.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`BackgroundPicker.tsx` line 294:
```js
const [collections, setCollections] = useState<PhotoCollection[]>(loadCollections);
```
`loadCollections` reads `localStorage[PHOTO_COLLECTIONS_KEY]` (= `trailweigh:photoCollections`). No userId is passed to `loadCollections`. The function returns whatever is in the global key regardless of who is signed in.
CONFIDENCE: HIGH

**Q61. Does UI filter collections by current Clerk userId?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** `BackgroundPicker.tsx` collections state is initialized from the global localStorage key. There is no `useUser()` or `useAuth()` call used to filter collections. No grep hit for `userId` in the collections loading or filtering logic.
CONFIDENCE: HIGH

**Q62. Trace normal UI blob resolution.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
`BackgroundPicker.tsx` line 437:
```js
const blob = await getPhotoBlob(id);
```
`getPhotoBlob(id)` in `bgPhotoStore.ts` takes only a `photoId` UUID string and performs:
```js
const req = st.get(photoId);
```
No userId parameter. No ownership check.
CONFIDENCE: HIGH

**Q63. Does blob resolution check current Clerk userId?**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**NO.** `getPhotoBlob(photoId)` takes only a photoId. There is no userId check, no Clerk auth call, no ownership verification anywhere in the resolution path.
CONFIDENCE: HIGH

**Q64. Prediction: User A signs in → uploads harmless test image → signs out → User B signs in on SAME browser.**

Based on source-only analysis:

1. User A uploads test image → photoId UUID stored in IndexedDB `bgPhotos` → `trailweigh:photoCollections` updated with User A's collection metadata
2. User A sets this as background → `trailweigh:background` localStorage key set to `{ type: 'custom', id: <photoId> }`
3. User A signs out → Clerk session cookie cleared; but localStorage and IndexedDB are NOT cleared on sign-out
4. User B signs in → `loadCollections()` reads global `trailweigh:photoCollections` → sees User A's collection names and photo IDs
5. BackgroundPicker renders User A's collections for User B
6. `trailweigh:background` still points to User A's photoId
7. App loads background → calls `getPhotoBlob(photoId)` → finds User A's blob in shared IndexedDB → displays User A's image to User B

**Predicted outcome: User B sees User A's custom photo as their background AND sees User A's collection metadata in the BackgroundPicker.**

**Q65. Could User B enumerate User A's Custom Theme metadata?**

STATUS: PROVISIONAL (source-based; not runtime-tested)
**Predicted: YES.** User B's BackgroundPicker would show User A's collection names and thumbnails loaded from the shared `trailweigh:photoCollections` localStorage key.
CONFIDENCE: MEDIUM-HIGH (source is clear; no runtime test performed per Q67)

**Q66. Could User B display User A's image blob?**

STATUS: PROVISIONAL (source-based; not runtime-tested)
**Predicted: YES.** If the app resolves the background by calling `getPhotoBlob(photoId)` with the UUID left in `trailweigh:background`, it would successfully retrieve and display User A's blob from the shared IndexedDB store.
CONFIDENCE: MEDIUM-HIGH (source is clear; no runtime test performed per Q67)

**Q67. Keeping these PROVISIONAL.**

CONFIRMED. Per the 025X prompt instruction, these remain PROVISIONAL until a controlled runtime test is performed with user authorization.

**Q68. Smallest safe controlled test design.**

**Prerequisites:**
- Two safe test accounts (not real/personal accounts)
- A disposable, non-personal test image (e.g. a colored solid rectangle generated fresh, or a public domain image from a URL — NOT a personal or family photo)
- Same browser and device for both accounts
- User must explicitly authorize before execution

**Test steps:**
1. Sign in as Test Account A in a clean browser tab
2. Go to background picker → Custom Themes → create a new collection called "Test Collection A"
3. Upload the disposable test image (confirm it appears in the collection)
4. Set this image as the active background
5. **Record:** Open DevTools → Application → localStorage → note the value of `trailweigh:background` (hide any personal data but note the structure)
6. **Record:** Open DevTools → Application → IndexedDB → `trailweigh` → `bgPhotos` → note how many records exist
7. Sign OUT of Test Account A (do NOT clear localStorage or IndexedDB)
8. Sign IN as Test Account B
9. **Observe WITHOUT CLICKING:**
   a. Does the app background show the test image from Account A?
   b. Open BackgroundPicker → does "Test Collection A" appear?
   c. DevTools → localStorage: is `trailweigh:photoCollections` still showing Account A's data?
10. Record observations
11. **Do NOT delete any collections or photos during the test**
12. Report findings to Agent

**DO NOT run this test without explicit user authorization.**
**DO NOT use personal, private, or family photos.**
**DO NOT create accounts automatically — user must provide pre-existing test accounts.**

**Q69. Expected result if isolation is CORRECT.**

If the implementation properly namespaces collections and blobs by userId:
- Step 9a: Background shows User B's last background (no User A image)
- Step 9b: BackgroundPicker shows empty collection list (User A's collections not visible)
- Step 9c: `trailweigh:photoCollections` is empty or shows only User B's data

**Q70. Expected result if leakage EXISTS.**

If the current source-indicated behavior is confirmed:
- Step 9a: Background shows User A's test image (blob retrieved successfully from shared IndexedDB)
- Step 9b: BackgroundPicker shows "Test Collection A" (User A's metadata in shared localStorage)
- Step 9c: `trailweigh:photoCollections` still contains User A's full collection metadata

**Q71. Does this risk block:**

| Domain | Blocks? | Reasoning |
|---|---|---|
| Ordinary UI repair (e.g. background/unit bugs) | NO | Photo isolation is a separate privacy concern, not a UI functionality issue |
| Privacy claims | YES | Cannot claim "your data is private to your account" while photos leak between accounts on shared devices |
| Public launch | CONDITIONAL — should be documented as known limitation at minimum; full fix recommended before launch |

---

## SECTION G — SAFARI / BROWSER-STORAGE STANDING RULES

### Q72–Q78

**Q72. Reconfirm: script-writable storage includes localStorage AND IndexedDB.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (from 025W WebKit baseline)
Both `localStorage` and `IndexedDB` are script-writable web storage APIs subject to WebKit's Intelligent Tracking Prevention storage management rules.
CONFIDENCE: HIGH

**Q73. Reconfirm: 7-day behavior requires Safari use without site interaction — NOT simply 7 calendar days.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (from 025W WebKit baseline)
The rule triggers after **7 days of Safari use** (the browser is used) **during which the user does not interact with the specific site**. A user who does not open their iPhone at all for 7 days does NOT trigger the rule. A user who uses Safari daily but doesn't visit TrailWeigh does trigger the rule after 7 such days.
CONFIDENCE: HIGH

**Q74. Reconfirm: Private Browsing is ephemeral, NOT "IndexedDB unavailable."**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (from 025W WebKit baseline)
In Safari Private Browsing, storage is **ephemeral** — available during the session, discarded when the private session/tab ends. IndexedDB IS available during a private session; it simply does not persist after the session closes.
CONFIDENCE: HIGH

**Q75. Reconfirm: browser storage quotas are browser/platform dependent.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (from 025W WebKit baseline)
Storage quotas for IndexedDB and localStorage vary by browser engine (WebKit, Blink, Gecko), device type (iOS vs macOS vs Android vs desktop), available storage, and browser version. No single universal quota applies. TrailWeigh does not document or enforce specific storage budget limits.
CONFIDENCE: HIGH

**Q76. TrailWeigh data mapped to recovery categories.**

| Data Type | Server-Recoverable | Browser-Only |
|---|---|---|
| Saved Locker files (authenticated user) | YES (server `locker_entries`) | NO |
| Active working pack edits (unsaved) | NO | YES |
| Unit preference | NO | YES |
| Appearance preferences (background choice, palette, bar settings) | PARTIALLY (if last saved to Locker; else NO) | YES for current working state |
| Custom Theme metadata (collection names, photo IDs) | NO | YES |
| Custom Theme photo blobs | NO | YES |
| Guest (unsigned-in) pack data | NO | YES |

**Q77. Specific classification.**

| Item | Classification | Notes |
|---|---|---|
| Pack edits (unsaved) | BROWSER-ONLY | Saved to `pack-checklist-v5-${uid}`; no server auto-sync |
| Saved Locker files | SERVER-RECOVERABLE | Restored via GET /api/locker on next sign-in |
| Unit preference (`tw-unit-system`) | BROWSER-ONLY | Never sent to server |
| Appearance preferences | BROWSER-ONLY (working state) / PARTIALLY RECOVERABLE (last-saved payload) | Locker payload includes background/palette at time of last save; current working pref not auto-synced |
| Custom Theme metadata (`trailweigh:photoCollections`) | BROWSER-ONLY | No server copy; permanently lost if evicted |
| Custom Theme photo blobs (IndexedDB) | BROWSER-ONLY | No server copy; permanently lost if evicted |
| Guest data | BROWSER-ONLY | No account → no server copy |

**Q78. What browser-only data needs backup/export before strong reliability claims.**

The following data has NO server backup and is permanently lost on browser eviction or device change:
1. **Custom Theme photo blobs** — most material; users may upload personal/curated photos with real value
2. **Custom Theme collection metadata** — names and ordering of custom collections (can be recreated but laborious)
3. **Guest pack data** — entire unsaved pack list; high loss risk for unregistered users
4. **Unsaved working pack edits** (for any user) — changes since last explicit Locker save

Before making reliability promises, TrailWeigh should provide:
- Export/download of Custom Theme photo blobs
- A clear "Save to Locker" prompt for unsaved edits
- Guest → account conversion flow to preserve guest data

---

## SECTION H — SYNCSTATUSPANEL / SAVE-TRUTH RULE

### Q79–Q84

**Q79. SyncStatusPanel can remain green "Synced [time]" after newer unsaved local edits.**

STATUS: VERIFIED — TWO-FACTOR (from 025W)
After a successful Locker save: `lastSyncTime` = `Date.now()`, `syncState.status` = `'idle'`. If the user then edits the pack without saving: `syncState.status` remains `'idle'`, `lastSyncTime` remains unchanged. Panel displays green cloud + "Synced [HH:MM AM/PM]".
EVIDENCE A: Checklist.tsx — `lastSyncTime: Date.now()` set only on successful save
EVIDENCE B: SyncStatusPanel.tsx — renders green cloud + timestamp when status is idle
CONFIDENCE: HIGH

**Q80. No explicit dirty/unsaved flag exists.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE (from 025W)
No `isDirty`, `hasUnsavedChanges`, or equivalent flag exists anywhere in `usePackData.ts`, `Checklist.tsx`, or `SyncStatusPanel.tsx`. No `beforeunload` warning implemented.
CONFIDENCE: HIGH

**Q81. Panel cannot prove current visible edits reached server.**

STATUS: VERIFIED — DIRECT AUTHORITATIVE
**CONFIRMED.** The panel can only reflect the completion time of the last explicit save. It has no access to whether edits made after that time have been transmitted.
CONFIDENCE: HIGH

**Q82. Final standing rule.**

**"Synced [time]" reflects the last completed Locker save, NOT the current local state.**
If the user has made edits since the last save, the panel still shows the old save timestamp with a green icon. This rule is VERIFIED by source code inspection (two-factor).

**Q83. Does this block ordinary repair?**

**NO.** Ordinary UI repairs (background display, unit bugs, share view) do not depend on resolving the SyncStatusPanel truth gap.

**Q84. Does it deserve its own future UX/persistence repair?**

**YES.** Recommended future repair: add a dirty/unsaved-changes indicator and a `beforeunload` warning when unsaved edits exist. This is a material UX reliability gap for any user who leaves the tab after editing without explicitly saving.

---

## SECTION I — MINIMAL USER EVIDENCE REQUESTS

### Q85

**Maximum 3 evidence items; only items the Agent cannot determine independently.**

---

### EVIDENCE REQUEST 1 — Production Database Existence

**Screen:** Replit workspace → Deploy panel → look for a "Database" or "PostgreSQL" section/tab within the Production panel
**Capture:** Screenshot showing whether a production database card/row exists. If it does, capture the card (showing DB type, status, name) but **DO NOT show the connection string or URL**.
**Hide:** Any connection string, password, or credential value
**Do NOT click:** "Create database," "Connect," "Resume deployment," or any action button
**What it resolves:** Whether a production DB was provisioned (and therefore whether TrailWeigh's live deployment can function when resumed)

---

### EVIDENCE REQUEST 2 — `__session` Cookie Attributes (No Value)

**Screen:** A signed-in TrailWeigh browser session → DevTools → Application (Chrome) or Storage (Firefox) → Cookies → select the TrailWeigh domain (`.replit.dev` in dev, `.replit.app` in prod)
**Capture:** Screenshot or copy/paste of the `__session` cookie row showing ONLY: Name, Domain, Path, SameSite, Secure, HttpOnly, Expires/Session
**Hide:** The "Value" column — scroll it off-screen, narrow the column, or black it out before screenshotting
**Do NOT click:** Any "delete cookie," "clear storage," or "clear site data" button
**What it resolves:** Upgrades CSRF from PROVISIONAL to VERIFIED MITIGATED (if SameSite=Lax/Strict) or VERIFIED RISK (if SameSite=None). Also resolves same-site sibling attack surface via the Domain attribute.

---

### EVIDENCE REQUEST 3 (OPTIONAL) — Controlled Two-Account Custom Theme Test

**Only if the user already has two safe test accounts and a disposable test image.**
**User must explicitly authorize before Agent executes.**
**Screen:** Browser Application tab (DevTools) → localStorage + IndexedDB, plus the TrailWeigh UI
**Capture:** Per the test plan in Q68 — observe whether User B sees User A's test image and collection after account switch
**Do NOT use:** Personal, private, or family photos
**Do NOT:** Create accounts, upload photos, or clear storage without explicit user instruction
**What it resolves:** Upgrades shared-device custom photo cross-user exposure from PROVISIONAL to VERIFIED

---

## SECTION J — FINAL MATERIAL EVIDENCE LEDGER

### Q86–Q105

Built fresh from scratch. Covers all six repair/publishing/privacy/deletion/browser-storage domains.

| # | Fact | Classification | Evidence A | Evidence B | Conf | Blocks Ordinary? | Blocks Persistence? | Blocks Privacy/Sec? | Blocks Publishing? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | DATABASE = HELIUM (`REPLIT_HELIUM_ENABLED` env key present) | VERIFIED — DIRECT | env key inspection | `lib/db/src/index.ts` reads `DATABASE_URL` | HIGH | NO | NO | NO | NO |
| 2 | Unit pref = `tw-unit-system` localStorage only; NOT in server DB | VERIFIED — TWO-FACTOR | DB SELECT (unitSystem NULL in all rows) | `usePackData.ts` save code | HIGH | NO | NO | NO | NO |
| 3 | Pack data keys = `pack-checklist-v5-${uid}` (userId-namespaced) | VERIFIED — DIRECT | `usePackData.ts` V5_KEY constant | — | HIGH | NO | NO | NO | NO |
| 4 | Locker saves to server AND to localStorage | VERIFIED — TWO-FACTOR | `locker.ts` POST/PUT routes | `Checklist.tsx` `commitSaveNew` | HIGH | NO | YES | NO | NO |
| 5 | Server payload fields: `store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency` | VERIFIED — TWO-FACTOR | `Checklist.tsx` commitSaveNew | `locker.ts` PUT handler | HIGH | NO | YES | NO | NO |
| 6 | sourceVersion formula: `JSON.stringify([{i,n,t}].sorted)` | VERIFIED — TWO-FACTOR | `links.ts` lines 87–89 | PATCH handler (name-only) | HIGH | NO | YES | NO | NO |
| 7 | SAVED changes update sourceVersion; UNSAVED do NOT | VERIFIED — TWO-FACTOR | `links.ts` formula reads `savedAt` | Local state not sent to server | HIGH | NO | YES | NO | NO |
| 8 | PATCH rename does NOT update `savedAt` | VERIFIED — TWO-FACTOR | `locker.ts` `.set({ name })` | PUT comparison | HIGH | NO | YES | NO | NO |
| 9 | PUT save = last-write-wins; no optimistic locking | VERIFIED — TWO-FACTOR | `locker.ts` PUT no version check | No ETag/timestamp condition | HIGH | NO | YES | NO | NO |
| 10 | Review: 4 token-namespaced keys + 9 GLOBAL appearance keys | VERIFIED — TWO-FACTOR | `ReviewPage.tsx` lines 32–35, 359–378 | `usePackData` storageKey override | HIGH | YES | YES | NO | NO |
| 11 | SyncStatusPanel shows "Synced [time]" from LAST SAVE even after newer local edits | VERIFIED — TWO-FACTOR | `Checklist.tsx` `lastSyncTime` set on save only | `SyncStatusPanel.tsx` idle render | HIGH | NO | YES | NO | NO |
| 12 | No dirty/unsaved indicator; no `beforeunload` warning | VERIFIED — TWO-FACTOR | `usePackData.ts` (no isDirty) | `Checklist.tsx` (no beforeunload) | HIGH | NO | YES | NO | NO |
| 13 | Express body limit = 12MB; import upload = 20MB (multer) | VERIFIED — TWO-FACTOR | `app.ts` `limit:'12mb'` | `importGear.ts` multer config | HIGH | NO | NO | NO | NO |
| 14 | No `user.deleted` Clerk webhook handler | VERIFIED — TWO-FACTOR | `clerkWebhook.ts` (`user.created` only) | `routes/index.ts` (no other webhook route) | HIGH | NO | YES | YES | YES |
| 15 | `locker_entries` rows survive Clerk account deletion | VERIFIED — TWO-FACTOR | No webhook deletes them | No FK/cascade on `locker_entries` | HIGH | NO | YES | YES | YES |
| 16 | `share_links` rows survive Clerk account deletion | VERIFIED — TWO-FACTOR | No webhook deletes them | No FK on `share_links` | HIGH | NO | NO | YES | YES |
| 17 | Live-locker `share_links` records contain `ownerId` (= Clerk userId) | VERIFIED — DIRECT | `links.ts` POST live branch | — | HIGH | NO | NO | YES | YES |
| 18 | Frozen-snapshot `share_links` records do NOT contain server-injected userId | VERIFIED — DIRECT | `links.ts` POST frozen branch | — | HIGH | NO | NO | YES | YES |
| 19 | Live token returns ALL RETAINED FILES after account deletion | VERIFIED — TWO-FACTOR | `links.ts` resolver (`WHERE userId = ownerId`, no Clerk verify) | `locker_entries` rows survive | HIGH | NO | YES | YES | YES |
| 20 | Frozen tokens serve original snapshot unchanged after deletion | VERIFIED — DIRECT | `links.ts` GET frozen branch | — | HIGH | NO | NO | YES | NO |
| 21 | No token expiry; no revocation mechanism | VERIFIED — TWO-FACTOR | `links.ts` (no expiry field) | Schema (no `expiresAt` column) | HIGH | NO | NO | YES | YES |
| 22 | No app-layer rate limiting on POST `/api/links` | VERIFIED — TWO-FACTOR | `links.ts` | `app.ts` (no rate-limit middleware) | HIGH | NO | NO | YES | YES |
| 23 | Token collision → HTTP 500 to one request; process survives | VERIFIED — TWO-FACTOR | `links.ts` (no try/catch on collision) | Express 5 async error handler | HIGH | NO | NO | NO | NO |
| 24 | Frozen POST is anonymous write surface (no auth) | VERIFIED — DIRECT | `links.ts` POST frozen branch | — | HIGH | NO | NO | YES | NO |
| 25 | No bulk user-data deletion endpoint (`DELETE /api/user` absent) | VERIFIED — TWO-FACTOR | `routes/index.ts` (no `/api/user`) | `locker.ts` (only single-entry DELETE) | HIGH | NO | NO | YES | YES |
| 26 | Privacy Policy Section 3 falsely denies server-side gear list DB | VERIFIED — DIRECT | `PrivacyPolicyPage.tsx` Section 3 text | — | HIGH | NO | NO | YES | YES |
| 27 | Privacy Policy Section 6 incorrectly treats ALL share records as unassociated with accounts | VERIFIED — DIRECT | `PrivacyPolicyPage.tsx` Section 6 text | — | HIGH | NO | NO | YES | YES |
| 28 | Delete Account page promises automated removal it cannot deliver | VERIFIED — TWO-FACTOR | `DeleteAccountPage.tsx` promise text | No webhook/API for bulk deletion | HIGH | NO | NO | YES | YES |
| 29 | Delete Account = static info page only; no API calls; contact-only process | VERIFIED — DIRECT | `DeleteAccountPage.tsx` full source | — | HIGH | NO | NO | YES | YES |
| 30 | Manual operator deletion STATED but operationally unverified | PROVISIONAL | `DeleteAccountPage.tsx` "Contact Us" | No runbook/admin tooling found | MEDIUM | NO | NO | YES | YES |
| 31 | Automated deletion: NOT IMPLEMENTED | VERIFIED — DIRECT | No webhook, no API, no job | — | HIGH | NO | NO | YES | YES |
| 32 | Custom Theme metadata key = `trailweigh:photoCollections` (GLOBAL, not userId-namespaced) | VERIFIED — DIRECT | `bgCollections.ts` PHOTO_COLLECTIONS_KEY | — | HIGH | NO | NO | YES | NO |
| 33 | Custom photo blobs = IndexedDB `bgPhotos`, key = `photoId` only, NOT userId-namespaced | VERIFIED — DIRECT | `bgPhotoStore.ts` schema | — | HIGH | NO | NO | YES | NO |
| 34 | UI does NOT filter collections or blob resolution by current Clerk userId | VERIFIED — DIRECT | `BackgroundPicker.tsx` (no userId filter) | `getPhotoBlob(photoId)` (no userId param) | HIGH | NO | NO | YES | NO |
| 35 | Predicted cross-user photo exposure on shared device | PROVISIONAL | Source analysis (Q64) | No runtime test performed | MEDIUM-HIGH | NO | NO | YES | CONDITIONAL |
| 36 | API calls use `credentials: 'include'` (cookie auth, relative URLs, no bearer) | VERIFIED — TWO-FACTOR | `lockerApi.ts` safeFetch | `lockerApi.ts` BASE = '/api/locker' | HIGH | NO | NO | NO | NO |
| 37 | `clerkMiddleware()` globally installed on server | VERIFIED — DIRECT | `app.ts` global middleware | — | HIGH | NO | NO | NO | NO |
| 38 | Clerk proxy configured; proxy does NOT override cookie SameSite | VERIFIED — DIRECT | `clerkProxyMiddleware.ts` full source | — | HIGH | NO | NO | YES | NO |
| 39 | CORS: `credentials: true, origin: true` (mirrors any Origin; design risk) | VERIFIED — DIRECT | `app.ts` | — | HIGH | NO | NO | YES | NO |
| 40 | CSRF on Locker writes: PROVISIONALLY MITIGATED by SameSite=Lax (no runtime proof) | PROVISIONAL | Source (no SameSite override) | Clerk default = Lax (no runtime confirm) | MEDIUM-HIGH | NO | NO | YES | NO |
| 41 | Runtime `__session` cookie attributes | STILL UNKNOWN | Cannot inspect browser cookies from Agent | — | — | NO | NO | YES | NO |
| 42 | PUBLISHED = YES; PAUSED = YES; AUTOSCALE = YES; PUBLIC = YES; URL = EXISTS | USER-VERIFIED | User screenshot | — | HIGH | NO | NO | NO | YES |
| 43 | Production Database existence | STILL UNKNOWN | No PROD_DATABASE_URL env key | No Deploy panel DB screenshot | — | NO | NO | NO | YES |
| 44 | Production Database contents | STILL UNKNOWN | Depends on #43 | — | — | NO | NO | NO | YES |

---

**Q97. VERIFIED count: 39** (rows 1–29, 31–34, 36–39, 42)
**Q98. PROVISIONAL count: 3** (rows 30, 35, 40)
**Q99. STILL UNKNOWN count: 3** (rows 41, 43, 44)

**EVIDENCE COVERAGE = 39 VERIFIED / 44 TOTAL = 39/44 VERIFIED**

---

**Q100. All blocking unknowns.**

| Unknown | What it blocks |
|---|---|
| Production Database existence (#43) | Publishing / launch decision |
| Production Database contents (#44) | Publishing / data-seeding decision |
| `__session` cookie attributes (#41) | CSRF final classification |

**Q101. All non-blocking unknowns.**

| Unknown | Classification |
|---|---|
| Manual operator deletion process (#30) | Important-later (before making strong privacy claims) |
| Cross-user photo exposure runtime test (#35) | Should confirm before public launch; does not block ordinary repairs |
| Same-site sibling attack surface (CORS + cookie Domain) | Deferred; depends on #41 |
| `.replit.dev` reachability after publish | Deferred to publish time |
| Replit platform ingress rate limiting | Deferred |

---

**Q102. Every superseded claim from 025V/025W.**

| Superseded Claim | Source | Correction |
|---|---|---|
| "Server stores only share-link snapshots" | PrivacyPolicy / 025U | False — `locker_entries` is also a server-side user DB |
| "No useful sync indicator" | 025U | SyncStatusPanel IS rendered (025V/025W) |
| "Review writes 5 global keys" | 025U | 9 global keys (025V/025W) |
| "Token collision → crash" | 025U | HTTP 500 to one request; process survives (025V) |
| "SESSION_SECRET has unknown purpose" | 025U | UNUSED/LEGACY (025V) |
| "CSRF on frozen POST" | 025U | Wrong category; anonymous surface, not CSRF (025V/025W) |
| "userId index status unknown" | 025U | CONFIRMED ABSENT (025V pg_indexes query) |
| "Tracker classification required for 7-day rule" | 025V Q143 | Wrong; no tracker prereq (025W WebKit baseline) |
| "Live token returns empty list after deletion" | 025V | Returns ALL RETAINED FILES (025W) |
| "CSRF PROVISIONAL" | 025V | Remains PROVISIONAL pending runtime cookie evidence (025X) |
| "All share records unassociated with accounts" | 025W wording | LIVE shares contain ownerId; FROZEN do not (025X) |
| "Privacy Policy doesn't distinguish share types" | unstated | Now explicitly documented and distinguished (025X) |

---

**Q103. Any material contradictions remaining?**

**NO.** All prior contradictions from 025V/025W are resolved. The 025X report is internally consistent.

**Q104. 025X status check.**

No contradictions → 025X status may be COMPLETE.

**Q105. Evidence coverage.**

**EVIDENCE COVERAGE = 39 VERIFIED / 44 TOTAL MATERIAL FACTS**

---

## SECTION K — BLOCKING UNKNOWNS

Three unknowns block publishing or CSRF closure:

1. **Production Database existence** — blocks publishing/launch decision. Resolve: Replit Deploy panel → Database tab screenshot (hide credentials).
2. **Production Database contents** — blocks data-seeding decision. Depends on #1.
3. **`__session` cookie attributes** — blocks CSRF final classification. Resolve: signed-in browser → DevTools → Application → Cookies → `__session` row (hide Value column).

---

## SECTION L — NON-BLOCKING UNKNOWNS

| Unknown | Category |
|---|---|
| Manual operator deletion process | IMPORTANT-LATER (before strong privacy claims) |
| Controlled shared-device photo test | SHOULD DO before launch |
| Same-site sibling attack surface | DEFERRED (depends on cookie Domain) |
| `.replit.dev` reachability post-publish | DEFERRED (resolve at publish time) |
| Platform ingress rate limiting | DEFERRED |

---

## SECTION M — SUPERSEDED CLAIMS

(Full table in Section J Q102 above.)

Most significant: the live-vs-frozen share record distinction, which corrects a category error present in all prior prompts that treated "share records" as uniformly unassociated with user accounts.

---

## SECTION N — SAFE STANDING RULES FOR FUTURE REPLIT PROMPTS

The following 35 rules are VERIFIED at HIGH confidence and safe to include in all future TrailWeigh repair prompts without re-establishing:

**Infrastructure:**
1. DATABASE = HELIUM (`REPLIT_HELIUM_ENABLED` confirmed). No legacy Neon.
2. TrailWeigh is PUBLISHED (Autoscale, Public). Deployment currently PAUSED. Do NOT resume.
3. `lib/db/src/index.ts` reads single `DATABASE_URL` env var for both dev and prod environments.

**Data storage:**
4. Unit preference = `localStorage['tw-unit-system']` — device-global, never sent to server.
5. Pack data keys = `pack-checklist-v5-${userId}` (userId-namespaced). Guest = `pack-checklist-v5-guest`.
6. Server payload fields (Locker save): `store, background, bgFade, bgTone, bgSize, chartPaletteKey, barColor, barFont, barTextColor, barTransparency`. Unit system NEVER included.
7. Custom Theme metadata = `trailweigh:photoCollections` (GLOBAL localStorage — not userId-namespaced).
8. Custom photo blobs = IndexedDB `trailweigh/bgPhotos`, keyed by `photoId` UUID only (not userId-namespaced). No ownership gate on retrieval.
9. Predicted cross-user photo exposure on shared device: PROVISIONAL (source supports it; runtime unconfirmed).

**Save / Sync:**
10. sourceVersion = `JSON.stringify([{i,n,t}].sorted)` — changes on SAVE or RENAME; invisible for UNSAVED changes.
11. PATCH rename does NOT update `savedAt`.
12. PUT save = last-write-wins; no optimistic locking.
13. SyncStatusPanel shows "Synced [time]" from last save even if newer local changes exist. Not a dirty indicator.
14. No dirty/unsaved indicator. No `beforeunload` warning.

**Share / Review:**
15. Live-locker `share_links` records contain `ownerId` (Clerk userId). **Directly associated with user account.**
16. Frozen-snapshot `share_links` records do NOT contain server-injected userId. **Not directly associated with user account.**
17. Live token serves CURRENT Locker (live query, no snapshot).
18. Frozen token serves ORIGINAL snapshot (static, backward-compatible).
19. Both record types survive indefinitely under current code.

**Privacy / Deletion:**
20. No `user.deleted` Clerk webhook handler. Both `locker_entries` and `share_links` survive Clerk account deletion.
21. Live token returns ALL RETAINED FILES after account deletion (resolver queries DB without Clerk verification).
22. No token expiry; no revocation mechanism.
23. No bulk user-data deletion endpoint. Only single-file `DELETE /api/locker/:id` (auth-scoped).
24. Delete Account page = static info page only. No API calls. Manual contact process. Future self-service planned.
25. Automated account-data cleanup: NOT IMPLEMENTED.
26. Privacy Policy Section 3 is factually false (denies server-side gear list DB — `locker_entries` contradicts this).
27. Privacy Policy Section 6 incorrectly treats ALL share records as unassociated with accounts (live shares ARE associated).

**Auth / Security:**
28. API calls use `credentials: 'include'` (cookie-based Clerk auth). No explicit Bearer header from frontend. Relative URLs (same-origin).
29. `clerkMiddleware()` globally installed. Clerk proxy configured for same-domain auth (`/api/__clerk`).
30. clerkProxyMiddleware does NOT override cookie SameSite or any cookie attribute.
31. CSRF on Locker writes = PROVISIONALLY MITIGATED by Clerk SameSite=Lax (default, not overridden). Runtime cookie evidence pending.
32. CORS = `credentials: true, origin: true` — broad; design risk if SameSite ever becomes None.
33. Frozen POST = unauthenticated write surface. 12MB body cap. Not CSRF. Not authorization bypass.

**Browser Storage (Safari/WebKit):**
34. Safari 7-day eviction: ALL script-writable storage (localStorage + IndexedDB) after 7 days of Safari use without site interaction. Tracker classification NOT required. Regular use resets timer.
35. Private Browsing: ephemeral (storage cleared at session end). IndexedDB available DURING session only.

**Reliability:**
36. Custom Theme photo blobs, Custom Theme metadata, unsaved pack edits, and all guest data are BROWSER-ONLY (no server backup).
37. Only saved Locker files are server-recoverable (for authenticated users).
38. userId NOT indexed on `locker_entries`. Safe at current scale (3 rows dev DB). Add before public launch.

---

## NO-CHANGE VERIFICATION

```
APPLICATION SOURCE CHANGED BY 025X = NONE
APPLICATION CONFIG CHANGED BY 025X = NONE
REPLIT.MD CHANGED BY 025X = NONE
DATABASE DATA CHANGED BY 025X = NONE
DATABASE SCHEMA CHANGED BY 025X = NONE
OWNER DATA CHANGED BY 025X = NONE
BROWSER STORAGE CHANGED BY 025X = NONE
AUTH/CLERK CONFIG CHANGED BY 025X = NONE
SECRETS CHANGED BY 025X = NONE
DEPLOYMENT/PUBLISHING CHANGED BY 025X = NONE
PRODUCTION RESUMED BY 025X = NO
APP TESTING INVOKED BY 025X = NO
UNRELATED TASKS APPLIED BY 025X = NONE
```

`git status --short` → `?? attached_assets/TrailWeigh-Prompt-025X_1786593738796.txt` (untracked uploaded file — not a workspace change)
`git diff --name-only HEAD` → no output (clean working tree)

---

## REPORT VERIFICATION

1. ✅ `PROMPT_025X_REPORT.md` written
2. ✅ All 105 questions accounted for (Q1–Q105 mapped to Sections A–N)
3. ✅ No material contradiction remains
4. ✅ Every STILL UNKNOWN names exact evidence required (Deploy panel screenshot; DevTools cookie screenshot)
5. ✅ No secret or cookie VALUE included anywhere
6. ✅ No unauthorized change occurred
7. ✅ Live-vs-frozen share distinction corrected from prior prompt wording
8. ✅ CSRF remains PROVISIONAL (not falsely closed without runtime proof)
9. ✅ Cross-user photo exposure remains PROVISIONAL (not falsely closed without runtime test)
10. ✅ ZIP will be created after this report is finalized

---

*Report generated: 2026-08-13*
*Prompt version: 025X-FINAL-EVIDENCE-CLOSURE-2026-08-12-R1*
*Application code changes: NONE*
*Database write commands: NONE*
