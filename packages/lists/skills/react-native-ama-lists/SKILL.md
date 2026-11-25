---
name: react-native-ama-lists
description: Build accessible React Native lists with @react-native-ama/lists v2 (DynamicFlatList, FlatList listType="dynamic", useDynamicList) so screen readers announce result counts when a list is filtered or searched. Use this whenever the project has @react-native-ama/lists installed and the user is building a searchable, filterable or otherwise changing list or grid — or hits FLATLIST_NO_COUNT_IN_PLURAL_MESSAGE or FLATLIST_NO_COUNT_IN_SINGULAR_MESSAGE.
---

# @react-native-ama/lists (v2)

Exports: `FlatList`, `DynamicFlatList`, `StaticFlatList`, `useDynamicList`.

## What the package solves

When a list is filtered or searched, sighted users see the results change. Screen-reader users don't, unless the app announces it. `DynamicFlatList` announces the new count ("3 results found") whenever the number of items changes.


## With or without core

This package works on its own. `@react-native-ama/core` is optional.

- **Core installed and the app wrapped in `<AMAProvider>`:** A missing `%count%` in the messages shows in AMA's overlay. Follow the `react-native-ama-core` skill too, for the rules every element must meet and for how to verify your work.
- **Core not installed:** Announcements still work. A missing `%count%` is reported with `console.error`. Don't add `AMAProvider` or core imports unless the user asks to install core. Nothing checks the rest of the screen at runtime, so get the basics right yourself:
  - every pressable has a role (`accessibilityRole="button"`, `"switch"`, …) and an accessible name (visible text, or `accessibilityLabel` for icon-only buttons);
  - touch targets are at least 44×44 pt (iOS) / 48×48 dp (Android);
  - each screen has a title marked `accessibilityRole="header"`;
  - state changes are exposed (`aria-checked`, `aria-expanded`, …).

## When to use which

- **The list can be filtered, searched or otherwise change length because of the user** → `DynamicFlatList`, or `FlatList listType="dynamic"`.
- **The list never changes length** → React Native's `FlatList` is fine. `StaticFlatList` / `listType="static"` currently behave the same as React Native's `FlatList`.

## Dynamic list

```tsx
import { DynamicFlatList } from '@react-native-ama/lists';

<DynamicFlatList
  data={filteredProducts}
  keyExtractor={item => item.id}
  renderItem={renderProduct}
  singularMessage="%count% product found"
  pluralMessage="%count% products found"
/>;
```

The equivalent with the switching component:

```tsx
import { FlatList } from '@react-native-ama/lists';

<FlatList
  listType="dynamic"
  data={filteredProducts}
  renderItem={renderProduct}
  singularMessage="%count% product found"
  pluralMessage="%count% products found"
/>;
```

| Prop | Type | Notes |
| --- | --- | --- |
| `singularMessage` | string | Required. Must contain `%count%` (`FLATLIST_NO_COUNT_IN_SINGULAR_MESSAGE`). |
| `pluralMessage` | string | Required. Must contain `%count%` (`FLATLIST_NO_COUNT_IN_PLURAL_MESSAGE`, which can't be silenced). Used for 0 and 2+. |
| `isPlural` | `(count: number) => boolean` | Default `count => count !== 1`. Override it for languages with different plural rules. |
| `numColumns` | number | Standard FlatList prop, also used for the row count. |

**When it announces:** only when the item count changes after the first render. It doesn't announce on mount or when the list returns to its original length (for example, clearing the search).

**Messages are user-facing text.** Keep them short, put the count first, and localise them with the rest of the app's strings. "0 products found" must make sense, because 0 uses `pluralMessage`.

## useDynamicList

Use this when the results render in something other than a `FlatList` (a `ScrollView` + `map`, a `SectionList`, a grid):

```tsx
import { useDynamicList } from '@react-native-ama/lists';

useDynamicList({
  data: results,
  singularMessage: '%count% result',
  pluralMessage: '%count% results',
});
```

It returns `{ rowsCount, columnsCount }`.

## List items

AMA checks each pressable row like any other pressable: it needs a role, an accessible name and the minimum size. Give every item a unique, descriptive name. Three rows all named "View details" are indistinguishable to a screen-reader user. "View details, Blue running shoes" is not.

## Guideline

https://commerce.nearform.com/open-source/react-native-ama/guidelines/lists-grids
