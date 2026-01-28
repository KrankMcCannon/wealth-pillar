# Changelog

All notable changes to this project will be documented in this file.

## Unreleased

### Features

- **agent**: Added workflows for project structure, UX/UI, optimization, git, logic extraction, components, typescript, and tailwind consistency.
- **accounts**: Extracted logic from `AccountsContent` to `useAccountsContent` hook.

### Performance

- **accounts**: Optimized `filteredBalances` and `accountStats` calculations in `useAccountsContent`.

### Refactor

- **settings**: Extracted components, logic to `useSettings` hook, and centralized styles.

### Bug Fixes

- **settings**: Fixed group users fetching and role capitalization.
- **build**: Fixed missing "use client" directive in `settings-content.tsx`.

### Documentation

- **project**: Generated `PROJECT_STRUCTURE.md`.
