# Pre-018B Master Backup

**Created:** 2026-08-07  
**Prompt:** 018B — Match Active File Name Pill to Hide (visual correction to 018A)  
**Starting state:** 018A = PARTIAL (filename visible and centered, but not styled as a pill matching Hide; text color unreliable in dark/light mode)

## Scope of 018B

Visual correction only:
1. Style the filename element as a pill matching the existing Hide pill exactly (height, border radius, padding, background, border, font size/weight, vertical alignment)
2. Ensure filename pill is on the same horizontal line as Hide/Preview/Imperial/Metric
3. Guarantee dark mode = white text, light mode = black text, live on mode switch
4. No functional changes — active file identity, Locker, save confirmation, importers, background picker, etc. untouched

## Protected from Change

- Active file identity logic (`activeLockerFile` state, sessionStorage sync)
- `commitSaveNew` and `commitSaveReplace` toasts (`Saved "${name}"`)
- 017E background/shaking fix (BackgroundPicker.tsx)
- 017F Scan Gear List / importers
- Hide, Preview, Imperial/Metric, Open/Close controls
- `lg:grid-cols-[1fr_365px]` sidebar layout
- All Locker/save/share/calculation behavior
- localStorage / IndexedDB / Locker data
- Cross-tab sync

## Files Expected to Change

- `artifacts/pack-checklist/src/pages/Checklist.tsx` — filename pill className only (no logic changes)
- `artifacts/pack-checklist/src/hooks/activeFileName018B.test.mjs` — new test file
- `package.json` — add 018B test to chain

## Test Baseline

866 passed / 0 failed before 018B starts.
