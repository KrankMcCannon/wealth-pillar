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
    - Read `CHANGELOG.md` to find the latest version.
    - **Bump Version**: Determine the next version number based on the change type:
      - `fix`, `chore`, `style`, `refactor`, `perf`, `test` -> **Patch** bump (e.g., 0.5.0 -> 0.5.1)
      - `feat` -> **Minor** bump (e.g., 0.5.0 -> 0.6.0)
      - `BREAKING CHANGE` -> **Major** bump.
    - Prepend a new version header with today's date: `## [X.Y.Z] - YYYY-MM-DD`.
    - Append the line describing the change under the appropriate subsection.
    - **Format**: `- **type**: description of change`

4.  **Safe to Auto-Run**:
    - Generally, proposing the commit message is safe.
    - *Note*: This workflow usually stops at proposing the command/file change for user validation.

