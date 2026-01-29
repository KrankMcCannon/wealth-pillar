---
description: Create semantic git commit messages and update changelog
---

This workflow automates the process of creating a semantically correct commit message and updating the changelog file.

1.  **Analyze Staged Changes**:
    // turbo
    - Run `git diff --cached` to see what is about to be committed.
    - Determine the scope and type of the change (feat, fix, docs, style, refactor, perf, test, chore).

2.  **Generate Commit Message**:
    - Construct a message in the format: `type(scope): subject`.
    - *Example*: `feat(auth): add google oauth provider`.

3.  **Update CHANGELOG.md**:
    - Read `CHANGELOG.md`.
    - Find the `## Unreleased` section (or create it if it doesn't exist).
    - Append a line describing the change.
    - **Format** with date if moving to a release, otherwise keep in Unreleased:
      `- **type**: description of change`

4.  **Safe to Auto-Run**:
    - Generally, proposing the commit message is safe.
    - *Note*: This workflow usually stops at proposing the command/file change for user validation.

