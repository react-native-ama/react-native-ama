const renderBottomSheet = () => {
  const { render } = require('@testing-library/react-native/pure');
  const React = require('react');
  const UseBottomSheetGestureHandler = require('../hooks/useBottomSheetGestureHandler');
  jest
    .spyOn(UseBottomSheetGestureHandler, 'useBottomSheetGestureHandler')
    .mockReturnValue({ onGestureEvent: jest.fn() } as any);

  const { BottomSheet } = require('./BottomSheet');

  return render(
    React.createElement(BottomSheet, {
      topInset: 0,
      visible: true,
      autoCloseDelay: 100,
      onClose: () => {},
      closeActionAccessibilityLabel: 'close me',
      testID: 'bottom-sheet',
    }),
  );
};

beforeEach(() => {
  jest.resetModules();
  jest.spyOn(global, 'setTimeout');
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('BottomSheet without @react-native-ama/core', () => {
  it('renders and falls back to setTimeout when core is not installed', () => {
    jest.doMock('@react-native-ama/core', () => {
      throw new Error("Cannot find module '@react-native-ama/core'");
    });

    const { getByTestId } = renderBottomSheet();

    expect(getByTestId('bottom-sheet')).toBeTruthy();
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
  });

  it('renders and falls back to setTimeout when the app has no AMAProvider', () => {
    jest.doMock('@react-native-ama/core', () => ({
      useTimedAction: () => {
        throw new Error('Please wrap your app with <AMAProvider />');
      },
    }));

    const { getByTestId } = renderBottomSheet();

    expect(getByTestId('bottom-sheet')).toBeTruthy();
    expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 100);
  });
});
