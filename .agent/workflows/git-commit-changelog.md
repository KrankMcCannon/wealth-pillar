---
description: Create semantic git commit messages and update changelog
---

This workflow automates the process of creating a semantically correct commit message and updating the changelog file.

1.  **Analyze Staged Changes**:
    - Run `git diff --cached` to see what is about to be committed.
    - Determine the scope and type of the change:
        - `feat`: A new feature
        - `fix`: A bug fix
        - `docs`: Documentation only changes
        - `style`: Changes that do not affect the meaning of the code (white-space, formatting, etc)
        - `refactor`: A code change that neither fixes a bug nor adds a feature
        - `perf`: A code change that improves performance
        - `test`: Adding missing tests or correcting existing tests
        - `chore`: Changes to the build process or auxiliary tools and libraries such as documentation generation

2.  **Generate Commit Message**:
    - Construct a message in the format: `type(scope): subject`.
    - *Example*: `feat(auth): add google oauth provider`.

3.  **Update CHANGELOG.md**:
    - Read `CHANGELOG.md`.
    - Find the `## Unreleased` section (or create it if it doesn't exist).
    - Append a line describing the change under the appropriate subsection (Features, Bug Fixes, etc.).
    - Format: `- **type**: description of change (commit hash or shorthand)` (hash is optional at this stage/can be added later).

4.  **Safe to Auto-Run**:
    - Generally, proposing the commit message is safe.
    - *Note*: This workflow usually stops at proposing the command/file change for user validation.
