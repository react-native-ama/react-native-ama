import { render } from '@testing-library/react-native';
import * as React from 'react';
import * as UseDynamicList from '../hooks/useDynamicList';
import { DynamicFlatList } from './DynamicFlatList';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('DynamicFlatList', () => {
  it('sets role="list" when __DEV__ is true', () => {
    const { getByTestId } = render(
      <DynamicFlatList
        data={[]}
        singularMessage="%count% singular"
        pluralMessage="%count% plural"
        renderItem={() => null}
        testID={'test-id'}
      />,
    );

    expect(getByTestId('test-id').props.role).toBe('list');
  });

  it('passes the list props to useDynamicList', () => {
    const isPlural = (count: number) => count > 1;

    render(
      <DynamicFlatList
        data={[1, 2]}
        singularMessage="%count% singular"
        pluralMessage="%count% plural"
        numColumns={2}
        isPlural={isPlural}
        renderItem={() => null}
      />,
    );

    expect(UseDynamicList.useDynamicList).toHaveBeenCalledWith({
      data: [1, 2],
      singularMessage: '%count% singular',
      pluralMessage: '%count% plural',
      numColumns: 2,
      isPlural,
    });
  });

  it('does not set the role when __DEV__ is false', () => {
    // @ts-ignore
    global.__DEV__ = false;

    const {
      DynamicFlatList: OriginalDynamicFlatList,
    } = require('./DynamicFlatList');

    const { getByTestId } = render(
      <OriginalDynamicFlatList
        data={[]}
        singularMessage="%count% singular"
        pluralMessage="%count% plural"
        renderItem={() => null}
        testID={'test-id'}
      />,
    );

    expect(getByTestId('test-id').props.role).toBeUndefined();
  });
});

jest.mock('../hooks/useDynamicList');
