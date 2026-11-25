#!/usr/bin/env node
/**
 * Checks the agent skills shipped with each AMA package.
 *
 * For every package it checks that:
 *   - packages/<name>/skills/react-native-ama-<name>/SKILL.md exists, with a
 *     frontmatter `name` matching its folder and a usable `description`
 *   - the root skills/ folder links to it (that's where `npx skills add` looks)
 *   - `npm pack` includes it
 *   - every reference file the skill mentions exists
 *   - every tsx code block type-checks against the package's current source,
 *     so an API change that isn't reflected in the skill fails CI
 *
 * Code blocks are often snippets that use variables defined elsewhere
 * ("Cannot find name 'isOpen'"). Those diagnostics are ignored; everything
 * else, such as a missing export, a wrong prop or a missing required prop, fails.
 *
 * Usage: node scripts/check-skills.mjs
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(path.join(ROOT, 'package.json'));
const ts = require('typescript');

const PACKAGES = ['core', 'forms', 'lists', 'animations', 'bottom-sheet'];

// "Cannot find name" — the snippet uses a variable it doesn't declare.
const IGNORED_DIAGNOSTICS = new Set([2304, 2552, 2582]);

const failures = [];
const fail = (where, message) => failures.push(`${where}: ${message}`);

const parseFrontmatter = (content) => {
  const match = content.match(/^---\n([\s\S]*?)\n---\n/);

  if (!match) {
    return null;
  }

  const fields = {};

  for (const line of match[1].split('\n')) {
    const field = line.match(/^([a-z_-]+):\s?(.*)$/i);

    if (field) {
      fields[field[1]] = field[2];
    } else if (line.trim()) {
      fields.__invalid = line;
    }
  }

  return fields;
};

const codeBlocks = (content) =>
  [...content.matchAll(/```(tsx|ts|jsx)\n([\s\S]*?)```/g)].map((m) => m[2]);

const tmpDir = path.join(ROOT, '.skill-check-tmp');
fs.rmSync(tmpDir, { recursive: true, force: true });
fs.mkdirSync(tmpDir);

const exampleFiles = [];

for (const name of PACKAGES) {
  const skillName = `react-native-ama-${name}`;
  const skillDir = path.join(ROOT, 'packages', name, 'skills', skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const where = `packages/${name}`;

  if (!fs.existsSync(skillFile)) {
    fail(where, `missing skills/${skillName}/SKILL.md`);
    continue;
  }

  const content = fs.readFileSync(skillFile, 'utf8');
  const frontmatter = parseFrontmatter(content);

  if (!frontmatter) {
    fail(where, 'SKILL.md has no frontmatter');
  } else {
    if (frontmatter.__invalid) {
      fail(where, `frontmatter line is not "key: value": ${frontmatter.__invalid}`);
    }
    if (frontmatter.name !== skillName) {
      fail(where, `frontmatter name is "${frontmatter.name}", expected "${skillName}"`);
    }
    const description = frontmatter.description ?? '';
    if (description.length < 50 || description.length > 1024) {
      fail(where, `description must be 50–1024 characters (is ${description.length})`);
    }
    if (/[<>]/.test(description)) {
      fail(where, 'description must not contain < or >');
    }
    if (/:\s/.test(description) || /^["'[{]/.test(description)) {
      fail(where, 'description must be a plain YAML string (no ": ", no leading quote or bracket)');
    }
  }

  // Root link, used by `npx skills add react-native-ama/react-native-ama`
  const link = path.join(ROOT, 'skills', skillName);
  if (!fs.existsSync(link) || fs.realpathSync(link) !== fs.realpathSync(skillDir)) {
    fail(where, `skills/${skillName} must be a symlink to packages/${name}/skills/${skillName}`);
  }

  // Shipped in the npm package
  const [packed] = JSON.parse(
    execFileSync('npm', ['pack', '--dry-run', '--json', path.join(ROOT, 'packages', name)], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }),
  );
  const packedFiles = new Set(packed.files.map((file) => file.path));

  // Referenced files exist and are shipped
  const markdownFiles = [skillFile];
  for (const ref of content.matchAll(/`(references\/[^`]+\.md)`/g)) {
    const refFile = path.join(skillDir, ref[1]);
    if (!fs.existsSync(refFile)) {
      fail(where, `SKILL.md mentions ${ref[1]}, which doesn't exist`);
    } else {
      markdownFiles.push(refFile);
    }
  }

  for (const file of markdownFiles) {
    const relative = path.relative(path.join(ROOT, 'packages', name), file);
    if (!packedFiles.has(relative)) {
      fail(where, `${relative} is not included by npm pack (check "files" in package.json)`);
    }

    codeBlocks(fs.readFileSync(file, 'utf8')).forEach((block, index) => {
      const hasImports = /^\s*import\s/m.test(block);
      const prelude = hasImports
        ? ''
        : [
            "import * as React from 'react';",
            "import { Pressable, Switch, Text, View } from 'react-native';",
            `import * as AMA from '@react-native-ama/${name}';`,
            `const { ${name === 'forms' ? 'Form, TextInput' : ''} } = AMA as any;`,
            '',
          ].join('\n');

      const exampleFile = path.join(
        tmpDir,
        `${name}--${path.basename(file, '.md')}--${index + 1}.tsx`,
      );
      fs.writeFileSync(exampleFile, `${prelude}${block}\nexport {};\n`);
      exampleFiles.push({ exampleFile, source: path.relative(ROOT, file), index: index + 1, prelude });
    });
  }
}

// Type-check every example against the packages' source
const paths = Object.fromEntries(
  PACKAGES.map((name) => [`@react-native-ama/${name}`, [`packages/${name}/src/index`]]),
);

const program = ts.createProgram(
  exampleFiles.map((e) => e.exampleFile),
  {
    baseUrl: ROOT,
    paths,
    jsx: ts.JsxEmit.ReactJSX,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ESNext,
    lib: ['lib.esnext.d.ts', 'lib.dom.d.ts'],
    types: [],
    strict: true,
    noImplicitAny: false,
    skipLibCheck: true,
    noEmit: true,
    esModuleInterop: true,
    allowSyntheticDefaultImports: true,
  },
);

for (const example of exampleFiles) {
  const sourceFile = program.getSourceFile(example.exampleFile);
  const diagnostics = [
    ...program.getSyntacticDiagnostics(sourceFile),
    ...program.getSemanticDiagnostics(sourceFile),
  ].filter((d) => {
    if (IGNORED_DIAGNOSTICS.has(d.code)) {
      return false;
    }
    // A third-party module the example imports but this repo doesn't install
    // (e.g. react-native-safe-area-context) is fine.
    if (d.code === 2307) {
      const text = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      return /'(@react-native-ama\/[^']+|react|react-native)'/.test(text);
    }
    return true;
  });

  const preludeLines = example.prelude ? example.prelude.split('\n').length - 1 : 0;

  for (const diagnostic of diagnostics) {
    const { line } = sourceFile.getLineAndCharacterOfPosition(diagnostic.start ?? 0);
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    fail(
      `${example.source} (code block ${example.index}, line ${line + 1 - preludeLines})`,
      `TS${diagnostic.code}: ${message.split('\n')[0]}`,
    );
  }
}

fs.rmSync(tmpDir, { recursive: true, force: true });

console.log(
  `Checked ${PACKAGES.length} skills and ${exampleFiles.length} code examples.`,
);

if (failures.length) {
  console.log(`\n${failures.length} problem(s):`);
  for (const failure of failures) {
    console.log(`  ✗ ${failure}`);
  }
  process.exit(1);
}

console.log('✓ All skill checks passed');
