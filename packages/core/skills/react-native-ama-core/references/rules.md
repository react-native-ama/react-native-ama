# AMA rules: what triggers them and how to fix them

Severity: **error** rules show AMA's error overlay; **warn** rules log a warning. "Locked" rules can't be changed in `ama.config.json`.

The runtime scanner looks at four kinds of rendered element: pressables, `Text`, `TextInput` and `Image`. Other rules come from AMA components, hooks and interaction checks.

`aria-role` is not a React Native prop: use `role="…"` or `accessibilityRole="…"`. AMA's fix text before 2.0.1 said `aria-role`.

## Pressables and labels

| Rule | Level | Triggered when | Fix |
| --- | --- | --- | --- |
| `NO_ACCESSIBILITY_ROLE` | error, locked | A pressable has no role. | Add `accessibilityRole` / `role` matching what it does: `button`, `link`, `switch`, `tab`… |
| `INCOMPATIBLE_ACCESSIBILITY_ROLE` | error, locked | The role isn't native on this platform: `checkbox`, `radio` and `togglebutton` on iOS, `adjustable` on Android. | Use a cross-platform role (`switch` + `aria-checked` for toggles), or choose by `Platform.OS`. |
| `NO_ACCESSIBILITY_LABEL` | error, locked | A pressable or text input has no accessible name. | Visible text inside the pressable counts. Icon-only buttons need `accessibilityLabel` describing the action ("Delete message"). |
| `NO_UNDEFINED` | error, locked | An accessibility prop was passed `undefined` explicitly. | Omit the prop or pass a real value. |
| `NO_UPPERCASE_ACCESSIBILITY_LABEL` | warn | `accessibilityLabel` is all caps. | Sentence case. Acronyms go in `accessibilityLabelExceptions`. |
| `MINIMUM_SIZE` | error | A pressable's touch area is under 44×44 (iOS) / 48×48 (Android). `hitSlop` is counted. | Prefer `minWidth` / `minHeight` or padding. `hitSlop` passes the check, but neighbouring targets can overlap. |
| `CONTRAST_FAILED` | error | Text vs background contrast is below WCAG AA (4.5:1, or 3:1 for large text). | Change the colours. Don't lower the rule. |
| `CONTRAST_FAILED_AAA` | warn | Below AAA (7:1 / 4.5:1). | Improve if the design allows. |
| `INCOMPATIBLE_ACCESSIBILITY_STATE` | error, locked | A state that doesn't apply to the element (for example `checked` on something that isn't checkable). | Use states valid for the role. |

## Text and images

| Rule | Level | Triggered when | Fix |
| --- | --- | --- | --- |
| `NO_HEADER_FOUND` | error, locked | No `Text` on screen has the header role. | Mark the screen title with `accessibilityRole="header"` / `role="heading"`. Add one even if the design has no visible title. |
| `NO_UPPERCASE_TEXT` | error | Text content is all caps (≥ `uppercaseMinLength` letters, default 4). `textTransform: 'uppercase'` counts, because React Native uppercases the native text. | Write it in normal case. If it must look capitalised, keep the style and add a normally cased `accessibilityLabel`. |
| `UPPERCASE_TEXT_NO_ACCESSIBILITY_LABEL` | error | All-caps text without a normally cased label. | Add a sentence-case `accessibilityLabel`, or fix the text. |
| `LONG_NUMBER_NOT_FORMATTED` | warn | A run of ≥ `longNumberMinLength` (default 12) digits with no breaks. | Give it an `accessibilityLabel` with spaces between digit groups ("4111 1111 1111 1111") so it's read digit by digit. |
| `IMAGE_MISSING_ALT_TEXT` | error | An accessible `Image` has no label. | `accessibilityLabel` describing the content. Decorative images: `accessible={false}`. |

## Forms (see the `react-native-ama-forms` skill)

| Rule | Level | Triggered when | Fix |
| --- | --- | --- | --- |
| `INPUT_HAS_NO_VISIBLE_LABEL` | error, locked | No visible `Text` on screen matches the input's `accessibilityLabel` (case-insensitive, one trailing symbol ignored). | Render a visible label whose text equals the accessible name. Placeholders don't count. |
| `INPUT_HAS_FOCUSABLE_LABEL` | error | That visible label can itself be focused, so it's announced twice. | Spread `renderLabel`'s `a11yProps` on it, or set `importantForAccessibility="no-hide-descendants"` + `accessibilityElementsHidden`. |
| `INPUT_HAS_NO_VISIBLE_LABEL_ENDING_WITH_ASTERISK` | error | "Required" is shown only by an asterisk. | Say "required" in words. |
| `INPUT_INVALID_RETURN_KEY` | error | A text input that isn't the last on screen uses "done". | Let AMA's `TextInput` manage `returnKeyType`, or set "next" and move focus in `onSubmitEditing`. |
| `NO_KEYBOARD_TRAP` | error, locked | After "next", focus stayed in the field or didn't reach the next one. Only detected on interaction. | Don't refocus a field in `onBlur` / on validation failure. Check `nextFieldId` / `nextFormField` wiring. |
| `NO_FORM_ERROR` | error | A submit failed with no error communicated and no focus moved. | Return `false` from `Form`'s `onSubmit`, set `hasError` on invalid fields and render the error with `renderError`. |

## Interaction, lists, bottom sheet

| Rule | Level | Triggered when | Fix |
| --- | --- | --- | --- |
| `NO_ACCESSIBILITY_STATE_SET` | error | After a tap, the element changed visually but its accessibility state didn't. Only detected on interaction. | Set the matching `aria-checked` / `aria-expanded` / `aria-selected` / `aria-disabled` / `aria-busy` from the same state that drives the visuals. |
| `FLATLIST_NO_COUNT_IN_PLURAL_MESSAGE` | error, locked | `pluralMessage` lacks `%count%`. | Include `%count%`. |
| `FLATLIST_NO_COUNT_IN_SINGULAR_MESSAGE` | warn | `singularMessage` lacks `%count%`. | Include `%count%`. |
| `BOTTOM_SHEET_CLOSE_ACTION` | error, locked | The bottom sheet has no accessible way to close. | Provide `closeActionAccessibilityLabel`. If `persistent`, add a visible close button. |

## Rules defined but not currently reported

In v2.0.x, `NO_UNDEFINED`, `INCOMPATIBLE_ACCESSIBILITY_STATE`, `NO_FORM_ERROR` and `BOTTOM_SHEET_CLOSE_ACTION` exist in the rule list, but no check emits them. Follow their guidance anyway. A clean AMA scan doesn't prove these are satisfied.

## Known false positive

React Native's own LogBox overlay doesn't meet AMA's rules and can be flagged. That's not the app's fault. `LogBox.ignoreAllLogs()` hides it, but it also hides every other LogBox warning.
