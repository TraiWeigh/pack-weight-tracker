# Pre-018C Master Backup

**Created:** 2026-08-07  
**Prompt:** 018C — Align Active File Name Pill to Top Control Row (vertical alignment correction to 018B)  
**Starting state:** 018B = PARTIAL (pill appearance correct, horizontal centering correct, but pill sits too high — not on the same vertical centerline as Hide/Preview/Imperial/Metric)

## Root Cause Identified

The pills row container has `pt-8 pb-3` (asymmetric padding: 2rem top, 0.75rem bottom).

The current absolute positioning `top-1/2 -translate-y-1/2` anchors the pill's center to 50% of the container's full height:
- Container height ≈ pt-8 (32px) + button-height (~28px) + pb-3 (12px) = ~72px
- `top-1/2` → pill center at ~36px from container top

The flex buttons (Hide, Preview, UnitToggle) are positioned by `flex items-center` in the content area (after padding):
- Content area: 32px → 60px (28px tall)
- Button centers at: 32px + 14px = ~46px from container top

Difference: pill at 36px, buttons at 46px → pill is ~10px too high.

## Planned Fix

Replace `absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2` wrapper with `absolute inset-0 pt-8 pb-3 flex items-center justify-center`:
- `inset-0` — overlay fills exact container dimensions
- `pt-8 pb-3` — same padding as outer container → content area reference matches exactly
- `flex items-center` — centers span at 32px + 14px = 46px ✓
- `justify-center` — centers span horizontally over the full left-column width ✓
- `pointer-events-none` preserved

## Scope of 018C

Visual (vertical alignment) correction ONLY:
- The wrapper div className changes
- Two test files need updating (018A Test 4, 018B Test 18)
- New 018C test file added

## Protected from Change

- Span className (018B pill appearance — bg-muted, rounded-lg, px-3, py-1.5, text-xs, font-semibold, text-foreground)
- Active file identity logic (`activeLockerFile` state, sessionStorage sync)
- `commitSaveNew` / `commitSaveReplace` toasts
- Hide, Preview, UnitToggle JSX
- Outer container className (pt-8 pb-3 flex items-center lg:pr-3 flex-shrink-0 relative)
- All other functionality

## Test Baseline

896 passed / 0 failed before 018C starts.
