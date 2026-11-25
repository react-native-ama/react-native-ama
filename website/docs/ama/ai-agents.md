---
displayed_sidebar: docs
---

# AI Coding Agents

Every AMA package ships an **agent skill**: a `SKILL.md` file that teaches AI coding agents how to use that package's v2 API and how to write code that passes AMA's accessibility checks.

Skills follow the open [Agent Skills](https://agentskills.io) format, supported by Claude Code, OpenAI Codex, Cursor, GitHub Copilot, Gemini CLI, Cline, OpenCode and other agents.

| Package                          | Skill                           | Covers                                                                                    |
| -------------------------------- | ------------------------------- | ----------------------------------------------------------------------------------------- |
| `@react-native-ama/core`         | `react-native-ama-core`         | Setup, the runtime checks and how to fix each rule, `ama.config.json`, core hooks         |
| `@react-native-ama/forms`        | `react-native-ama-forms`        | `Form`, `TextInput` (`renderLabel` / `renderError`), `Form.Field`, focus order, errors    |
| `@react-native-ama/lists`        | `react-native-ama-lists`        | `DynamicFlatList`, `useDynamicList`, result count announcements                           |
| `@react-native-ama/animations`   | `react-native-ama-animations`   | Reduce Motion aware animations with `Animated` and Reanimated                             |
| `@react-native-ama/bottom-sheet` | `react-native-ama-bottom-sheet` | `BottomSheet`: closing, focus, auto-close                                                 |

Each skill covers only its own package, and works whether or not `@react-native-ama/core` is installed. Install the skills for the packages your app uses.

## Installing the skills

### With the `skills` CLI

```sh
npx skills add react-native-ama/react-native-ama
```

The CLI detects the agents you use and puts the skills in the folder each one reads. To install only some of them:

```sh
npx skills add react-native-ama/react-native-ama --skill react-native-ama-core --skill react-native-ama-forms
```

This installs the skills from the repository's main branch, which describe the latest release.

### From `node_modules`

The skills are also included in each npm package, in `node_modules/@react-native-ama/<package>/skills/`, so they always match the version you have installed. Agents don't read `node_modules` on their own, so link the skills into your agent's skills folder:

```sh
mkdir -p .claude/skills
ln -s ../../node_modules/@react-native-ama/core/skills/react-native-ama-core .claude/skills/
ln -s ../../node_modules/@react-native-ama/forms/skills/react-native-ama-forms .claude/skills/
```

| Agent                                               | Project skills folder |
| --------------------------------------------------- | --------------------- |
| Claude Code                                         | `.claude/skills/`     |
| Codex, Cursor, GitHub Copilot, Gemini CLI, OpenCode | `.agents/skills/`     |
| Windsurf                                            | `.windsurf/skills/`   |

Check your agent's documentation if it isn't listed.

## Using the skills

You don't need to call them. The agent always sees each skill's name and description, and reads the full skill when your request matches it, for example "add a sign-up form" in a project that has `@react-native-ama/forms` installed. The descriptions are written to match these requests even when they don't mention accessibility.

When an agent misses one, ask for it by name. In Claude Code you can also run it as a command, for example `/react-native-ama-forms`.

## What the skills don't do

The skills help the agent write accessible code on the first try, but they don't check it. AMA's checks only run against the rendered app, so open the screen in a [development build](./getting-started.md) and look at AMA's overlay or console before considering it done. For anything non-trivial, also try it with VoiceOver or TalkBack.
