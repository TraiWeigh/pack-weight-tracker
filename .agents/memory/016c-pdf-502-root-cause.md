---
name: 016C PDF 502 root cause
description: Why PDF upload returns 502 and how to prevent it recurring
---

**Root cause confirmed (016C):** The Express API server on port 8080 was NOT_STARTED. Vite's dev proxy (`/api → localhost:8080`) returns HTTP 502 with `Content-Type: text/html` when nothing is listening. Frontend's content-type guard throws `Server error 502: unexpected response format.`

**Secondary risk fixed:** No timeout existed on `await inst.getText()`. If pdfjs-dist workers stall (promise never rejects), the request hangs → Vite proxy eventually returns 502. Fixed with 30-second `Promise.race` timeout.

**Fix applied in `importGear.ts` PDF route:**
- `Promise.race([inst.getText(), timeoutReject(30_000)])`
- `finally { try { inst.destroy(); } catch(_) {} }`
- Empty text check → 422 `code: image_only_pdf`
- Error codes on all PDF error paths

**Why:** pdf-parse v2.4.5 with pdfjs-dist v5.4.296 loads correctly; class API `new PDFParse({data, verbosity:0})` → `inst.getText()` is correct. The parse itself is not the issue.

**Fixtures added:** `attached_assets/trailweigh_gear_list_fixture.pdf` (15 items), `trailweigh_image_only_fixture.pdf`, `trailweigh_corrupt_fixture.pdf`

**Test suite added:** `importGear.pdf.api.test.mjs` (53 tests) — in `pnpm test:importer` (now 11 suites, 692 total).
