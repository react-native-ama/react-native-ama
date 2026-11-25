---
name: react-native-ama-bottom-sheet
description: Build accessible bottom sheets in React Native with @react-native-ama/bottom-sheet v2 (BottomSheet). Use this whenever the project has @react-native-ama/bottom-sheet installed and the user is building or fixing a bottom sheet, drawer, action sheet or filter sheet — including closing it, its focus, its title or auto-close behaviour.
---

# @react-native-ama/bottom-sheet (v2)

Exports: `BottomSheet`, `useBottomSheetGestureHandler`, `useKeyboard`.

Dependencies: `react-native-reanimated` and `react-native-gesture-handler`, with the app root wrapped in `GestureHandlerRootView`.

## What the component solves

A bottom sheet has to be closable without the drag gesture, keep screen-reader focus inside while it's open, skip the slide animation under Reduce Motion, and respect timing preferences if it auto-closes. `BottomSheet` handles all of this. Building your own usually misses at least one.


## With or without core

This package works on its own. `@react-native-ama/core` is optional.

- **Core installed and the app wrapped in `<AMAProvider>`:** `autoCloseDelay` uses core's `useTimedAction`, so it respects the user's timing preferences and doesn't close under a screen reader on iOS. Follow the `react-native-ama-core` skill too, for the rules every element must meet and for how to verify your work.
- **Core not installed:** The sheet works, and skips its animation under Reduce Motion. `autoCloseDelay` becomes a plain `setTimeout` that ignores the user's timing preferences, so don't use it unless the user asks to install core. Don't add `AMAProvider` or core imports unless the user asks to install core. Nothing checks the rest of the screen at runtime, so get the basics right yourself:
  - every pressable has a role (`accessibilityRole="button"`, `"switch"`, …) and an accessible name (visible text, or `accessibilityLabel` for icon-only buttons);
  - touch targets are at least 44×44 pt (iOS) / 48×48 dp (Android);
  - each screen has a title marked `accessibilityRole="header"`;
  - state changes are exposed (`aria-checked`, `aria-expanded`, …).

## Usage

```tsx
import { Text } from 'react-native';
import { BottomSheet } from '@react-native-ama/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const insets = useSafeAreaInsets();

<BottomSheet
  visible={isOpen}
  onClose={() => setIsOpen(false)}
  closeActionAccessibilityLabel="Close filters"
  topInset={insets.top}
  headerComponent={
    <Text accessibilityRole="header" style={styles.title}>
      Filters
    </Text>
  }>
  {/* sheet content */}
</BottomSheet>;
```

### Required props

| Prop | Type | Notes |
| --- | --- | --- |
| `visible` | boolean | |
| `onClose` | `() => void` | Called when the sheet is dismissed by the overlay, drag or close action. (Older docs show `onRequestClose`. That isn't a `BottomSheet` prop.) |
| `closeActionAccessibilityLabel` | string | The accessible name of the overlay "close" button. Describe the action ("Close filters"), in sentence case. |
| `topInset` | number | Used to calculate the maximum scroll height. Pass the safe-area top inset. |

### Useful optional props

| Prop | Default | Notes |
| --- | --- | --- |
| `persistent` | `false` | When `true`, tapping the overlay doesn't close it and dragging is disabled. You must then give users a visible close button inside the sheet, or they can't get out. |
| `autoCloseDelay` | — | Auto-closes after N ms, using `useTimedAction`, so it respects the user's timing preferences and won't close under a screen reader on iOS. Avoid it for anything the user needs to read or act on. |
| `headerComponent` / `footerComponent` | — | Fixed above and below the scrollable content. A good place for the sheet's title (give it the header role) and its primary action. |
| `hasScrollableContent` | `true` | Wraps children in a `ScrollView`. |
| `maxHeight` | 90% of window | |
| `animationDuration` | 300 | Becomes 0 under Reduce Motion automatically. |
| `handleComponent` | default handle | `'none'` hides it. Pass a custom element to replace it. |
| `isOverlayAccessible` | `true` | Keep it `true` unless another accessible close action exists. |
| `avoidKeyboard` | `false` | Only applies when `shouldHandleKeyboardEvents` is `false`. |
| `ref` | — | `{ close(): Promise<void>; isVisible(): boolean }` |

Other props: `bottomSheetStyle`, `overlayStyle`, `overlayOpacity`, `handleStyle`, `closeDistance` (0.3), `minVelocityToClose` (1000), `panGestureEnabled`, `scrollViewProps`, `shouldHandleKeyboardEvents` (`true`), `supportedOrientations`, `onBottomSheetHidden`, `testID`.

## Checklist for sheet content

- Give the sheet a title with the header role, so it's clear where focus has landed.
- Every control inside still needs a role, a name and the minimum size.
- If it's `persistent`, include a visible close or done button.

## Known issue

If the app crashes with `Unsupported top level event type "onGestureHandlerStateChange"`, add `import 'react-native-gesture-handler';` at the top of the app entry file.

## Guideline

https://commerce.nearform.com/open-source/react-native-ama/guidelines/bottomsheet
