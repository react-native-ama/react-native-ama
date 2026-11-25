---
'@react-native-ama/animations': patch
'@react-native-ama/bottom-sheet': patch
'@react-native-ama/core': patch
'@react-native-ama/forms': patch
'@react-native-ama/lists': patch
---

- animations, bottom-sheet: work without `@react-native-ama/core` installed. Previously Metro failed to bundle them when core was missing. Without core, the animation hooks now read the system Reduce Motion setting instead of assuming it's off, and `AnimatedContainer`'s `autofocus` logs a dev warning.
- animations, bottom-sheet: don't crash when core is installed but the app isn't wrapped in `<AMAProvider />`.
- forms: `TextInput` and `useFormField` add `errorMessage` to the accessibility hint only while `hasError` is true. Previously it was announced on valid fields too.
- core: AMA's error overlay marks its headings with `accessibilityRole="header"` (it used `aria-role`, which React Native ignores), and the fix suggestions say `role="button"` instead of `aria-role="button"`.
- Every package now ships an agent skill in `skills/`, describing its API for AI coding agents.
- Docs: TextInput, Form, BottomSheet and the usage example updated to the v2 API (`renderLabel`, `renderError`, `onClose`, `Form.Field`).
