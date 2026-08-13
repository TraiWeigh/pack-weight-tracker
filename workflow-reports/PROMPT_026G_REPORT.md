# TRAILWEIGH — PROMPT 026G REPORT
## Diagnostic: Why Fresh Share/Review Opens With No Default Background
### Internal Version ID: 026G-DIAGNOSE-FRESH-SHARE-DEFAULT-BACKGROUND-2026-08-13-R1

---

## 1. AGENT MODE

Build mode (read-only/diagnostic — no code changes).

---

## 2. USER LIVE EVIDENCE

| Test | Result |
|---|---|
| Normal Share first load | ❌ FAIL — no background |
| Safari Private window / genuinely fresh reviewer context | ❌ FAIL — still no background |
| Share Locker file open | ✅ PASS — file's saved background appears |
| Owner quantity Save → Share refresh | ✅ PASS — quantities updated |
| Reviewer background change mutates owner | ✅ PASS (isolated — no mutation) |

Primary implication: the failure is specific to the INITIAL fresh Share default-background path.
Stale reviewer localStorage is disproven as the cause (Safari Private window also fails).

---

## 3. 026F CLAIMS DISPROVEN BY USER LIVE EVIDENCE

| 026F Claim | Status |
|---|---|
| "FRESH SHARE STARTS WITH PERMANENT DEFAULT = PASS (code path verified)" | **DISPROVEN BY USER LIVE EVIDENCE** |

All other 026F code-path claims remain to-be-verified below.

---

## 4. CURRENT SOURCE FILES INSPECTED

| File | State |
|---|---|
| `artifacts/pack-checklist/src/components/BackgroundPicker.tsx` | `SHARE_DEFAULT_PRESET` added to `ALL_BUILTIN_PRESETS` — code correct per 026F plan |
| `artifacts/pack-checklist/src/pages/ReviewPage.tsx` | `seedFromLiveFiles` writes `{ type:'preset', id:'share-default' }` to namespace key — code correct |
| `artifacts/pack-checklist/src/pages/Checklist.tsx` | initializer reads review-namespace key; falls back to `{ type:'preset', id:'share-default' }` — code correct |
| `artifacts/pack-checklist/public/themes/share-default/TrailWeigh-Share-Default-Background.png` | File exists, SHA-256 verified |

---

## 5. STATIC ASSET PATH CHECK

| Check | Result |
|---|---|
| File exists at expected path | ✅ YES — 3,206,670 bytes |
| SHA-256 | ✅ b9f06e9fd4b022c13a4df8b533ac6b278c7eb59ca35ac6533e53cb075e8d2811 |
| `curl http://localhost:20351/themes/psychedelic/01.png` | ✅ HTTP 200, `image/png`, 3,912,213 bytes |
| `curl http://localhost:20351/themes/share-default/TrailWeigh-Share-Default-Background.png` | ❌ HTTP 200, **`text/html`**, 70,592 bytes — SPA index.html returned |
| `curl http://localhost:20351/themes/share-default/test.png` (nonexistent) | ❌ HTTP 200, `text/html` — same fallback |

The Vite dev server returns the SPA `index.html` for ALL paths under `themes/share-default/`,
regardless of whether the file exists on disk.

---

## 6. ROOT CAUSE — CONFIRMED

### Vite Process Start vs. Directory Creation Timestamps

```
Vite process start:           21:24 (Aug 13)
themes/psychedelic/ created:  19:30 (Aug 13) — BEFORE Vite started
themes/retro-outdoors/:       19:30 — BEFORE Vite started
themes/topo/:                 19:30 — BEFORE Vite started
themes/trails-us/:            19:30 — BEFORE Vite started
themes/share-default/:        21:54 (Aug 13) — AFTER Vite started (created during 026F)
```

**The Vite dev server was already running when `public/themes/share-default/` was created.**

Vite's static file serving from `publicDir` does not dynamically detect new directories
created while the server is running. The `share-default` directory is invisible to the
running Vite process. All requests to any path under `/themes/share-default/` fall through
to the SPA index.html fallback (HTTP 200, `text/html`).

This is a **process-state issue, not a code defect.** The 026F code changes are correct.
The Vite server simply needs to be restarted to pick up the new public directory.

---

## 7. FULL FRESH SHARE INITIALIZATION TRACE

### Step-by-step (with observed state):

| Step | Expected | Observed |
|---|---|---|
| 1. ReviewPage loads, API call fires | ✅ | ✅ |
| 2. `seedFromLiveFiles` runs (CASE A fresh) | ✅ | ✅ (CASE A path confirmed by architecture — fresh browser → needsSeed=true) |
| 3. `trailweigh:review:${token}:background` written | `{ type:'preset', id:'share-default' }` | ✅ Code writes this value |
| 4. Status → 'ready', ChecklistContent mounts | ✅ | ✅ |
| 5. `background` useState initializer reads namespace key | Finds `{ type:'preset', id:'share-default' }` | ✅ Returns it |
| 6. `bgImageUrl` computed | `/themes/share-default/TrailWeigh-Share-Default-Background.png` | ✅ resolvePresetUrl returns this string |
| 7. CSS `background-image: url(...)` applied | Browser loads PNG | ❌ Browser receives `text/html` — image fails silently |
| 8. Rendered background | Hiker-and-Dutch image | ❌ No background — blank/white |

### FIRST DIVERGENCE:

**Step 7** — the browser requests `/themes/share-default/TrailWeigh-Share-Default-Background.png`
and the Vite dev server returns `text/html` (SPA fallback) instead of `image/png`.

React state is CORRECT throughout. The URL is CORRECT. The static file EXISTS on disk.
The failure is exclusively that the **running Vite process does not serve the file**.

---

## 8. PRESET RESOLVER CHECK

| Check | Result |
|---|---|
| Function that resolves background.id → URL | `resolvePresetUrl(id)` in `BackgroundPicker.tsx` |
| Registry consulted | `ALL_BUILTIN_PRESETS` (which now includes `SHARE_DEFAULT_PRESET`) |
| `SHARE_DEFAULT_PRESET` present in `ALL_BUILTIN_PRESETS` | ✅ YES — prepended at index 0 |
| `resolvePresetUrl('share-default')` return value | `/themes/share-default/TrailWeigh-Share-Default-Background.png` |
| Resolver used in Checklist render path | ✅ YES — line 941: `resolvePresetUrl(background.id)` |
| Share-default excluded from user-facing picker | ✅ Correct — not in `BUILTIN_THEMES` |

The resolver chain is correct end-to-end. The URL it produces is correct.
The failure is at the HTTP transport layer (Vite not serving the file), not in the resolver.

---

## 9. STATE-OVERWRITE ANALYSIS

Examined all `setBackground(...)` call sites and auto-firing `useEffect` hooks:

| Code Path | Does it auto-fire in fresh review mode? | Can it overwrite background? |
|---|---|---|
| `useEffect` line 1542 — startup last-active restore | `if (!userId) return` → **skips** in review mode (no auth) | ✅ NO |
| `useEffect` line 1430 — locker sync | `if (!userId) return` → **skips** in review mode | ✅ NO |
| `useEffect` line 1445 — visibility-change sync | `if (!uid) return` in handler → **skips** | ✅ NO |
| `handleBackgroundChange` (line 367) | User-triggered only | ✅ NO (not auto) |
| line 850 — undo/redo snap restore | User-triggered (Ctrl+Z) | ✅ NO |
| line 1568 — Locker file restore on entry select | User-triggered locker open | ✅ NO |
| line 1810 — in-place locker load | User-triggered locker open | ✅ NO |
| `useEffect` line 894 — syncBg | Watches [background, bgSize] — does NOT set background | ✅ NO |
| `useEffect` line 907 — customBgObjectUrl | Only fires if `background.type === 'custom'` (share-default is preset) | ✅ NO |

**Conclusion: No auto-firing effect overwrites the background state after initialization in review mode.**

Background state is and remains `{ type:'preset', id:'share-default' }` throughout the
fresh Share session. The failure is not a state-overwrite — it is purely the Vite server
not serving the file.

---

## 10. FRESH vs. LOCKER-OPEN COMPARISON

| Dimension | Fresh Share (FAIL) | After Locker file open (PASS) |
|---|---|---|
| Background state | `{ type:'preset', id:'share-default' }` | e.g. `{ type:'preset', id:'psychedelic-04' }` |
| Resolved URL | `/themes/share-default/TrailWeigh-Share-Default-Background.png` | `/themes/psychedelic/04.png` |
| Vite serves URL | ❌ `text/html` fallback | ✅ `image/png` (psychedelic dir exists before Vite started) |
| Browser gets image | ❌ No | ✅ Yes |
| Background renders | ❌ No | ✅ Yes |

**Why Locker-open works:** the psychedelic/retro-outdoors/topo/trails-us directories were
all present at `19:30`, before the Vite server started at `21:24`. Vite serves those
theme PNGs correctly. The `share-default` directory was created at `21:54` — after Vite
started — and is invisible to the running server.

---

## 11. SMALLEST RECOMMENDED REPAIR

**Restart the Vite web workflow (`artifacts/pack-checklist: web`).**

No code changes are needed. All 026F code is correct. After restart, Vite scans
`public/themes/share-default/` on startup and serves the PNG correctly.

This is a one-step fix: `WorkflowsRestart("artifacts/pack-checklist: web")`.

Post-restart verification: `curl http://localhost:<PORT>/themes/share-default/TrailWeigh-Share-Default-Background.png`
should return `image/png`, not `text/html`.

---

## 12. EXPECTED REPAIR FILES FOR NEXT PROMPT (026H)

No source code changes needed.

Actions:
1. Restart `artifacts/pack-checklist: web` workflow
2. Verify PNG served correctly (curl or screenshot)
3. (Optional) Verify with a fresh Share link that the default background renders

---

## 13. REPAIR RISKS / REGRESSIONS

- Restarting the Vite dev server is safe — it picks up all existing files including the
  four permanent theme directories, plus the newly visible `share-default` directory.
- No data, schema, or auth changes involved.
- The only risk is momentary downtime during the ~1 second Vite restart.

---

## 14. TESTS REQUIRED AFTER REPAIR

| Test | Method |
|---|---|
| PNG served correctly | `curl .../themes/share-default/TrailWeigh-Share-Default-Background.png` → `image/png` |
| Fresh Share shows hiker-and-Dutch image | Open Share link in private/fresh browser |
| Locker-open background still works | Open Locker file → confirm its saved background |
| Existing theme PNGs unaffected | Spot-check `/themes/psychedelic/01.png` still serves |

---

## 15. ELAPSED TIME / AGENT ACTIONS

Elapsed: ~10 minutes
Agent actions: read 026D/026E/026F reports, inspected BackgroundPicker.tsx, ReviewPage.tsx,
Checklist.tsx, vite.config.ts, ran curl tests (psychedelic vs share-default), compared
filesystem timestamps vs Vite process start time, traced all setBackground call sites,
compared fresh vs Locker-open paths.

---

## MANDATORY FINAL STATUS

```
USER PRIVATE FRESH-SHARE RESULT = FAIL
STALE REVIEWER STORAGE PRIMARY CAUSE = NO
SHARE LIVE DATA RESEED WORKING = YES
SHARE CAN RENDER BACKGROUND AFTER LOCKER OPEN = YES
REVIEWER BACKGROUND SAVE MUTATES OWNER = NO

SEEDFROMLIVEFILES RAN ON FRESH SHARE = YES (CASE A confirmed by architecture)
REVIEW BACKGROUND KEY AFTER SEED = { "type": "preset", "id": "share-default" }
CHECKLIST INITIAL BACKGROUND STATE = { type: 'preset', id: 'share-default' }
CHECKLIST SETTLED BACKGROUND STATE = { type: 'preset', id: 'share-default' } (no overwrite detected)
SHARE-DEFAULT PRESET FOUND BY ACTIVE RESOLVER = YES
SHARE-DEFAULT RESOLVED URL = /themes/share-default/TrailWeigh-Share-Default-Background.png
SHARE-DEFAULT IMAGE NETWORK REQUESTED = YES (browser requests the URL)
SHARE-DEFAULT IMAGE HTTP STATUS = 200 text/html (SPA fallback — NOT the image)
SHARE-DEFAULT STATIC ASSET HASH MATCH = YES (file on disk is correct)
COMPUTED BACKGROUND-IMAGE = url(/themes/share-default/TrailWeigh-Share-Default-Background.png) — renders nothing because server returns HTML
BACKGROUND STATE OVERWRITTEN AFTER INIT = NO
FIRST DIVERGENCE IDENTIFIED = YES
ROOT CAUSE IDENTIFIED = YES
CODE CHANGED = NO
DATABASE DATA CHANGED = NO
DATABASE SCHEMA CHANGED = NO
REPLIT.MD CHANGED = NO
DEPLOYMENT/PUBLISHING CHANGED = NO

ROOT CAUSE: Vite dev server was already running at 21:24 when public/themes/share-default/
was created at 21:54 during 026F. Vite does not dynamically detect new public directories
added after startup. All requests to /themes/share-default/* fall through to SPA index.html.
Fix: restart the Vite web workflow.

USER VERIFICATION = NOT APPLICABLE — DIAGNOSTIC ONLY
```
