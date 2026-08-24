---
name: Expo image resize parity
description: How to enforce a non-cropping image dimension cap in the SDK 54 native app.
---

Expo SDK 54's ImagePicker does not expose `maxWidth` or `maxHeight`; casting those fields into its options does not provide a reliable resize guarantee. Use Expo Image Manipulator after direct camera or library selection instead.

**Why:** Picker declarations reflect the actual supported option surface. A type cast can hide the TypeScript error but cannot establish that the native picker will process unsupported fields.

**How to apply:** Keep `allowsEditing: false`, calculate the asset's longest edge, and supply only `width` or only `height` to the resize action when it exceeds the cap. The missing dimension preserves aspect ratio; encode the final JPEG with the desired compression in Image Manipulator. Do not introduce a crop action or an edit screen.