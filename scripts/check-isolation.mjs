#!/usr/bin/env node
/**
 * Checks that every AMA package works when it's installed on its own,
 * without @react-native-ama/core.
 *
 * For each package it:
 *   1. packs it with `npm pack` (what users get from npm)
 *   2. installs the tarball in a fresh app, with only the package's
 *      required peer dependencies (no core)
 *   3. checks that core really isn't resolvable
 *   4. checks that no published type declaration references core, and
 *      type-checks an entry file that imports the package
 *   5. bundles the entry file with Metro, using React Native's default config
 *
 * Usage:
 *   node scripts/check-isolation.mjs                  # all packages, from this repo
 *   node scripts/check-isolation.mjs forms lists      # only some packages
 *   node scripts/check-isolation.mjs --from-npm 2.0.0 # the published packages instead
 *   KEEP_TMP=1 node scripts/check-isolation.mjs       # keep the temp apps for debugging
 *
 * Run `yarn build` first when testing the repo packages.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REACT = '19.0.0';
const REACT_NATIVE = '0.79.1';
const RN_TOOLING = '0.79.1';

const PACKAGES = {
  animations: {
    peers: { 'react-native-reanimated': '~3.17.4' },
  },
  'bottom-sheet': {
    peers: {
      'react-native-reanimated': '~3.17.4',
      'react-native-gesture-handler': '~2.24.0',
    },
  },
  forms: { peers: {} },
  lists: { peers: {} },
};

const args = process.argv.slice(2);
const fromNpmIndex = args.indexOf('--from-npm');
const fromNpm = fromNpmIndex >= 0 ? args[fromNpmIndex + 1] : null;
const selected = args.filter(
  (arg, index) => !arg.startsWith('--') && index !== fromNpmIndex + 1,
);
const names = selected.length ? selected : Object.keys(PACKAGES);

for (const name of names) {
  if (!PACKAGES[name]) {
    console.error(`Unknown package "${name}". Known: ${Object.keys(PACKAGES).join(', ')}`);
    process.exit(2);
  }
}

const run = (command, commandArgs, cwd) =>
  execFileSync(command, commandArgs, {
    cwd,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env, NODE_PATH: '' },
  });

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ama-isolation-'));
const tarballDir = path.join(tmpRoot, 'tarballs');
fs.mkdirSync(tarballDir);

const pack = name => {
  const spec = fromNpm
    ? `@react-native-ama/${name}@${fromNpm}`
    : path.join(ROOT, 'packages', name);

  if (!fromNpm && !fs.existsSync(path.join(spec, 'dist'))) {
    throw new Error(`packages/${name}/dist is missing: run \`yarn build\` first`);
  }

  const output = run('npm', ['pack', spec, '--pack-destination', tarballDir, '--json'], ROOT);
  const [{ filename }] = JSON.parse(output);

  return path.join(tarballDir, path.basename(filename));
};

const writeApp = (appDir, name, tarball) => {
  const { peers } = PACKAGES[name];

  fs.mkdirSync(appDir, { recursive: true });
  fs.writeFileSync(
    path.join(appDir, 'package.json'),
    JSON.stringify(
      {
        name: `ama-isolation-${name}`,
        private: true,
        dependencies: {
          [`@react-native-ama/${name}`]: `file:${tarball}`,
          react: REACT,
          'react-native': REACT_NATIVE,
          ...peers,
        },
        devDependencies: {
          '@react-native/babel-preset': RN_TOOLING,
          '@react-native/metro-config': RN_TOOLING,
          '@types/react': '~19.0.0',
          metro: '^0.82.0',
          typescript: '~5.8.3',
        },
      },
      null,
      2,
    ),
  );

  fs.writeFileSync(
    path.join(appDir, 'index.tsx'),
    [
      `import * as Package from '@react-native-ama/${name}';`,
      '',
      'export const exportedNames = Object.keys(Package);',
      '',
    ].join('\n'),
  );

  fs.writeFileSync(
    path.join(appDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          strict: true,
          noEmit: true,
          jsx: 'react-jsx',
          module: 'esnext',
          moduleResolution: 'bundler',
          customConditions: ['react-native'],
          target: 'esnext',
          lib: ['esnext'],
          types: ['react-native'],
          // Third-party typings (e.g. Reanimated) need DOM and test types we
          // don't install; core references are checked separately below.
          skipLibCheck: true,
        },
        include: ['index.tsx'],
      },
      null,
      2,
    ),
  );

  const usesReanimated = 'react-native-reanimated' in peers;

  fs.writeFileSync(
    path.join(appDir, 'babel.config.js'),
    `module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: ${usesReanimated ? "['react-native-reanimated/plugin']" : '[]'},
};
`,
  );

  fs.writeFileSync(
    path.join(appDir, 'metro.config.js'),
    `const { getDefaultConfig } = require('@react-native/metro-config');

module.exports = getDefaultConfig(__dirname);
`,
  );
};

const checks = [
  {
    label: 'core is not installed',
    run: appDir => {
      const resolved = (() => {
        try {
          return run(
            'node',
            ['-e', "console.log(require.resolve('@react-native-ama/core'))"],
            appDir,
          ).trim();
        } catch {
          return null;
        }
      })();

      if (resolved) {
        throw new Error(`@react-native-ama/core was installed at ${resolved}`);
      }
    },
  },
  {
    label: 'no type declaration references core',
    run: (appDir, name) => {
      const packageDir = path.join(appDir, 'node_modules/@react-native-ama', name);
      const offenders = [];
      const walk = dir => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          const full = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            if (entry.name !== 'node_modules') walk(full);
          } else if (entry.name.endsWith('.d.ts')) {
            const content = fs.readFileSync(full, 'utf8');
            if (/['"]@react-native-ama\/core(\/[^'"]*)?['"]/.test(content)) {
              offenders.push(path.relative(packageDir, full));
            }
          }
        }
      };
      walk(packageDir);

      if (offenders.length) {
        throw new Error(`These declarations import core: ${offenders.join(', ')}`);
      }
    },
  },
  {
    label: 'type-checks',
    run: appDir => {
      run(path.join(appDir, 'node_modules/.bin/tsc'), ['-p', 'tsconfig.json'], appDir);
    },
  },
  {
    label: 'bundles with Metro',
    run: appDir => {
      run(
        path.join(appDir, 'node_modules/.bin/metro'),
        [
          'build',
          'index.tsx',
          '--out',
          'bundle.js',
          '--platform',
          'ios',
          '--dev',
          'false',
          '--minify',
          'false',
        ],
        appDir,
      );
    },
  },
];

const results = [];

for (const name of names) {
  console.log(`\n@react-native-ama/${name}${fromNpm ? `@${fromNpm}` : ''}`);
  const appDir = path.join(tmpRoot, name);

  try {
    const tarball = pack(name);
    writeApp(appDir, name, tarball);
    run('npm', ['install', '--legacy-peer-deps', '--no-audit', '--no-fund'], appDir);
  } catch (error) {
    console.log(`  ✗ setup failed\n${indent(error)}`);
    results.push({ name, check: 'setup', ok: false });
    continue;
  }

  for (const check of checks) {
    try {
      check.run(appDir, name);
      console.log(`  ✓ ${check.label}`);
      results.push({ name, check: check.label, ok: true });
    } catch (error) {
      console.log(`  ✗ ${check.label}\n${indent(error)}`);
      results.push({ name, check: check.label, ok: false });
    }
  }
}

function indent(error) {
  const text = [error.stdout, error.stderr, error.message]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .filter(line => line.trim() && !/[▒▓░]|Welcome to Metro|Fast - Scalable/.test(line))
    .slice(-20)
    .map(line => `      ${line}`)
    .join('\n');

  return text;
}

if (process.env.KEEP_TMP) {
  console.log(`\nTemp apps kept in ${tmpRoot}`);
} else {
  fs.rmSync(tmpRoot, { recursive: true, force: true });
}

const failed = results.filter(result => !result.ok);

console.log(
  `\n${results.length - failed.length}/${results.length} checks passed` +
    (failed.length ? `; failed: ${failed.map(f => `${f.name} (${f.check})`).join(', ')}` : ''),
);

process.exit(failed.length ? 1 : 0);
