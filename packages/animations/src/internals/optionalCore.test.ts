beforeEach(() => {
  jest.resetModules();
});

describe('optionalCore', () => {
  it('exposes core when it is installed', () => {
    const core = { useAMAContext: jest.fn() };
    jest.doMock('@react-native-ama/core', () => core);

    expect(require('./optionalCore').optionalCore).toBe(core);
  });

  it('is null when core cannot be resolved', () => {
    jest.doMock('@react-native-ama/core', () => {
      throw new Error("Cannot find module '@react-native-ama/core'");
    });

    expect(require('./optionalCore').optionalCore).toBeNull();
  });
});
