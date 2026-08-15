---
name: Review page testing patterns
description: Correct patterns for E2E testing the ReviewPage and ChecklistContent in Playwright
---

## Readiness signal
When ReviewPage receives a valid 200 mock response, it calls `setStatus('ready')` which mounts ChecklistContent AND (on first visit) shows the Welcome modal ("Start Exploring" button, `position:fixed`). Use the Welcome modal as the readiness gate — NOT `LIST SUMMARY` or the list name.

```ts
const welcomeBtn = page.getByRole('button', { name: 'Start Exploring', exact: true });
await expect(welcomeBtn).toBeVisible({ timeout: 14_000 });
await welcomeBtn.click();
await page.waitForTimeout(300);
```

**Why:** LIST SUMMARY can be off-screen (below fold) on first render. The list name ("Three-Season Basecamp") appears in the Locker panel with `visibility:hidden` — `.first()` may pick it up. The Welcome modal is always in the center of the viewport.

After clicking "Start Exploring", ReviewPage writes `hasWelcomed` to localStorage. On reload (CASE B), the modal does NOT reappear — use `page.waitForTimeout()` or spinner-absence instead.

## CASE B marker target
`usePackData` autosaves to `packKey` on every React commit, stripping non-standard fields. Use `lockerKey` (`trailweigh:review:{token}:locker`) as the CASE B marker target — only `seedFromLiveFiles` writes to it, so CASE B (which skips `seedFromLiveFiles`) preserves the marker.

## GearCategory toggle selector
In `ChecklistContent` (desktop layout), category headers are `<div onClick>` not `<button>`. Use `page.getByText('Shelter').first()` not `page.getByRole('button', { name: /Shelter/i })`. In `MobileFunctionalV3`, category buttons ARE real `<button>` elements with `aria-label="Open {name}"`.

## Print button location
`aria-label="Print checklist"` is inside the `MobileChecklist` overlay — only mounted in checklist mode. The More-menu `aria-label="Print"` button calls the same handler and is accessible from the default demo view.

## CSV field mapping
CSV importer stores item type/name in `sub`, description text in `desc`. Check `(item.sub ?? '') + (item.desc ?? '')` for non-empty name assertions, not just `item.desc`.

## Error text assertions
Use `page.getByText('could not be loaded', { exact: false }).first()` not a broad regex like `/error/i` which matches too many DOM elements (Clerk, console output, etc.).
