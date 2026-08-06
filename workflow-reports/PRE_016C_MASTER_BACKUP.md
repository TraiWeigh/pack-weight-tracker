# PRE-016C MASTER BACKUP

Created before any Prompt 016C edits were made to application code.

---

## Backup Verification

| Field | Value |
|-------|-------|
| **Master file** | `TRAILWEIGH_COMPLETE_WORKFLOW.md` |
| **Master line count** | 2325 |
| **Master file size** | 110,301 bytes |
| **Backup line count** | 2325 |
| **Backup file size** | 110,301 bytes |
| **Backup created** | 2026-08-06 |

---

## Starting State — PDF Import

| Field | Value |
|-------|-------|
| **PDF parser package** | `pdf-parse` |
| **Exact installed version** | 2.4.5 |
| **Parser sub-dependency** | `pdfjs-dist@5.4.296` |
| **Parser import syntax** | `const { PDFParse } = require('pdf-parse')` (CJS require in build banner) |
| **Parser invocation syntax** | `new PDFParse({ data: buffer, verbosity: 0 })` then `await inst.getText()` |
| **Timeout guard** | None (could hang indefinitely if pdfjs-dist workers stall) |
| **destroy() call** | Not present |
| **Image-only PDF detection** | Not present (returned empty items array; frontend showed "no gear items" not a specific message) |
| **Error code fields** | Not present (no `code:` in error JSON) |
| **Frontend upload endpoint** | `POST /api/import-gear` (fetch via Vite dev proxy) |
| **Server route** | `POST /api/import-gear` in `artifacts/api-server/src/routes/importGear.ts` |
| **Request method** | POST multipart/form-data |
| **Request body type** | `FormData` with field name `file` |
| **Maximum upload size** | 20 MB (multer limit) |
| **Timeout behavior** | No timeout on PDF parsing — could hang indefinitely |
| **Success response schema** | `{ items: ExtractedItem[] }` (max 200) |
| **Error response schema** | `{ error: string }` (no code field) |
| **Frontend response parser** | Checks `content-type` includes `application/json`; throws `Server error ${status}: unexpected response format.` if not JSON |
| **Replit server** | Express 5 on port 8080 |
| **Proxy path** | Vite dev server proxies `/api` → `http://localhost:8080` |

---

## Confirmed Failure at Start of 016C

The API server workflow was `NOT_STARTED` before Prompt 016C.

When not running, the Vite proxy cannot reach `http://localhost:8080` and returns an HTTP 502 response with `Content-Type: text/html`. The frontend's content-type check fails and throws:

```
Server error 502: unexpected response format.
```

---

## Complete TRAILWEIGH_COMPLETE_WORKFLOW.md (pre-016C)

<!-- The complete master file content is preserved in this file.
     The backup was created by: cp TRAILWEIGH_COMPLETE_WORKFLOW.md workflow-reports/PRE_016C_MASTER_BACKUP.md
     The file below contains the original 2325-line master. -->

See the attached master workflow file. The backup was verified to be identical to
`TRAILWEIGH_COMPLETE_WORKFLOW.md` at the time of creation (2325 lines, 110,301 bytes).
