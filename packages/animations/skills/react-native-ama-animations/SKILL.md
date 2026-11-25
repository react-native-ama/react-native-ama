---
name: react-native-ama-animations
description: Build React Native animations that respect Reduce Motion with @react-native-ama/animations v2 (useAnimation, useReanimatedTiming, useAnimationDuration, useReanimatedAnimationBuilder, AnimatedContainer). Use this whenever the project has @react-native-ama/animations installed and the user is adding or changing an animation, transition, slide, scale or entering/exiting effect in React Native — even if they don't mention Reduce Motion or accessibility.
---

# @react-native-ama/animations (v2)

Exports: `AnimatedContainer`, `useAnimation`, `useAnimationDuration`, `useReanimatedAnimationBuilder`, `useReanimatedTiming`.

## What the package solves

Users who turn on **Reduce Motion** (iOS) or turn off animations (Android) can feel nauseous or disoriented from movement. Every helper here plays **motion** properties (translate, scale, position, size) with a duration of 0 when that setting is on, and leaves **non-motion** properties such as opacity animating normally. So a slide-and-fade becomes a plain fade, rather than all animation disappearing.

Read the setting yourself with `useAMAContext().isReduceMotionEnabled` from core when none of these helpers fit.


## With or without core

This package works on its own. `@react-native-ama/core` is optional.

- **Core installed and the app wrapped in `<AMAProvider>`:** The Reduce Motion setting comes from `AMAProvider`, and `AnimatedContainer`'s `autofocus` moves screen-reader focus to the content. Follow the `react-native-ama-core` skill too, for the rules every element must meet and for how to verify your work.
- **Core not installed:** The helpers read the system Reduce Motion setting directly, so they still work. `AnimatedContainer`'s `autofocus` prop does nothing (it logs a warning in dev): move focus another way, or ask the user to install core. Don't add `AMAProvider` or core imports unless the user asks to install core. Nothing checks the rest of the screen at runtime, so get the basics right yourself:
  - every pressable has a role (`accessibilityRole="button"`, `"switch"`, …) and an accessible name (visible text, or `accessibilityLabel` for icon-only buttons);
  - touch targets are at least 44×44 pt (iOS) / 48×48 dp (Android);
  - each screen has a title marked `accessibilityRole="header"`;
  - state changes are exposed (`aria-checked`, `aria-expanded`, …).

## Pick the right helper

| You're using | Use |
| --- | --- |
| React Native `Animated` | `useAnimation` |
| Reanimated `withTiming` / `withSpring` | `useReanimatedTiming` |
| Reanimated with your own timing call | `useAnimationDuration` |
| Reanimated enter/exit (`entering` / `exiting` props) | `useReanimatedAnimationBuilder` |
| A view that should animate in on mount and out on unmount | `AnimatedContainer` |

Reanimated-based helpers need `react-native-reanimated` installed.

## useAnimation (React Native Animated)

```tsx
import { useAnimation } from '@react-native-ama/animations';

const { animatedStyle, play, progress } = useAnimation({
  duration: 300,
  useNativeDriver: true,
  from: { opacity: 0, transform: [{ translateY: 200 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
});

play().start();       // animate in
play(0).start();      // animate back

<Animated.View style={[styles.panel, animatedStyle]} />;
```

`skipIfReduceMotionEnabled: true` plays **everything** instantly when Reduce Motion is on. Use it for sequences where a partly instant, partly animated result looks broken, for example a width that jumps while its opacity still fades.

## useReanimatedTiming

```tsx
import { useReanimatedTiming } from '@react-native-ama/animations';

const { withTiming, withSpring } = useReanimatedTiming();

// The first argument is the property being animated; that's how AMA knows if it's motion.
offset.value = withTiming('translateX', 100, { duration: 300 });
offset.value = withSpring('translateX', 0);
```

## useAnimationDuration

```tsx
import { useAnimationDuration } from '@react-native-ama/animations';
import { withTiming } from 'react-native-reanimated';

const { getAnimationDuration } = useAnimationDuration();
x.value = withTiming(100, { duration: getAnimationDuration('translateX', 300) });
```

## useReanimatedAnimationBuilder / AnimatedContainer

```tsx
import { AnimatedContainer } from '@react-native-ama/animations';

<AnimatedContainer
  from={{ transform: [{ translateY: 'targetHeight' }] }}
  to={{ transform: [{ translateY: 0 }] }}
  exitFrom={{ transform: [{ translateY: 'currentHeight' }] }}
  duration={300}
  autofocus
>
  {children}
</AnimatedContainer>;
```

- `from` and `to` are required. `exitFrom` / `exitTo` are optional. Without them the exit plays `to → from`.
- `from` can use Reanimated's special entry values (`targetHeight`, `targetWidth`, `targetOriginX`, …). `exitFrom` uses the exit equivalents (`currentHeight`, …), because the `target*` names don't exist for exit animations.
- `autofocus` wraps the content in `AutofocusContainer`, which moves screen-reader focus to it on mount. Use it when the content appears because of a user action.

The hook version returns `{ entering, exiting }` to pass to any `Animated.*` component.

## Also check

- Don't autoplay looping animations, GIFs or video. Give the user a way to pause them.
- Navigation transitions: spread `useAMAContext().reactNavigationScreenOptions` into React Navigation's `screenOptions` to switch to a fade when Reduce Motion is on.

## Guideline

https://commerce.nearform.com/open-source/react-native-ama/guidelines/animations
