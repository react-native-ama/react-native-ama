#!/usr/bin/env bash
# Creates two identical Expo apps that use this repo's AMA packages (packed
# with `npm pack`, so nothing is published): one with the AMA skills linked
# into .claude/skills, one without.
#
# Usage: bash evals/skills/setup.sh [work-dir]
#   work-dir defaults to ~/ama-skill-eval
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORK="${1:-$HOME/ama-skill-eval}"
PACKAGES=(core forms lists animations bottom-sheet)

if [ -e "$WORK" ]; then
  echo "$WORK already exists. Remove it or pass another folder." >&2
  exit 1
fi

mkdir -p "$WORK/tarballs" "$WORK/results"

echo "→ Building the AMA packages"
(cd "$REPO" && yarn build >/dev/null)

echo "→ Packing them (this is what npm would publish)"
for pkg in "${PACKAGES[@]}"; do
  npm pack "$REPO/packages/$pkg" --pack-destination "$WORK/tarballs" --silent >/dev/null
done

echo "→ Creating the base Expo app"
(cd "$WORK" && npx --yes create-expo-app@latest base --template blank-typescript >/dev/null)

cd "$WORK/base"

echo "→ Installing AMA and its peer dependencies"
npm install "$WORK"/tarballs/*.tgz --no-audit --no-fund >/dev/null
npx expo install react-native-reanimated react-native-gesture-handler react-native-safe-area-context >/dev/null

# AMA's runtime checks must run in both variants, whatever the agent writes,
# so the provider wraps the app in the entry file, outside App.tsx.
cat > index.ts <<'EOF'
import { AMAProvider } from '@react-native-ama/core';
import { registerRootComponent } from 'expo';
import * as React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import App from './App';

const Root = () =>
  React.createElement(
    GestureHandlerRootView,
    { style: { flex: 1 } },
    React.createElement(AMAProvider, null, React.createElement(App)),
  );

registerRootComponent(Root);
EOF

# Print every AMA issue to the Metro console, not only in the inspector
node -e "
const fs = require('fs');
const file = 'ama.config.json';
const config = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : {};
config.log = 'always';
fs.writeFileSync(file, JSON.stringify(config, null, 2) + '\n');
"

git init -q
git add -A
git commit -q -m "Base app"
git branch -M main

echo "→ Creating the two variants"
cd "$WORK"
if [ "$(uname)" = "Darwin" ]; then
  cp -Rc base without-skills # APFS clone: fast, no extra disk space
  cp -Rc base with-skills
else
  cp -R base without-skills
  cp -R base with-skills
fi

mkdir -p with-skills/.claude/skills
for pkg in "${PACKAGES[@]}"; do
  # Linked, not copied: edit a skill in the repo and the next run uses it
  ln -s "$REPO/packages/$pkg/skills/react-native-ama-$pkg" "with-skills/.claude/skills/react-native-ama-$pkg"
done
(cd with-skills && git add -A && git commit -q -m "Link the AMA skills")

echo "prompt,variant,run,branch,skills_loaded,ama_errors,ama_warnings,cheats,notes" > "$WORK/results/results.csv"

cat <<EOF

Done: $WORK
  without-skills/  the app with no skills
  with-skills/     the same app with the AMA skills in .claude/skills

Next: bash evals/skills/run.sh $WORK
EOF
