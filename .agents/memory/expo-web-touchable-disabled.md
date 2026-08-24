---
name: Expo Web disabled touchables
description: How to validate disabled React Native touchables in browser-backed Expo tests.
---

Do not treat Playwright `isDisabled()` as authoritative for a React Native Web `TouchableOpacity`: a visually dimmed, disabled touchable may not render with an HTML `disabled` attribute.

**Why:** Browser tests reported the control as enabled even though the app correctly guarded the action. Relying on DOM disabled semantics alone would produce a false failure or miss the real product invariant.

**How to apply:** Verify both the visible disabled styling and the boundary behavior: invoke the rendered touchable host if necessary, then assert that the guarded action creates no data or navigation side effect. Keep the data-layer guard; UI disablement is not sufficient validation.