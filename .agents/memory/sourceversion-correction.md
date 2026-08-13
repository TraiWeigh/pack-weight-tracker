---
name: sourceVersion correction
description: 025S incorrectly stated sourceVersion never detects appearance changes; the correct rule is about saved vs unsaved changes.
---

## The Correct Rule (supersedes any 025S wording)

| Change | Saved? | sourceVersion changes? |
|---|---|---|
| Background/item/weight changed | YES (Save clicked) | YES — savedAt updates |
| Background/item/weight changed | NO (unsaved) | NO |
| File renamed | N/A (rename saves immediately) | YES — `n:` field in fingerprint |

**Why:** sourceVersion formula (`links.ts:87–89`) fingerprints `{ i: id, n: name, t: savedAt.getTime() }`. Only a successful Save updates `savedAt`. Unsaved in-memory changes are invisible to the fingerprint.

**How to apply:** Any prompt referencing "sourceVersion doesn't detect X" must be qualified: "UNSAVED X is invisible; SAVED X does change sourceVersion."

**Reference:** PROMPT_025T_REPORT.md Section "CRITICAL CORRECTION" for full table and formula.
