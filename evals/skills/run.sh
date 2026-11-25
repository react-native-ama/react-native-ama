#!/usr/bin/env bash
# Runs every prompt in evals/skills/prompts against both app variants with
# `claude -p`. Each run starts from the base app and is saved on its own git
# branch (run/<prompt>-<n>), so you can open it in the simulator afterwards.
#
# Usage: bash evals/skills/run.sh [work-dir] [runs-per-prompt]
#   work-dir defaults to ~/ama-skill-eval, runs-per-prompt to 3
#   Run only some prompts with PROMPTS="sign-up-form product-search"
set -euo pipefail

REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
WORK="${1:-$HOME/ama-skill-eval}"
RUNS="${2:-3}"
CSV="$WORK/results/results.csv"

if [ ! -d "$WORK/with-skills" ]; then
  echo "Run evals/skills/setup.sh first." >&2
  exit 1
fi

if [ -n "${PROMPTS:-}" ]; then
  prompt_names=($PROMPTS)
else
  prompt_names=()
  for file in "$REPO"/evals/skills/prompts/*.md; do
    prompt_names+=("$(basename "$file" .md)")
  done
fi

for prompt in "${prompt_names[@]}"; do
  prompt_text="$(cat "$REPO/evals/skills/prompts/$prompt.md")"

  for run in $(seq 1 "$RUNS"); do
    for variant in without-skills with-skills; do
      branch="run/$prompt-$run"
      log="$WORK/results/$variant--$prompt--$run.jsonl"
      cd "$WORK/$variant"

      if git rev-parse --verify --quiet "$branch" >/dev/null; then
        echo "skip  $variant $branch (already done)"
        continue
      fi

      echo "run   $variant $branch"
      git checkout -q main
      git checkout -q -b "$branch"

      # Project settings only, so skills and plugins in your ~/.claude don't
      # leak into the variant without skills.
      claude -p "$prompt_text" \
        --permission-mode acceptEdits \
        --setting-sources project,local \
        --output-format stream-json \
        --verbose \
        >"$log" 2>&1 || echo "      claude exited with an error, see $log"

      skills="$(node -e '
        const lines = require("fs").readFileSync(process.argv[1], "utf8").split("\n");
        const used = new Set();
        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (event.type === "system" && event.subtype === "init") {
              const available = (event.skills ?? []).filter(name => String(name).includes("react-native-ama"));
              if (process.argv[2] === "without-skills" && available.length) {
                console.error(`      WARNING: AMA skills leaked into without-skills: ${available.join(" ")}`);
              }
            }
            for (const part of event.message?.content ?? []) {
              if (part.type === "tool_use" && part.name === "Skill") used.add(part.input?.skill);
            }
          } catch {}
        }
        console.log([...used].join(" ") || "none");
      ' "$log" "$variant")"
      echo "      skills loaded: $skills"

      git add -A
      git commit -q -m "$prompt, run $run" --allow-empty
      git checkout -q main

      echo "$prompt,$variant,$run,$branch,$skills,,,," >>"$CSV"
    done
  done
done

cat <<EOF

All runs done. Results table: $CSV
For each row, open the branch in the simulator and fill in the AMA columns
(see evals/skills/README.md), then: node evals/skills/summarize.mjs $CSV
EOF
