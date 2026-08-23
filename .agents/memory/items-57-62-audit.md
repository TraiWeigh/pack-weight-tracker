---
name: Items 57–62 device-confirmation audit
description: Full findings for haptics, camera, safe-area, keyboard, photo quality, and scroll — what requires device confirmation vs what is code-verifiable.
---

## Item 57 — Haptic: item check/uncheck

- v3: NO haptic on item check/uncheck (hapticDock() not called there)
- Native (index.tsx line 476): ImpactFeedbackStyle.Light on every toggle
- Status: DOES NOT MATCH — code-verifiable; native adds haptic v3 never had
- Fix: remove line 476; product decision whether this enhancement is desired

## Item 58 — Haptic: drag-reorder

- v3 drag-start: navigator.vibrate(10) (line 3349)
- v3 drag-commit: hapticDock() = navigator.vibrate(10) (line 3289)
- Native drag-start (line 1073): ImpactFeedbackStyle.Medium
- Native drag-commit (line 1060): ImpactFeedbackStyle.Medium
- Status: DIFFERENT INTERNALLY BUT EQUIVALENT BY DESIGN (platform translation of same 2-endpoint pattern)
- Physical feel of Medium vs Light: NEEDS PHYSICAL IPHONE CONFIRMATION

## Item 59 — Camera permission and crop step

- v3: <input type="file"> — no permission dialog, no crop
- Native: requestCameraPermissionsAsync + launchCameraAsync with allowsEditing:true, aspect:[4,3]
- Status: DIFFERENT INTERNALLY BUT EQUIVALENT BY DESIGN for permission; crop step (allowsEditing:true) is behavioural ADDITION not in v3 spec
- NEEDS PHYSICAL IPHONE CONFIRMATION for end-to-end flow

## Item 60 — Safe-area insets on real hardware

- v3: env(safe-area-inset-top/bottom)
- Native: useSafeAreaInsets() — applied at AppBar, toast, sheets, ConfirmSheet, SafeAreaProvider in _layout.tsx
- Status: DIFFERENT INTERNALLY BUT EQUIVALENT BY DESIGN (architecture correct)
- NEEDS PHYSICAL IPHONE CONFIRMATION — especially Dynamic Island (insets.top=59) and SE (insets.bottom may=0)

## Item 61 — Photo compression quality ← CODE-VERIFIABLE MISMATCH

- v3 (MobileFunctionalV3.tsx lines 107-126): quality=0.72, max 800px canvas resize
- Native ItemPhotoSheet.tsx lines 55,71: quality=0.55, NO maxWidth/maxHeight
- Native PhotoListSourceSheet.tsx lines 65,91: quality=0.55, NO maxWidth/maxHeight
- Status: DOES NOT MATCH — code-verifiable
- Safe fix: quality 0.55→0.72 + add maxWidth:800,maxHeight:800 in both files, both calls (4 quality values, 4 dimension props total)
- expo-image-picker supports maxWidth/maxHeight natively — no new package

## Item 62 — Keyboard avoidance for weight/name inputs

- Infrastructure: KeyboardProvider (_layout.tsx), KeyboardAwareScrollViewCompat, KeyboardAvoidingView in modals
- Gap: ItemDetailPanel (weight TextInput line 212, name TextInput line 200) — NO KeyboardAvoidingView; panel is absolute overlay
- Status: NEEDS PHYSICAL IPHONE CONFIRMATION — concern is iPhone SE (667pt) where panel+keyboard may collide

**Why:** photo quality and item-check haptic are the only Items 57-62 with code-verifiable mismatches; all others need device confirmation.
