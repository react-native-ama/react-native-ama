---
name: react-native-ama-forms
description: Build accessible React Native forms with @react-native-ama/forms v2 (Form, TextInput with renderLabel/renderError, Form.Field, Form.Submit, useFormField, useTextInput). Use this whenever the project has @react-native-ama/forms installed and the user is building or fixing a form, sign-up or login screen, text inputs, validation errors, keyboard 'next'/'done' behaviour or focus order — or hits an AMA error such as INPUT_HAS_NO_VISIBLE_LABEL, INPUT_HAS_FOCUSABLE_LABEL, INPUT_INVALID_RETURN_KEY or NO_KEYBOARD_TRAP.
---

# @react-native-ama/forms (v2)

Exports: `Form` (with `Form.Field`, `Form.Submit`), `FormField`, `FormSubmit`, `TextInput`, `useFormField`, `useFormSubmit`, `useTextInput`, and the types `FormProps`, `FormActions`, `FormFieldProps`, `FormSubmitProps`, `FormSubmitRenderProps`, `TextInputProps`.

There is no `useForm`, `SwitchListItem` or `Text` export in v2, even though older docs show them.

## What the package solves

- **Focus order.** Pressing "next" on the keyboard moves to the next field; the last field gets "done" and submits.
- **Failed submit.** Focus moves to the first invalid field.
- **Labels.** The visible label is hidden from the screen reader, so it isn't announced twice, while the input carries the accessible name.
- **Keyboard trap detection** (dev only).


## With or without core

This package works on its own. `@react-native-ama/core` is optional.

- **Core installed and the app wrapped in `<AMAProvider>`:** AMA also checks labels, return keys and keyboard traps at runtime and shows them in its overlay. Follow the `react-native-ama-core` skill too, for the rules every element must meet and for how to verify your work.
- **Core not installed:** Focus order, "next"/"done" handling and hidden labels still work. The keyboard-trap check falls back to `console.error`; the label and return-key checks need core. Don't add `AMAProvider` or core imports unless the user asks to install core. Nothing checks the rest of the screen at runtime, so get the basics right yourself:
  - every pressable has a role (`accessibilityRole="button"`, `"switch"`, …) and an accessible name (visible text, or `accessibilityLabel` for icon-only buttons);
  - touch targets are at least 44×44 pt (iOS) / 48×48 dp (Android);
  - each screen has a title marked `accessibilityRole="header"`;
  - state changes are exposed (`aria-checked`, `aria-expanded`, …).

## A complete form

```tsx
import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { Form, TextInput, type FormActions } from '@react-native-ama/forms';

export const SignUpForm = () => {
  const formRef = React.useRef<FormActions>(null);
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [errors, setErrors] = React.useState({ name: false, email: false });

  // Must return true when valid, false when not.
  // Returning false makes AMA focus the first field with hasError.
  const handleSubmit = () => {
    const next = { name: name.trim() === '', email: !email.includes('@') };
    setErrors(next);
    return !next.name && !next.email;
  };

  return (
    <Form onSubmit={handleSubmit} ref={formRef}>
      <TextInput
        accessibilityLabel="Full name"
        value={name}
        onChangeText={setName}
        autoComplete="name"
        hasValidation
        hasError={errors.name}
        errorMessage={errors.name ? 'Enter your full name' : undefined}
        renderLabel={a11yProps => <Text {...a11yProps}>Full name</Text>}
        renderError={a11yProps => (
          <Text {...a11yProps} style={{ color: '#A80000' }}>
            Enter your full name
          </Text>
        )}
      />

      <TextInput
        accessibilityLabel="Email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        hasValidation
        hasError={errors.email}
        errorMessage={errors.email ? 'Enter a valid email address' : undefined}
        renderLabel={a11yProps => <Text {...a11yProps}>Email address:</Text>}
        renderError={a11yProps => (
          <Text {...a11yProps} style={{ color: '#A80000' }}>
            Enter a valid email address
          </Text>
        )}
      />

      <Form.Submit>
        {({ onPress }) => (
          <Pressable
            onPress={onPress}
            accessibilityRole="button"
            style={{ minHeight: 48, justifyContent: 'center' }}>
            <Text>Create account</Text>
          </Pressable>
        )}
      </Form.Submit>
    </Form>
  );
};
```

## The rules that bite

**The accessible name must match the visible label.** AMA looks for a rendered `Text` whose content equals the input's `accessibilityLabel`. The comparison ignores letter case and one trailing symbol, so `"Email address:"` matches `"Email address"`. If they differ (for example a label of "Email" and an accessibilityLabel of "Your email"), you get `INPUT_HAS_NO_VISIBLE_LABEL`, which can't be silenced. A placeholder is not a label.

**Always spread `a11yProps` onto the label and error elements.** They hide those elements from the screen reader. Without them, the label is announced twice (`INPUT_HAS_FOCUSABLE_LABEL`).

**`accessibilityLabel` (or `aria-label`) is required** on `TextInput`. The type enforces one or the other, not both.

**Required fields:** don't signal "required" only with an asterisk (`INPUT_HAS_NO_VISIBLE_LABEL_ENDING_WITH_ASTERISK`). Say it in words, for example a label of "Email address (required)".

**`hasValidation` is required.** Set it to `true` on fields that can show an error and `false` on fields that can't.

**`onSubmit` returns a boolean** (or a promise of one). Returning nothing counts as "invalid". AMA then tries to focus an invalid field and, if none has `hasError`, does nothing.

**`errorMessage` is announced only while `hasError` is true.** It's added to the accessibility hint, so keep it short and say how to fix the problem ("Enter a valid email address"). In 2.0.0 it was announced even on valid fields; on that version, pass it only while the field is in error, as in the example above.

**Let AMA set `returnKeyType`.** It uses "next" for every field except the last and "done" for the last one. Setting `returnKeyType="done"` on a field that isn't last triggers `INPUT_INVALID_RETURN_KEY`. AMA doesn't change a `returnKeyType` you pass explicitly, so only set it to override the order (see below).

## Conditional fields

Fields register with the form in mount order. A field that appears later is appended at the end, which breaks the "next" order and the "done" key. When fields render conditionally, wire the order explicitly:

```tsx
{showCompany ? (
  <TextInput
    accessibilityLabel="Company"
    hasValidation={false}
    returnKeyType="next"
    nextFieldId="phone"        // or nextFormField={phoneRef}
    renderLabel={p => <Text {...p}>Company</Text>}
  />
) : null}

<TextInput
  id="phone"
  accessibilityLabel="Phone number"
  hasValidation={false}
  renderLabel={p => <Text {...p}>Phone number</Text>}
/>
```

`nextFormField` (a ref) takes priority over `nextFieldId`.

## TextInput props (v2, beyond React Native's own)

| Prop | Type | Notes |
| --- | --- | --- |
| `accessibilityLabel` / `aria-label` | string | One is required. Must match the visible label text. |
| `renderLabel` | `(a11yProps) => ReactNode` | Spread `a11yProps` onto the label. |
| `labelPosition` | `'beforeInput' \| 'afterInput'` | Default `'beforeInput'`. |
| `renderError` | `(a11yProps) => ReactNode` | Rendered only when `hasError` is true. Spread `a11yProps`. |
| `errorPosition` | `'belowLabel' \| 'afterInput'` | Default `'afterInput'`. |
| `hasValidation` | boolean | Required. |
| `hasError` | boolean | Marks the field for "focus first invalid field". |
| `errorMessage` | string | Appended to the accessibility hint. See the caveat above. |
| `id` | string | So other fields can target it with `nextFieldId`. |
| `nextFieldId` | string | Field to focus on "next". |
| `nextFormField` | RefObject | Field to focus on "next". Takes priority over `nextFieldId`. |

## Form

- `onSubmit: () => boolean | Promise<boolean>`. Required.
- `ref: FormActions` gives you `focusFirstInvalidField()` and `focusFieldAt(index)`.

## Form.Submit / useFormSubmit

`Form.Submit` takes a render-prop child `({ onPress }) => ReactNode`. `useFormSubmit()` returns `{ submitForm }` for when you'd rather not have a wrapper. Both must be inside `<Form>`. The button itself still needs a role, a name and the minimum size. Set `aria-busy` while submission is in progress.

## Non-text fields (switches, pickers, custom rows)

Wrap them in `Form.Field` so "next" can land on them and they take part in validation.

By default (`wrapInsideAccessibleView`), `Form.Field` renders a `TouchableWithoutFeedback` around a single accessible `View`, so the screen reader treats the whole field as **one** element. The control inside (for example a `Switch`) is no longer announced on its own, so its role and state must go on `Form.Field` itself, which passes them to that `View`:

```tsx
<Form.Field
  id="newsletter"
  hasValidation={false}
  accessibilityRole="switch"
  aria-checked={subscribed}
  onPress={() => setSubscribed(value => !value)}>
  <View style={{ flexDirection: 'row', alignItems: 'center', minHeight: 48 }}>
    <Text style={{ flex: 1 }}>Email me product updates</Text>
    <Switch value={subscribed} onValueChange={setSubscribed} />
  </View>
</Form.Field>
```

Use `accessibilityRole` and `accessibilityLabel` here, **not** `role` / `aria-label`: `TouchableWithoutFeedback` doesn't pass those two through. `aria-checked`, `aria-selected`, `aria-expanded`, `aria-disabled`, `aria-busy` and `accessibilityState` do work. Confirm the announcement with VoiceOver or TalkBack: the row should be read as a switch with its on/off state.

`Form.Field` props: `id`, `hasValidation` (required), `hasError`, `errorMessage`, `wrapInsideAccessibleView` (default `true`), plus `TouchableWithoutFeedback` props.

For a fully custom field, use `useFormField({ ref, hasFocusCallback, hasValidation, ... })`, which returns `{ focusNextFormField, isLastField, accessibilityHint }`. Use `hasFocusCallback: true` only when the element has a `.focus()` method, like a text input.

## Guideline

https://commerce.nearform.com/open-source/react-native-ama/guidelines/forms
