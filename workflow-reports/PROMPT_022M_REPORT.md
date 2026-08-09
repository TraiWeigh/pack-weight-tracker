# Prompt 022M — Improve Sign-In / Form Field Visibility

**Status:** COMPLETE ✅  
**Date:** 2026-08-09  
**Tests:** 23 new (signInVisibility022M) — 0 failures across full suite

---

## Checkpoint Confirmation

Replit checkpoint created before any changes were made.

---

## Existing Form Styling Architecture Discovered

| Layer | Finding |
|---|---|
| Auth component | Clerk prebuilt `<SignIn>` / `<SignUp>` — **not** a custom form |
| Appearance config | `clerkAppearance` object in `App.tsx:46–93` using `theme: shadcn` |
| Clerk variables | `colorInput`, `colorNeutral`, `colorMutedForeground`, `colorPrimary`, etc. |
| Clerk elements | Per-element class overrides — `formFieldInput: ''` was empty |
| CSS design tokens | `index.css` defines CSS custom properties; Clerk uses its own variable system |
| Shared input component | `components/ui/input.tsx` exists but is **not** used by auth forms |
| Dark mode | `index.css` `.screen-dark` class — does **not** affect Clerk's static appearance variables |
| `.cl-` / `.clerk-` selectors | None anywhere in the codebase |

**Shared form component used:** No — the fix targets the Clerk appearance object directly, which is the only styling path for Clerk's prebuilt components.

---

## Root Cause

Three values in the `clerkAppearance.variables` block were too close in lightness to the white sign-in card (`bg-white`):

| Variable | Old value | Approx color | Contrast vs white | Problem |
|---|---|---|---|---|
| `colorInput` | `hsl(140, 10%, 85%)` | `#d2dad5` | ~1.3:1 | Input border nearly invisible |
| `colorNeutral` | `hsl(140, 10%, 85%)` | `#d2dad5` | ~1.3:1 | Google button boundary invisible |
| `colorMutedForeground` | `hsl(150, 8%, 45%)` | `#6b7872` | ~4.8:1 | Fine, but slightly improved |

Additionally, `formFieldInput: ''` (empty) meant inputs had a fully transparent background — no differentiation from the white card surface.

---

## Files Changed

- `artifacts/pack-checklist/src/App.tsx` — 3 Clerk variable values + 2 element class values
- `artifacts/pack-checklist/src/hooks/signInVisibility022M.test.mjs` — new (23 assertions)
- `package.json` — `signInVisibility022M.test.mjs` added to `test:importer` chain

**Authentication logic: UNCHANGED.** Only the visual appearance variables were modified.

---

## Light-Mode Colors / Borders Used

| Element | Before | After |
|---|---|---|
| Input border (`colorInput`) | `hsl(140, 10%, 85%)` ~1.3:1 | `hsl(140, 8%, 58%)` ~3.2:1 ✅ |
| Input background (`formFieldInput`) | transparent | `!bg-neutral-50` (`#fafafa`) |
| Google button (`colorNeutral`) | `hsl(140, 10%, 85%)` ~1.3:1 | `hsl(140, 6%, 60%)` ~3.0:1 ✅ |
| OTP / code fields (`otpCodeFieldInput`) | transparent | `!bg-neutral-50` |
| Placeholder (`colorMutedForeground`) | `hsl(150, 8%, 45%)` | `hsl(150, 8%, 40%)` (slightly darker) |

All borders remain green-tinted and understated — no black or heavy borders.

---

## Placeholder Treatment

`colorMutedForeground` tightened from 45% → 40% lightness. Result: approximately 5.5:1 contrast on the `bg-neutral-50` input background — exceeds WCAG AA 4.5:1 for normal text. Maintained clear hierarchy: entered text (dark) > placeholder (medium) > disabled (faded).

---

## Focus Treatment

`colorPrimary: 'hsl(140, 15%, 35%)'` (TrailWeigh forest green) is **unchanged**. Clerk's shadcn theme uses this color for focus rings on inputs. The green border on focus is clearly visible and consistent with TrailWeigh's brand. No changes were needed here — the primary color was already appropriate.

---

## Google Button Treatment

`colorNeutral` darkened from `hsl(140, 10%, 85%)` → `hsl(140, 6%, 60%)`. This directly controls the outline/border of the "Continue with Google" secondary button in Clerk's shadcn theme. The button now has a clearly visible boundary while remaining visually secondary to the green primary "Continue" button. Google icon, wording, and authentication behavior: **unchanged**.

---

## Dark-Mode Verification

**Finding:** Clerk's appearance variables are static — they do not respond to OS dark-mode media queries or the `.screen-dark` class used by TrailWeigh's background system. The sign-in page uses `bg-background` (the app CSS variable) for its outer wrapper, but Clerk's component itself uses `colorBackground: 'hsl(40, 20%, 97%)'` regardless of system appearance.

**Assessment:** The input border improvement (`hsl(140, 8%, 58%)`) remains a medium-gray tone that is visible whether the card is rendered light or dark. However, full system dark-mode support for the Clerk form would require a more complex implementation (e.g., dynamically passing different appearance objects based on `prefers-color-scheme`). This is **not** a regression — dark mode behavior is identical to before; the changes only improve light mode.

**Recommendation for future:** If OS dark-mode sign-in fidelity is required, a follow-up task should pass `clerkAppearance` as a computed value based on `window.matchMedia('(prefers-color-scheme: dark)')`.

---

## System-Mode Verification

Same as dark mode — Clerk appearance is static at mount. System mode correctly shows light appearance (the only mode improved by this prompt).

---

## Mobile Verification

The card uses `max-w-full` and `px-4` wrappers. Input fields use Clerk's internal responsive layout. The `!bg-neutral-50` and border changes do not affect dimensions or overflow behavior. All inputs, buttons, and focus states remain usable at narrow widths.

---

## Authentication Regression Results

| Check | Result |
|---|---|
| Email sign-in flow | ✅ Unchanged — Clerk `<SignIn>` component intact |
| Sign-up flow | ✅ Unchanged — Clerk `<SignUp>` component intact |
| Google sign-in | ✅ Unchanged — no auth logic modified |
| Existing sessions | ✅ Unchanged — session handling untouched |
| Redirect behavior | ✅ Unchanged — routing logic untouched |
| Auth logic modifications | ✅ None — only `clerkAppearance` visual variables changed |

---

## Complete Final-Diff Review

**`App.tsx` changes (visual only):**
1. `colorInput`: `'hsl(140, 10%, 85%)'` → `'hsl(140, 8%, 58%)'`
2. `colorNeutral`: `'hsl(140, 10%, 85%)'` → `'hsl(140, 6%, 60%)'`
3. `colorMutedForeground`: `'hsl(150, 8%, 45%)'` → `'hsl(150, 8%, 40%)'`
4. `formFieldInput`: `''` → `'!bg-neutral-50'`
5. `otpCodeFieldInput`: `''` → `'!bg-neutral-50'`
6. Added explanatory comments for each changed value

No logic, routing, session, redirect, or auth behavior was modified.

**Nothing reverted.** All changes are intentional and correct.

---

## Test Results

```
022M Sign-In Visibility: 23/23 passed, 0 failed
Full suite: 0 failures
```

---

## Test Checklist

### Light Mode
- [x] Email field boundary is immediately visible — YES (border ~3.2:1 contrast)
- [x] Input background is distinguishable from the card — YES (`bg-neutral-50` vs white)
- [x] Placeholder text is readable — YES (~5.5:1 contrast)
- [x] Google button boundary is clearly visible — YES (`colorNeutral` ~3.0:1)
- [x] Primary Continue button remains visually primary — YES (unchanged green)
- [x] Page still looks clean and consistent with TrailWeigh — YES (verified by screenshot)

### Focus
- [x] Focus indication is obvious — YES (TrailWeigh green ring via `colorPrimary`)
- [x] Not communicated only by tiny color change — YES (full ring)
- [x] Focus ring not clipped — YES (no overflow-hidden constraints on field containers)

### Sign-Up / Other Auth Screens
- [x] Same variables control all Clerk auth screens — YES (shared `clerkAppearance`)
- [x] No auth page retains nearly invisible form controls — YES (all use same config)
- [x] Authentication behavior unchanged — YES

### Dark / System
- [PARTIAL] Dark mode fields — Clerk appearance is static; light-mode values are the fix target. No regression introduced. Full dynamic dark-mode support requires a future enhancement.
- [x] System mode changes appropriately — YES for light; same limitation for dark as above.
- [x] No new contrast regression — YES

### Authentication Regression
- [x] Email sign-in — unchanged
- [x] Sign-up — unchanged
- [x] Google sign-in — unchanged
- [x] Existing sessions — unchanged
- [x] Redirect after auth — unchanged
- [x] No auth logic modified — confirmed

---

## Anything Requiring User Verification

1. **Visual inspection on physical hardware** — The screenshot confirms improved field visibility in the preview. The user should confirm it looks correct on their own device and screen.

2. **Dark-mode sign-in on OS-dark-mode devices** — As noted above, the Clerk form uses static appearance variables and does not automatically respond to OS dark mode. The form will continue to show light-mode styling regardless of OS setting. If this is a priority, it requires a follow-up implementation.

3. **Verification code / OTP screen** — The `otpCodeFieldInput` element class was updated to match, but this screen is only reached during MFA or email-code sign-in flows. The user should verify it looks correct if those flows are in use.
