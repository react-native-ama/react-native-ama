import { Required } from '@site/src/components';

# Form

The `<Form />` component provides a "local" context for the [`TextInput`](./TextInput.mdx) and [`FormField`](./FormField.md) components.

The provider hosts the `ref` values used by the [TextInput](./TextInput.mdx) to know which [`returnKey`](./TextInput.mdx#returnkeytype) and what would be the next field to focus.

## Usage

```jsx
<Form onSubmit={handleSubmit} ref={ref}>
  {...}
</Form>
```

## Example

```jsx
import { Form, TextInput } from '@react-native-ama/forms';

const ExampleForm = () => {
  return (
    <Form onSubmit={handleSubmit}>
      <TextInput
        accessibilityLabel="First name"
        onChangeText={setFirstName}
        hasValidation={false}
        renderLabel={a11yProps => <Text {...a11yProps}>First name:</Text>}
      />

      <TextInput
        accessibilityLabel="Last name"
        onChangeText={setLastName}
        hasValidation={false}
        renderLabel={a11yProps => <Text {...a11yProps}>Last name:</Text>}
      />

      <Form.Field id="newsletter" hasValidation={false}>
        <NewsletterSwitch value={isSubscribed} onValueChange={toggleSwitch} />
      </Form.Field>

      <TextInput
        accessibilityLabel="Email address"
        onChangeText={setEmailAddress}
        hasValidation={false}
        renderLabel={a11yProps => <Text {...a11yProps}>Email address:</Text>}
      />

      <Form.Submit>
        {({ onPress }) => <CustomSubmitButton onPress={onPress} />}
      </Form.Submit>
    </Form>
  );
};
```

When the user interacts with this form:

- The _First name_ field has `returnKeyType="next"` and focuses the `Last name` one when the next button is pressed
- The _Last name_ has `returnKeyType="next"` and focuses the newsletter switch when the next button is pressed
- The switch does not show any keyboard, but swiping right will focus the email address field
- The _Email address_ has `returnKeyType="done"` as is the last field of the form and triggers the `onSubmit` callback when the done button is pressed

## Conditional fields

The field refs are added to the ref in the same order they are added to the DOM, so in the previous example, the order will be:

1. TextInput - First name
1. TextInput - Last name
1. Form.Field - Newsletter switch
1. TextInput - Email address

This all works fine, but the logic will fail when a component is rendered conditionally as refs are appended to the array, so this edge case needs to be handled manually.

### Won't work

```jsx
<Form onSubmit={handleSubmit}>
  <TextInput
    accessibilityLabel="First name"
    hasValidation={false}
    renderLabel={a11yProps => <Text {...a11yProps}>First name:</Text>}
  />

  {isLastNameVisible ? (
    <TextInput
      accessibilityLabel="Last name"
      hasValidation={false}
      renderLabel={a11yProps => <Text {...a11yProps}>Last name:</Text>}
    />
  ) : null}

  <TextInput
    accessibilityLabel="Email address"
    hasValidation={false}
    renderLabel={a11yProps => <Text {...a11yProps}>Email address:</Text>}
  />
</Form>
```

`Last name` is conditionally rendered and, when it appears, is appended at the end of the ref list, so it gets `returnKeyType="done"`.

:::note

`Email address` will always be `returnKeyType="done"` as its value is decided when the component is mounted and doesn't change with next re-render

:::

### Let's fix it

To fix the problem, we can manually tell the `TextInput` the return key to display and the ID or ref of the next element to be focused:

#### 1. Specifying the ID

```jsx
{isLastNameVisible ? (
  <TextInput
    accessibilityLabel="Last name"
    hasValidation={false}
    renderLabel={a11yProps => <Text {...a11yProps}>Last name:</Text>}
    returnKeyType="next"
    nextFieldId="email-field" // The next field ID to be focused
  />
) : null}

<TextInput
  id="email-field" // The field ID
  accessibilityLabel="Email address"
  hasValidation={false}
  renderLabel={a11yProps => <Text {...a11yProps}>Email address:</Text>}
/>
```

#### 2. Specifying the ref

```jsx
const emailRef = React.useRef(null);

{isLastNameVisible ? (
  <TextInput
    accessibilityLabel="Last name"
    hasValidation={false}
    renderLabel={a11yProps => <Text {...a11yProps}>Last name:</Text>}
    returnKeyType="next"
    nextFormField={emailRef}
  />
) : null}

<TextInput
  ref={emailRef}
  accessibilityLabel="Email address"
  hasValidation={false}
  renderLabel={a11yProps => <Text {...a11yProps}>Email address:</Text>}
/>
```

## Props

### <Required /> `onSubmit`

The callback to be called when the form is submitted, either by [`Form.Submit`](./FormSubmit.md) or when the user presses **done** on the last [`TextInput`](./TextInput.mdx).

It must return `true` when the form is valid and `false` when it isn't (or a promise of either). When it returns `false`, AMA focuses the first field with `hasError`.

| Type                                       |
| ------------------------------------------ |
| `() => boolean \| Promise<boolean>`       |

### `ref` _(optional)_

The form provider reference provides access to `focusFirstInvalidField` and `focusFieldAt` methods.

| Type                           | Default   |
| ------------------------------ | --------- |
| React.RefObject\<FormActions\> | undefined |

## Methods (`FormActions`)

### `focusFirstInvalidField`

This method lets you manually shift the focus to the first field that has an error.

`focusFirstInvalidField: () => void;`

```
// To manually focus the first invalid field
const focusInvalidField = () => {
    ref.current?.focusFirstInvalidField()
}

<Form onSubmit={handleSubmit} ref={ref}>
    <Pressable onPress={focusInvalidField} />
</Form>
```

### `focusFieldAt`

This method lets you manually shift the focus to any field controlled by the form. Simply call the method with the fieldNumber reference which is the zero-based index of the field in the list.

`focusFieldAt: (fieldNumber: number) => void;`

## Related guidelines

- [Forms](/guidelines/forms)
