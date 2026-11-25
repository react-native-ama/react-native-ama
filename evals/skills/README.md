# Skill evals

Checks whether the AMA agent skills make a coding agent write more accessible React Native code. It compares the same app with and without the skills, using this repo's packages packed with `npm pack`, so nothing needs to be published.

Everything runs on your Mac: the agent runs with `claude -p`, and the AMA errors come from the app running in the iOS simulator.

## What you need

- Node, Yarn, Xcode with an iOS simulator
- [Claude Code](https://docs.claude.com/en/docs/claude-code) logged in (`claude`)
- About 3 GB of disk space

## 1. Create the two apps

```sh
bash evals/skills/setup.sh            # creates ~/ama-skill-eval
```

This builds and packs the AMA packages, creates an Expo app with all of them installed, wraps it in `AMAProvider` (in `index.ts`, so the checks run whatever the agent writes) and makes two copies:

- `without-skills/`
- `with-skills/`: the same, plus the skills linked into `.claude/skills`

The skills are symlinks to this repo, so after you edit a skill the next run uses the new version.

## 2. Run the prompts

```sh
bash evals/skills/run.sh              # 3 runs × 3 prompts × 2 variants = 18 runs
bash evals/skills/run.sh ~/ama-skill-eval 1                 # one run each, to try it out
PROMPTS="sign-up-form" bash evals/skills/run.sh             # only one prompt
```

The prompts are in `prompts/`. They don't mention AMA or accessibility, because the skill descriptions say they should trigger anyway, and a real user often won't ask.

Each run starts from the base app and is committed on its own branch, `run/<prompt>-<n>`, in that variant's folder. The run's transcript is saved in `results/`, and a row is added to `results/results.csv` with the skills the agent loaded (filled in automatically).

Runs use `--setting-sources project,local`, so skills and plugins from your own `~/.claude` stay out of both variants. Check that `without-skills` rows say `none` in `skills_loaded`; if they don't, something is leaking in.

## 3. Check each run in the simulator

For every row of `results.csv`:

```sh
cd ~/ama-skill-eval/with-skills       # or without-skills
git checkout run/sign-up-form-1
npx expo run:ios                      # a dev build: AMA's native checks don't run in Expo Go
```

The first build takes a while; after that, switching branches only reloads the JavaScript.

Then fill in the row:

| Column | What to write |
| --- | --- |
| `ama_errors` | Number of AMA errors (the red overlay / error summary). With `"log": "always"` they're also printed in the Metro console. |
| `ama_warnings` | Number of AMA warnings in the console. |
| `cheats` | Number of fixes that make a check pass while making the app worse: `accessible={false}` on a real control, generic labels ("Button", "Image"), a deleted element, or an edited `ama.config.json`. Read the diff with `git show`. |
| `notes` | Anything else. No commas, because the file is a plain CSV. |

Some checks only run when you interact, so do the same on every run:

- **Form:** submit the empty form, then fill it in using the keyboard's "next" button.
- **Product list:** type in the search field and tap a heart.
- **Filter sheet:** open the sheet, toggle a switch, close it by tapping outside.

For a fairer comparison, check the runs without looking at the folder name first: open the branches in a random order.

## 4. Summarise

```sh
node evals/skills/summarize.mjs
```

It prints the average errors and warnings per prompt and variant, the number of runs that cheated, and how often a skill was loaded.

## When the skills pass

- For every prompt, `with-skills` has fewer AMA errors on average than `without-skills`.
- No `with-skills` run cheats.
- In `with-skills`, the right skill was loaded in every run: forms for the form, lists for the product list, bottom-sheet for the filter sheet, and core in all of them.

If a skill doesn't load, the problem is its `description`. If it loads but the errors don't go down, read the transcript in `results/` to see which instruction the agent ignored or misread.
