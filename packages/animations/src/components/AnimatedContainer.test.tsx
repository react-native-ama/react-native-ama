import { AutofocusContainer } from '@react-native-ama/core';
import { render } from '@testing-library/react-native';
import * as React from 'react';
import * as UseReanimatedAnimationBuilder from '../hooks/useReanimatedAnimationBuilder';
import { AnimatedContainer } from './AnimatedContainer';

beforeEach(() => {
  jest.clearAllMocks();

  jest.spyOn(console, 'warn').mockImplementation();
});

const from = { left: 0 };
const to = { opacity: 1 };

describe('AnimatedContainer', () => {
  it('passes the given animation data to the hook', () => {
    const useReanimatedAnimationBuilder = jest
      .spyOn(UseReanimatedAnimationBuilder, 'useReanimatedAnimationBuilder')
      .mockReturnValue({ exiting: 'exiting', entering: 'entering' } as any);

    const { getByTestId } = render(
      <AnimatedContainer testID="test-id" from={from} to={to} />,
    );

    expect(useReanimatedAnimationBuilder).toHaveBeenCalledWith({
      from,
      to,
      exitFrom: undefined,
      exitTo: undefined,
      duration: 300,
    });

    expect(getByTestId('test-id').props).toEqual({
      children: undefined,
      entering: 'entering',
      exiting: 'exiting',
      ref: null,
      style: undefined,
      testID: 'test-id',
    });
  });

  it('passes the given animation data to the hook 2', () => {
    const useReanimatedAnimationBuilder = jest
      .spyOn(UseReanimatedAnimationBuilder, 'useReanimatedAnimationBuilder')
      .mockReturnValue({ exiting: 'exiting', entering: 'entering' } as any);

    const { getByTestId } = render(
      <AnimatedContainer testID="test-id" from={from} to={to} duration={600} />,
    );

    expect(useReanimatedAnimationBuilder).toHaveBeenCalledWith({
      from,
      to,
      exitFrom: undefined,
      exitTo: undefined,
      duration: 600,
    });

    expect(getByTestId('test-id').props).toEqual({
      children: undefined,
      entering: 'entering',
      exiting: 'exiting',
      ref: null,
      style: undefined,
      testID: 'test-id',
    });
  });

  it('wraps the content with the AutofocusContainer when the autofocus property is true', () => {
    const { UNSAFE_getAllByType } = render(
      <AnimatedContainer
        testID="test-id"
        from={from}
        to={to}
        duration={300}
        autofocus
      />,
    );

    expect(UNSAFE_getAllByType(AutofocusContainer)).toBeDefined();
  });

  describe('without @react-native-ama/core', () => {
    const renderWithoutCore = (autofocus: boolean) => {
      jest.resetModules();
      jest.doMock('../internals/optionalCore', () => ({ optionalCore: null }));
      jest.doMock('../hooks/useReanimatedAnimationBuilder', () => ({
        useReanimatedAnimationBuilder: () => ({}),
      }));

      const { AnimatedContainer: Container } = require('./AnimatedContainer');
      const { render: isolatedRender } = require('@testing-library/react-native/pure');
      const ReactIsolated = require('react');

      return isolatedRender(
        ReactIsolated.createElement(Container, {
          testID: 'test-id',
          from,
          to,
          autofocus,
        }),
      );
    };

    afterEach(() => {
      jest.dontMock('../internals/optionalCore');
      jest.dontMock('../hooks/useReanimatedAnimationBuilder');
    });

    it('renders the content and warns once when autofocus is requested', () => {
      const first = renderWithoutCore(true);

      expect(first.getByTestId('test-id')).toBeTruthy();
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect((console.warn as jest.Mock).mock.calls[0][0]).toContain(
        '@react-native-ama/core',
      );

    });

    it('does not warn when autofocus is not requested', () => {
      const { getByTestId } = renderWithoutCore(false);

      expect(getByTestId('test-id')).toBeTruthy();
      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});

jest.mock('../hooks/useReanimatedAnimationBuilder');

jest.mock('react-native-reanimated', () => {
  const { View } = require('react-native');

  return {
    View: (props: any) => <View {...props} />,
  };
});
