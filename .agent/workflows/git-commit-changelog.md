---
description: Create semantic git commit messages and update changelog following industry standards.
---

This workflow ensures strict adherence to **Conventional Commits** and **Keep a Changelog** standards. It transforms raw code changes into a professional project history.

### 1. Analysis Status

// turbo
First, understand the context of the changes.

- Run `git status` to see staged vs unstaged files.
- Run `git diff --cached` to analyze the _staged_ content (the content to be committed).
  - _If nothing is staged_: Ask the user if they want to stage all changes (`git add .`) or specific files.

### 2. Determine Commit Strategy

Based on the diff, categorize the change:

#### Commit Types

- **feat**: A new feature for the user.
- **fix**: A bug fix for the user.
- **docs**: Documentation only changes.
- **style**: Formatting, semi-colons, white-space (no code change).
- **refactor**: Refactoring production code (no new features, no bug fix).
- **perf**: Performance improvements.
- **test**: Adding or refactoring tests.
- **build/chore**: Build process, deps, auxiliary tools (e.g., config updates).

#### Structure

Format: `<type>(<scope>): <short summary>`

- **Scope**: The module or component affected (e.g., `auth`, `ui`, `api`).
- **Summary**: Imperative, lowercase, no period at end (e.g., "add google oauth provider" not "Added Google OAuth provider.").

### 3. Update CHANGELOG.md (If Applicable)

If the change is a `feat` or `fix` (or significant `perf`/`refactor`), update `CHANGELOG.md`.

**Rules**:

- Read `CHANGELOG.md`.
- Locate the `## [Unreleased]` section. If it doesn't exist, create it at the top.
- Add a line under the appropriate sub-header:
  - `### Added` for `feat`.
  - `### Fixed` for `fix`.
  - `### Changed` for modification of existing behavior.
- Entry format: `- description of the change (link to issue if known).`

_Note: If this is a specific Release commit, you would instead rename [Unreleased] to the new version number._

### 4. Execute Commit

Propose the git command.

- **Command**: `git commit -m "type(scope): subject"`
- _Optional Body_: If the change is complex, add a body with `-m`: `git commit -m "title" -m "detailed explanation"`

### 5. Verification

// turbo

- Run `git log -1` to verify the hash and message.
- Output the result to the user.
