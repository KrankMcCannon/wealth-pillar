---
description: Generate comprehensive End-to-End (E2E) tests using Playwright, analyzing full data flows from UI to Backend.
---

This workflow creates E2E scenarios that verify the entire application stack. It emphasizes understanding the _backend logic_ triggered by the UI to write accurate tests for both success and failure states.

### 1. Analysis: Trace the Logic Flow

Before writing a single line of test code, you must understand what happens when the user interacts.

- **Start at the Component**: Identify the button/form triggering the action.
- **Trace the Handler**:
  - Identify the function called (e.g., `onSubmit`, `handleSave`).
  - **Follow the imports**: If it calls a Server Action (e.g., `updateProfile`), use `view_file` to read that action's code.
  - **Deep Scan**: Inside the Server Action, see what services/DB functions are called.
    - _Example_: Does it check if the user exists? Does it validate inputs with Zod?
- **Define Scenarios**:
  - **Happy Path**: Inputs valid -> Service succeeds -> UI shows success toast/redirect.
  - **Failing Scenarios**:
    - Input invalid (Client-side validation).
    - Backend rejection (e.g., "Duplicate Name" returned by the Server Action).
    - Network failures (mocks).

### 2. Prepare the Test File

Create a new file in `e2e/` (or `tests/e2e/`) named `[feature].spec.ts`.

**Structure**:

```ts
import { test, expect } from "@playwright/test";

test.describe("Feature Name", () => {
  // Setup: Login or navigate before each test
  test.beforeEach(async ({ page }) => {
    // ... authentication logic ...
    await page.goto("/target-url");
  });

  // ... tests ...
});
```

### 3. Implement Test Scenarios

#### A. Happy Path

Write a test that mimics a perfect user interaction.

- Use `page.getByRole(...)` selectors (accessible/robust).
- Fill forms with valid data matching the _types_ you saw in the code analysis.
- **Assert**:
  - UI Changes: New URL, Success Toast, Item appears in list.
  - Network: Verify the action returned status 200 (if inspecting network).

#### B. Failing Scenarios (Crucial)

Based on your **Deep Scan** of the backend logic:

- **Validation Error**: Enter invalid data that triggers the Zod schema rejection you saw in the code. Assert the specific error message is displayed.
- **Logic Error**: Try to create a resource that already exists (duplicate) if the backend attempts to enforce uniqueness. Assert the "Already exists" toaster/alert appeared.

### 4. Verification

// turbo

- Run the specific test file: `npx playwright test e2e/[feature].spec.ts`.
- **Debug**:
  - If it fails, use the error output or screenshots to diagnose.
  - Check if the selectors are correct (use `codegen` if stuck).
  - Ensure the test environment has the necessary seed data (or mock it).
