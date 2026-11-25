# @react-native-ama/core (v2)

Exports: `AMAProvider`, `useAMAContext`, `AutofocusContainer`, `HideChildrenFromAccessibilityTree`, `useFocus`, `useTimedAction`, plus the native module (`default`, `ReactNativeAmaView`) and types.

## AMAProvider and useAMAContext

Wrap the app root once. `useAMAContext()` returns the user's system accessibility settings:

| Value | Platform |
| --- | --- |
| `isScreenReaderEnabled` | both |
| `isReduceMotionEnabled` | both (on Android, animations turned off) |
| `isBoldTextEnabled`, `isGrayscaleEnabled`, `isInvertColorsEnabled`, `isReduceTransparencyEnabled`, `isDarkerSystemColorsEnabled` | iOS |
| `isHighTextContrastEnabled` | Android |
| `reactNavigationScreenOptions` | `{ animationEnabled, animation: 'default' \| 'fade' }`. Spread it into a navigator's `screenOptions`. |
| `trackError(rule, ref?)` | Dev only. Reports a custom check failure to AMA's overlay. |

Use these to adapt rather than to hide things. For example, swap a parallax hero for a static image under Reduce Motion, or drop a translucent blur under Reduce Transparency.

## Moving focus: AutofocusContainer and useFocus

When content appears because of a user action (a result panel, an inline confirmation, a step in a wizard), screen-reader users aren't told unless focus moves to it.

```tsx
import { Text } from 'react-native';
import { AutofocusContainer } from '@react-native-ama/core';

{showResult ? (
  <AutofocusContainer>
    <Text>Payment received</Text>
    <Text>Receipt sent to alex@example.com</Text>
  </AutofocusContainer>
) : null}
```

By default the children are wrapped in one accessible `View`, so everything inside is read together when focus lands. With `wrapChildrenInAccessibleView={false}`, focus only works if the children contain accessible elements. For accessibility props the inner `View` doesn't support (such as `accessibilityActions`), use `touchableContainerAccessibilityProps`.

`useFocus` covers the other cases:

```tsx
import * as React from 'react';
import { Text } from 'react-native';
import { useFocus } from '@react-native-ama/core';

const titleRef = React.useRef<Text>(null);
useFocus(titleRef);                 // focus on mount

const { setFocus } = useFocus();     // focus on demand
setFocus(errorSummaryRef.current);
```

On a new screen, it's usually best to focus the screen's header so users know where they are. Pick one convention and apply it to every screen.

## Timeouts: useTimedAction

Don't auto-dismiss with a bare `setTimeout`. Users who need more time (motor or cognitive disabilities, screen-reader users) lose the content before they can act on it.

```tsx
import { useTimedAction } from '@react-native-ama/core';

const { onTimeout } = useTimedAction();

await onTimeout(() => setShowToast(false), 5000);
```

- **Android:** uses the system's "Time to take action" setting when the user has set one.
- **iOS:** when a screen reader is on, the callback is skipped entirely, so make sure the content can be dismissed manually.

It returns a promise of the timer handle (or `null` when skipped). Clear it on unmount.

## Hiding decorative content

```tsx
import { HideChildrenFromAccessibilityTree } from '@react-native-ama/core';

<HideChildrenFromAccessibilityTree>
  <DecorativeIllustration />
</HideChildrenFromAccessibilityTree>
```

This hides the children only while a screen reader is on. For a single decorative `Image`, `accessible={false}` is simpler and also satisfies `IMAGE_MISSING_ALT_TEXT`. Never hide something the user can interact with.

## ama.config.json

Lives in the project root. Restart the app after changing it.

```json
{
  "rules": {},
  "accessibilityLabelExceptions": ["FAQ"],
  "highlight": { "mode": "both" },
  "log": "inspect",
  "uppercaseMinLength": 4,
  "longNumberMinLength": 12,
  "checks": { "ui": true, "forms": true, "delay": 1000 }
}
```

| Key | Meaning |
| --- | --- |
| `rules` | Per-rule overrides. Values are `"MUST"` / `"MUST_NOT"` (error overlay), `"SHOULD"` / `"SHOULD_NOT"` (console warning) or `"PLEASE_FORGIVE_ME"` (off). Not `"error"` / `"warn"`, which older docs show. Also holds `CONTRAST_CHECKER_MAX_DEPTH` (default 5; 0 disables contrast checks) and `IGNORE_CONTRAST_FOR_DISABLED_ELEMENTS`. |
| `accessibilityLabelExceptions` | All-caps strings that are allowed, such as acronyms. A top-level key, not inside `rules`. |
| `highlight` | `mode`: `"border"`, `"background"` or `"both"`. Also `borderWidth`, `gap`. |
| `log` | `"inspect"` (default: log only while AMA's inspector is open) or `"always"`. |
| `uppercaseMinLength` / `longNumberMinLength` | Thresholds for those two checks. |
| `checks` | Turn interaction checks (`ui`) and form checks (`forms`) on or off. `delay` is the time in ms before re-checking after an interaction. |

Adding a genuine acronym (FAQ, PDF, USA) to `accessibilityLabelExceptions` is a normal use of the config. Lowering a rule's severity to make an error go away is not; see the main skill file.
