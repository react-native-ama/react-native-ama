/**
 * `@react-native-ama/core` is an optional peer dependency.
 *
 * The require is wrapped in try/catch so that bundlers which support optional
 * dependencies (Metro with `allowOptionalDependencies`, the default in Expo and
 * React Native's Metro config) don't fail when core isn't installed.
 */
let core: any = null;

try {
  core = require('@react-native-ama/core');
} catch {
  core = null;
}

export const optionalCore = core;
