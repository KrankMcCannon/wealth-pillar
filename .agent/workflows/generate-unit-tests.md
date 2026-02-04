---
description: Generate comprehensive unit tests for a component, service, or action using Vitest/Jest and React Testing Library.
---

This workflow guides the creation of robust unit tests for Next.js 16 / React 19 codebases. It ensures high code quality by enforcing test coverage for happy paths, edge cases, and user interactions.

### 1. Environment Check & Setup

// turbo
First, ensure the testing infrastructure is present.

- **Check**: Look for `vitest.config.ts`, `jest.config.js`, or test dependencies in `package.json`.
- **If missing**:
  - **PROPOSE** installing Vitest (Recommended for speed and ESM support) and Testing Library:
    ```bash
    npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/dom jsdom @testing-library/user-event
    ```
  - **Create Config**: If creating a new config, ensure it maps `@/*` to `./src/*` (see `tsconfig.json`).

### 2. Analyze the Target

- **Read the Source**: use `view_file` on the target file.
- **Identify Type**:
  - **UI Component**: Look for JSX, Props interface, event handlers (`onClick`), and standard hooks (`useState`).
  - **Async Component (Server)**: Look for `async function Component()`. _Note: These require special handling or integration tests; unit testing often involves testing the child client components or utility logic separately._
  - **Server Action/Service**: Look for `use server`, database calls, or pure logic.
  - **Utility/Hook**: Pure functions or custom hooks.

### 3. Plan Test Cases

Draft a list of scenarios:

- **Render**: Does it render without crashing?
- **Props**: Does it respect passed props (e.g., `title`, `defaultValue`)?
- **Interaction**: Can the user click/type? (Use `userEvent`).
- **State**: Does the UI update after interaction?
- **Edge Cases**: Empty lists, loading states, error states.

### 4. Write the Test

Create a file named `[original_filename].test.tsx` (or `.test.ts`) in the same directory (or `__tests__` if preferred by project).

**Guidelines for React 19 / Next.js 16**:

- **Setup**:
  ```tsx
  import { render, screen } from '@testing-library/react';
  import { userEvent } from '@testing-library/user-event';
  import { describe, it, expect, vi } from 'vitest'; // or jest
  import { TargetComponent } from './TargetComponent';
  ```
- **Mocks**:
  - Mock complex sub-components to keep unit tests focused.
  - Mock `next/navigation` (`useRouter`, `usePathname`) if used.
  - Mock Server Actions using `vi.fn().mockResolvedValue(...)`.
- **Async Interactions**: Always use `await user.click(...)`.
- **Queries**: Prefer `getByRole`, `getByText`. Avoid `querySelector`.

### 5. Run & Verify

// turbo

- Execute the test: `npx vitest run [test_filename]` (or `npm test`).
- **Refine**: If tests fail, analyze the error.
  - If the _code_ is wrong, propose a fix.
  - If the _test_ is wrong (e.g., mismatched text), update the test.
- **Final Output**: The user should have a passing test suite for the component.
