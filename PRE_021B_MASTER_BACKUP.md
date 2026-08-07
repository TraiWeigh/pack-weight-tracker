# PRE_021B_MASTER_BACKUP — Snapshot before Prompt 021B changes

Created: 2026-08-07
Purpose: Record state of all files that will be modified by Prompt 021B.

## 021B scope
- Simplify private Locker delete: remove password / Clerk re-verification, replace with simple confirmation
- Remove obsolete OAuth round-trip delete flow from Checklist.tsx
- Shared Locker allowed visible (no code change — no LockerPanel in SharedChecklistPage)
- Confirm no Rename/Delete controls exist in shared view (no code change needed)

## Files with PRE_021B state captured below

### artifacts/pack-checklist/src/components/LockerDeleteDialog.tsx
See full file at that path (381 lines).
Key content: password verification via signIn.create(), OAuth via signIn.sso(), rate-limiting.
All of this is replaced with a simple confirmation dialog.

### artifacts/pack-checklist/src/pages/Checklist.tsx  
Lines 16-20 (imports):
```
import {
  LockerDeleteDialog,
  LOCKER_PENDING_DELETE_KEY,
  LOCKER_DELETE_VERIFIED_PARAM,
} from '../components/LockerDeleteDialog';
```

Lines 994-1035 (OAuth round-trip delete):
```
const [pendingDeleteIds,  setPendingDeleteIds]  = useState<string[]>([]);
const [showDeleteDialog,  setShowDeleteDialog]  = useState(false);
// Used only for the OAuth redirect round-trip path.
const [oauthDeleteIds,    setOauthDeleteIds]    = useState<string[]>([]);

// Detect OAuth redirect return on first render and schedule deletion.
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get(LOCKER_DELETE_VERIFIED_PARAM) !== '1') return;
  ...
}, []);

// Execute pending OAuth-verified deletion once state is ready.
useEffect(() => {
  if (!oauthDeleteIds.length) return;
  ...
}, [oauthDeleteIds]);
```

Line 1670 (dialog usage):
```
isGuest={isGuest}
```
(This prop is removed — dialog only shown to authenticated owners.)

## Status at backup time
021A = USER-TESTED PASS (/checklist protection, Cancel protection)
021A password-verification = SUPERSEDED by 021B
