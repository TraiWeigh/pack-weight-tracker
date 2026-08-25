---
name: Items 57–62 device-confirmation audit
description: Full findings for haptics, camera, safe-area, keyboard, photo quality, and scroll — what requires device confirmation vs what is code-verifiable.
---

## Item 57 — Haptic: item check/uncheck

- v3: NO haptic on item check/uncheck (hapticDock() not called there)
- Native: the current ItemRow checkbox handler calls only `toggleItem(category, item.id)`; it has no haptic invocation.
- Status: MATCHES — the native app no longer adds a check/uncheck haptic.

## Item 58 — Haptic: drag-reorder

- v3 drag-start: navigator.vibrate(10) (line 3349)
- v3 drag-commit: hapticDock() = navigator.vibrate(10) (line 3289)
- Native drag-start (line 1073): ImpactFeedbackStyle.Medium
- Native drag-commit (line 1060): ImpactFeedbackStyle.Medium
- Status: DIFFERENT INTERNALLY BUT EQUIVALENT BY DESIGN (platform translation of same 2-endpoint pattern)
- Physical feel of Medium vs Light: NEEDS PHYSICAL IPHONE CONFIRMATION

## Item 59 — Camera permission and crop step

- v3: <input type="file"> — no permission dialog, no crop
- Native: requestCameraPermissionsAsync + direct ImagePicker launch with `allowsEditing:false`
- Status: MATCHES the no-crop behavior; native camera permission remains the necessary platform equivalent
- NEEDS PHYSICAL IPHONE CONFIRMATION for end-to-end flow

## Item 60 — Safe-area insets on real hardware

- v3: env(safe-area-inset-top/bottom)
- Native: useSafeAreaInsets() — applied at AppBar, toast, sheets, ConfirmSheet, SafeAreaProvider in _layout.tsx
- Status: DIFFERENT INTERNALLY BUT EQUIVALENT BY DESIGN (architecture correct)
- NEEDS PHYSICAL IPHONE CONFIRMATION — especially Dynamic Island (insets.top=59) and SE (insets.bottom may=0)

## Item 61 — Photo compression quality ← CODE-VERIFIABLE MISMATCH

- v3 (MobileFunctionalV3.tsx lines 107-126): quality=0.72, max 800px canvas resize
- Native item and Photo List sources resize the longest edge to 800 px with ImageManipulator and encode JPEG at quality=0.72
- Status: MATCHES the final-V3 output constraint
- Physical-device confirmation remains useful for image orientation and perceived quality

## Item 62 — Keyboard avoidance for weight/name inputs

- Infrastructure: KeyboardProvider (_layout.tsx), KeyboardAwareScrollViewCompat, KeyboardAvoidingView in modals
- Gap: ItemDetailPanel (weight TextInput line 212, name TextInput line 200) — NO KeyboardAvoidingView; panel is absolute overlay
- Status: NEEDS PHYSICAL IPHONE CONFIRMATION — concern is iPhone SE (667pt) where panel+keyboard may collide

**Why:** the earlier device audit became stale after the picker, compression, and checkbox-haptic repairs. Items 58, 60, and 62 still need physical-device confirmation.
