const loadHook = () => {
  const { AccessibilityInfo } = require('react-native');
  const { act, renderHook } = require('@testing-library/react-native/pure');
  const { useAMAContextSafe } =
    require('./useAMAContextSafe') as typeof import('./useAMAContextSafe');

  return { AccessibilityInfo, act, renderHook, useAMAContextSafe };
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.resetModules();
});

describe('useAMAContextSafe', () => {
  it('returns isReduceMotionEnabled from core when core is present', () => {
    jest.doMock('@react-native-ama/core', () => ({
      useAMAContext: () => ({ isReduceMotionEnabled: true }),
    }));

    const { AccessibilityInfo, renderHook, useAMAContextSafe } = loadHook();
    const { result } = renderHook(() => useAMAContextSafe());

    expect(result.current.isReduceMotionEnabled).toBe(true);
    expect(AccessibilityInfo.addEventListener).not.toHaveBeenCalled();
  });

  it.each([
    ['core is absent', () => null],
    [
      'useAMAContext throws (no AMAProvider)',
      () => ({
        useAMAContext: () => {
          throw new Error('Please wrap your app with <AMAProvider />');
        },
      }),
    ],
  ])('reads the system setting when %s', async (_, factory) => {
    jest.doMock('@react-native-ama/core', factory);

    const { AccessibilityInfo, act, renderHook, useAMAContextSafe } = loadHook();
    AccessibilityInfo.isReduceMotionEnabled.mockResolvedValueOnce(true);

    const { result } = renderHook(() => useAMAContextSafe());

    await act(async () => {});

    expect(result.current.isReduceMotionEnabled).toBe(true);
    expect(AccessibilityInfo.addEventListener).toHaveBeenCalledWith(
      'reduceMotionChanged',
      expect.any(Function),
    );
  });

  it('updates when the system setting changes and unsubscribes on unmount', async () => {
    jest.doMock('@react-native-ama/core', () => null);

    const { AccessibilityInfo, act, renderHook, useAMAContextSafe } = loadHook();
    const remove = jest.fn();
    let listener: (value: boolean) => void = () => {};
    AccessibilityInfo.addEventListener.mockImplementationOnce(
      (_: string, callback: (value: boolean) => void) => {
        listener = callback;
        return { remove };
      },
    );

    const { result, unmount } = renderHook(() => useAMAContextSafe());
    await act(async () => {});

    expect(result.current.isReduceMotionEnabled).toBe(false);

    act(() => listener(true));
    expect(result.current.isReduceMotionEnabled).toBe(true);

    unmount();
    expect(remove).toHaveBeenCalled();
  });

  it('ignores a failed read of the system setting', async () => {
    jest.doMock('@react-native-ama/core', () => null);

    const { AccessibilityInfo, act, renderHook, useAMAContextSafe } = loadHook();
    AccessibilityInfo.isReduceMotionEnabled.mockRejectedValueOnce(
      new Error('nope'),
    );

    const { result } = renderHook(() => useAMAContextSafe());
    await act(async () => {});

    expect(result.current.isReduceMotionEnabled).toBe(false);
  });

  it('does not update state after unmount', async () => {
    jest.doMock('@react-native-ama/core', () => null);

    const { AccessibilityInfo, act, renderHook, useAMAContextSafe } = loadHook();
    let resolve: (value: boolean) => void = () => {};
    AccessibilityInfo.isReduceMotionEnabled.mockReturnValueOnce(
      new Promise(r => {
        resolve = r;
      }),
    );

    const { result, unmount } = renderHook(() => useAMAContextSafe());
    unmount();

    await act(async () => resolve(true));

    expect(result.current.isReduceMotionEnabled).toBe(false);
  });
});
