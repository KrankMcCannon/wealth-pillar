# Coding Conventions

**Analysis Date:** 2026-02-18

## File Naming & Organization
- **Files**: kebab-case for all files (e.g., `account-card.tsx`, `transaction.service.ts`).
- **Components**: PascalCase for React components (e.g., `AccountCard`).
- **Hooks**: prefixed with `use-` (e.g., `use-mounted.ts`).
- **Types**: typically PascalCase and often co-located or in `src/lib/types/`.

## Code Style & Formatting
- **Formatting**: Prettier is used with semi-colons, single quotes, 2-space tabs, and a 100-character print width.
- **Linting**: ESLint v9 with `eslint-config-next` and `prettier` plugin. Rules enforce type safety (no `any`), unused variables (prefixed with `_` allowed), and React Hook rules.
- **Styling**: Tailwind CSS is the primary styling framework, using a `cn` utility (`tailwind-merge` + `clsx`) for conditional classes. Components often use `class-variance-authority`.
- **Component Design**: Heavy use of `memo` for performance and `next-intl` for internationalization.

## TypeScript Practices
- Strict mode is enabled.
- Interfaces are preferred for object shapes.
- Enums are used for fixed sets of values (e.g., frequencies, account types).
- Use of Zod for schema validation (both for forms and API/service layers).
