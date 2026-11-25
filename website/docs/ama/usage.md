---
displayed_sidebar: docs
---

# Usage

## Installation

```bash npm2yarn
npm install  @react-native-ama/core
```

## Wrap App with Provider

You need to add the [AMAProvider](/core/components/AMAProvider) to your app as it is needed by the components, hooks, and to provide information about accessibility violations.

```jsx {1-4,8-9}
import { AMAProvider } from '@react-native-ama/core';

const App = () => {
  return (
    <AMAProvider>
      <YourApp />
    </AMAProvider>
  );
};
```

## Example

In the following example, the navigation animation is disabled when the user enables the [Reduce Motion](/guidelines/animations) setting.

It also shows how to build a more accessible [form](/guidelines/forms) using the built-in components.

```jsx
import * as React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { AMAProvider, useAMAContext } from '@react-native-ama/core';
import { Form, TextInput } from '@react-native-ama/forms';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <AMAProvider>
      <AppNavigator />
    </AMAProvider>
  );
};

const AppNavigator = () => {
  const { reactNavigationScreenOptions } = useAMAContext();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          ...reactNavigationScreenOptions,
        }}>
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Sign up' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export const HomeScreen = () => {
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [emailAddress, setEmailAddress] = React.useState('');
  const [invalidFields, setInvalidFields] = React.useState({
    firstName: false,
    lastName: false,
  });

  // Return true when the form is valid. Returning false makes AMA
  // move the focus to the first field with hasError.
  const handleOnSubmit = () => {
    const invalid = {
      firstName: firstName.trim().length === 0,
      lastName: lastName.trim().length === 0,
    };
    setInvalidFields(invalid);

    return !invalid.firstName && !invalid.lastName;
  };

  return (
    <Form onSubmit={handleOnSubmit}>
      <ScrollView style={styles.view}>
        <TextInput
          style={styles.input}
          accessibilityLabel="First name"
          onChangeText={setFirstName}
          defaultValue={firstName}
          hasValidation={true}
          hasError={invalidFields.firstName}
          errorMessage={
            invalidFields.firstName ? 'The first name cannot be blank' : undefined
          }
          renderLabel={a11yProps => (
            <Text {...a11yProps} style={styles.label}>
              First name:
            </Text>
          )}
          renderError={a11yProps => (
            <Text {...a11yProps}>The first name cannot be blank</Text>
          )}
        />

        <TextInput
          style={styles.input}
          accessibilityLabel="Last name"
          onChangeText={setLastName}
          defaultValue={lastName}
          hasValidation={true}
          hasError={invalidFields.lastName}
          errorMessage={
            invalidFields.lastName ? 'The last name cannot be blank' : undefined
          }
          renderLabel={a11yProps => (
            <Text {...a11yProps} style={styles.label}>
              Last name:
            </Text>
          )}
          renderError={a11yProps => (
            <Text {...a11yProps}>The last name cannot be blank</Text>
          )}
        />

        <TextInput
          style={styles.input}
          accessibilityLabel="Email address"
          onChangeText={setEmailAddress}
          defaultValue={emailAddress}
          keyboardType="email-address"
          hasValidation={false}
          renderLabel={a11yProps => (
            <Text {...a11yProps} style={styles.label}>
              Email address:
            </Text>
          )}
        />

        <Form.Submit>
          {({ onPress }) => (
            <Pressable
              onPress={onPress}
              accessibilityRole="button"
              style={styles.submit}>
              <Text>Submit</Text>
            </Pressable>
          )}
        </Form.Submit>
      </ScrollView>
    </Form>
  );
};

const styles = StyleSheet.create({
  view: {
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    padding: 10,
  },
  label: {
    paddingBottom: 8,
  },
  submit: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default App;
```
