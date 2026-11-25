---
name: react-native-ama-core
description: Write React Native UI that passes React Native AMA's runtime accessibility checks, and use @react-native-ama/core (AMAProvider, useAMAContext, AutofocusContainer, useFocus, useTimedAction, ama.config.json). Use this whenever the project has @react-native-ama/core installed, the user mentions AMA or AMAProvider, asks to make a React Native screen or component accessible, or is fixing an AMA error such as NO_ACCESSIBILITY_ROLE, MINIMUM_SIZE, CONTRAST_FAILED, NO_HEADER_FOUND or INPUT_HAS_NO_VISIBLE_LABEL — even if they don't say "accessibility".
---

# React Native AMA — core (v2)

`@react-native-ama/core` does two things:

1. **Runtime checks.** Inside `<AMAProvider>`, a dev build scans the rendered native UI and flags problems on screen and in the console. The scanner reads what is actually rendered (sizes, colours, roles, labels), so code that "looks right" in JSX can still fail.
2. **Hooks and components** for the things every app needs: reading the user's accessibility settings, moving focus, timeouts, hiding decorative content.

Checks run only when `__DEV__` is true and are stripped from production builds.

## Other AMA packages have their own skills

`@react-native-ama/forms`, `lists`, `animations` and `bottom-sheet` each ship a skill for their own API (`react-native-ama-forms`, and so on). When one of those packages is installed and you're building what it covers, follow its skill as well as this one. This skill doesn't repeat their APIs.

If the project doesn't have the package for what you're building, you can suggest it, but don't install it without asking:

| You're building | Package |
| --- | --- |
| A form with text inputs | `@react-native-ama/forms` |
| A list the user can filter or search | `@react-native-ama/lists` |
| Motion animations (slide, scale, position) | `@react-native-ama/animations` |
| A bottom sheet or drawer | `@react-native-ama/bottom-sheet` |

## Version check first

This skill covers **v2** (`2.x`). Check `package.json` before writing code. Older APIs that you may remember from training data are wrong for v2:

- `react-native-ama` (single package, v0) and `@react-native-ama/react-native` / `@react-native-ama/internal` (v1) **no longer exist**. Use React Native's own `Pressable`, `Text`, `TouchableOpacity` and so on. AMA checks them at runtime instead of replacing them.
- The config file is `ama.config.json` (v1 used `ama.rules.json`).

If the project is on v1, say so and ask before upgrading. Don't mix APIs.

## Setup

```tsx
import { AMAProvider } from '@react-native-ama/core';

export const App = () => (
  <AMAProvider>
    <RootNavigator />
  </AMAProvider>
);
```

`ama.config.json` lives in the project root and is created on install. Changes need an app restart. See `references/core-api.md` for its keys and for the hooks and components.

## What the runtime scanner checks

Write code so these pass on the first run. Full rule list with fixes: `references/rules.md`.

**Every pressable element** (`Pressable`, `TouchableOpacity`, anything with `onPress`):
- Has a role: `accessibilityRole="button"` (or `role="button"`). Pick the role that matches the behaviour: `button`, `link`, `switch`, `tab`, `search`, `image`, `header`, `none` work on both platforms. `checkbox`, `radio` and `togglebutton` are Android-only and `adjustable` is iOS-only, so AMA reports `INCOMPATIBLE_ACCESSIBILITY_ROLE` on the other platform. For a cross-platform toggle, use `switch` with `aria-checked`.
- Has an accessible name. Visible text inside it counts. Icon-only buttons need `accessibilityLabel`. Write labels in sentence case, describing the action ("Add to cart", "Close"), never all caps.
- Is at least **44×44 pt on iOS, 48×48 dp on Android**. Prefer `minWidth` / `minHeight` (or padding) over `hitSlop`. AMA's guidelines recommend real size because `hitSlop` targets can overlap.
- Has enough text/background contrast: WCAG AA, 4.5:1 for normal text, 3:1 for large text.

**Every screen** has at least one `Text` with `accessibilityRole="header"` (or `role="heading"`). If the design has no visible title, add one anyway (the navigation header title usually works). Otherwise AMA reports `NO_HEADER_FOUND`, which can't be silenced.

**Text:** avoid ALL-CAPS strings (4+ letters by default). Screen readers read them flatly or letter by letter. `textTransform: 'uppercase'` does not avoid this, because React Native uppercases the native text that the screen reader reads. If the design needs capitals, keep `textTransform` for the look and give the element (or its pressable parent) a normally cased `accessibilityLabel`. Long digit runs (12+ by default, such as card or account numbers) need a spaced-out `accessibilityLabel` so they're read digit by digit.

**Images:** give meaningful images an `accessibilityLabel`. Mark decorative ones with `accessible={false}`.

**State changes:** when a tap changes what something looks like, expose the new state. Use `aria-checked`, `aria-expanded`, `aria-selected`, `aria-disabled` or `aria-busy` (or the matching `accessibilityState` keys). AMA compares the UI before and after the tap and reports `NO_ACCESSIBILITY_STATE_SET` if the visuals changed but the state didn't.

**Never pass `undefined` explicitly** to an accessibility prop (`accessibilityLabel={maybeLabel}` where it can be undefined). Omit the prop or give it a real value.

### Prop names

React Native accepts both `accessibilityRole` / `accessibilityLabel` / `accessibilityState` and the newer `role` / `aria-label` / `aria-checked` style. Follow whatever the codebase already uses. `aria-role` is **not** a React Native prop: use `role` or `accessibilityRole`.

## Don't silence rules to pass checks

`ama.config.json` can lower a rule's severity or switch it off (`"PLEASE_FORGIVE_ME"`). That exists for genuine edge cases outside the developer's control, such as a third-party component. Fix the code instead. If you think a rule really should be relaxed, explain why and ask the user. Don't edit the config yourself. Some rules can't be overridden at all: `NO_ACCESSIBILITY_ROLE`, `NO_ACCESSIBILITY_LABEL`, `NO_KEYBOARD_TRAP`, `NO_UNDEFINED`, `INPUT_HAS_NO_VISIBLE_LABEL`, `FLATLIST_NO_COUNT_IN_PLURAL_MESSAGE`, `BOTTOM_SHEET_CLOSE_ACTION`, `INCOMPATIBLE_ACCESSIBILITY_STATE`, `INCOMPATIBLE_ACCESSIBILITY_ROLE`, `NO_HEADER_FOUND`.

Fixes that make a check pass while making the app worse don't count either. Examples: deleting the element, hiding a real control with `accessible={false}`, or adding a generic label like "Button" or "Image".

Adding a genuine acronym (FAQ, PDF, USA) to `accessibilityLabelExceptions` is a normal use of the config.

## Verifying your work

AMA can only check what is rendered on screen in a running dev build. Writing the code is not the same as having verified it.

- **If an AMA verification tool is available** (for example an MCP tool that returns AMA issues from the simulator), run it after each change, on the screen you changed, and fix what it reports before saying you're done. Make sure the result comes from a scan that ran after your change loaded.
- **Otherwise**, tell the user what to check. Open the screen in a dev build, look for AMA's highlighted elements and error summary, and set `"log": "always"` in `ama.config.json` if they want issues printed to the console without opening the inspector. Name the rules most likely to fire for what you built.
- Interaction checks (state changes, keyboard trap, return key) only fire when someone actually interacts: taps the toggle, presses "next" on the keyboard. Say this when it applies.

AMA catches common problems but not all of them. For anything non-trivial, recommend a quick pass with VoiceOver or TalkBack: focus order, what's announced, and whether everything can be reached and dismissed.
