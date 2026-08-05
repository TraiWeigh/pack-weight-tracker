---
name: Locker Save — active file identity tracking
description: Why Save shows the naming dialog after loading a Locker file, and how both load paths set activeLockerFile.
---

## The problem
`handleLoadFromLocker` has two branches depending on `totalItems`:
- `totalItems === 0` (in-place): loads the file into the current tab, calls `setActiveLockerFile({id, name})` directly.
- `totalItems > 0` (new-tab): calls `window.open(?savedListId=id, '_blank')`. The new tab's `handleLoadFromLocker` is **never called**, so `activeLockerFile` was never set → Save always opened the naming dialog.

The user's checklist nearly always has items (guest seed data = 72 items; signed-in users keep previous sessions in localStorage), so the new-tab path fires almost every time in practice.

## Fix
**`usePackData.ts` `useState` store initialiser** — when loading from `?savedListId=`:
- Write `tw-savedlist-entry-id` and `tw-savedlist-entry-name` to `sessionStorage` alongside the existing `tw-savedlist-bg*` values.

**`ChecklistContent` mount effect (`useEffect(() => {...}, [])`)** — reads `tw-savedlist-entry-id/name`, removes them, calls `writeActiveLockerFileToSS({id, name})` and `setActiveLockerFile({id, name})`.

**Remount safety** — `activeLockerFile` `useState` is initialised with `readActiveLockerFileFromSS()` so a Clerk-triggered remount doesn't lose the identity. `handleSaveClick` uses `activeLockerFile ?? readActiveLockerFileFromSS()` as final fallback.

## Why
sessionStorage is tab-local — each new tab starts empty. The store initialiser runs synchronously before any React effects, so writing the entry id/name there is the earliest possible point to stash the identity for the mount effect to pick up.

## How to apply
Any future "open in new tab" Locker-style workflow needs to stash its target identity in sessionStorage during the store init and consume it in a mount effect in the consumer component.
