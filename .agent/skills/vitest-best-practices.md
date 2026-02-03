---
name: vitest-best-practices
description: Standards for writing fast, reliable, and isolated unit tests using Vitest and React Testing Library in Next.js.
---

# Vitest Best Practices

## When to use this skill

Use this skill whenever you are:

- creating or refactoring unit tests (`*.test.tsx`, `*.test.ts`).
- Testing React Components, Custom Hooks, or Utility functions.
- Setting up the test environment for Next.js features (Server Actions, Navigation).

## Core Philosophy: "Fast Feedback, Component Contracts"

Unit tests should be lightning fast and verify the **contract** of the unit (inputs -> outputs/events), not its internal implementation.

- **Speed**: Vitest is built for speed. Keep tests lightweight.
- **Isolation**: Mock external dependencies (APIs, complex children, Contexts).
- **Behavioral**: Test _what_ it does, not _how_ it does it.

---

## 1. Component Testing (React Testing Library)

We strictly follow **Testing Library** guiding principles.

### ✅ User-Centric Queries

Query elements as a user would find them.

```tsx
import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { MyComponent } from "./MyComponent";

it("submits the form", async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  // Priority 1: Accessible Roles
  await user.type(screen.getByRole("textbox", { name: /email/i }), "test@example.com");

  // Priority 2: Label/Text
  await user.click(screen.getByRole("button", { name: /submit/i }));
});
```

### ❌ Anti-Patterns

- `container.querySelector('.my-class')`: Implementation detail.
- Testing internal state (`wrapper.state('value')`): Impossible in RTL, don't try to hack it.
- Shallow rendering: Prefer deep rendering with mocked children if necessary.

---

## 2. Interaction & Async

Interactions in modern React are asynchronous.

### ✅ Async User Events

Always use `userEvent` over `fireEvent`. `userEvent` simulates full interactions (click, focus, blur, keyup).

```tsx
const user = userEvent.setup();
await user.click(button); // Correct
```

### ✅ Asserting Async Changes

Use `waitFor` or `findBy*` queries when waiting for updates.

```tsx
// Wait for an element to appear (e.g., after API call)
expect(await screen.findByText("Success")).toBeVisible();

// Wait for an element to disappear
await waitFor(() => {
  expect(screen.queryByText("Loading")).not.toBeInTheDocument();
});
```

---

## 3. Mocking & Isolation (Next.js Context)

Next.js components often rely on `next/navigation` or Server Actions. These **must** be mocked to keep unit tests isolated.

### ✅ Mocking Navigation

```tsx
// At the top of your test file
import { vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams({}),
  usePathname: () => "/current-path",
}));
```

### ✅ Clean Mocks

Clean your mocks automatically to ensure **Idempotency** (tests not affecting each other).
In `vitest.config.ts`, ensure:

```ts
test: {
  mockReset: true, // verification that mocks are reset
  environment: 'jsdom',
}
```

Or manually in tests:

```tsx
beforeEach(() => {
  vi.clearAllMocks();
});
```

---

## 4. Testing Custom Hooks

Use `renderHook` from `@testing-library/react` (merged in v13+).

```tsx
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

it("increments value", () => {
  const { result } = renderHook(() => useCounter());

  act(() => {
    result.current.increment();
  });

  expect(result.current.count).toBe(1);
});
```

---

## 5. Scalability & Organization

- **Colocation**: Place tests next to the file: `components/Button.tsx` -> `components/Button.test.tsx`.
- **Describe Blocks**: Use `describe` to group related tests.
- **Factory Helpers**: If setup is complex, use a factory function.

```tsx
function renderSubject(props: Partial<Props> = {}) {
  const defaultProps = { title: "Default", ...props };
  return render(<Subject {...defaultProps} />);
}
```

## 6. Snapshots (Use Sparingly)

Avoid huge snapshots of entire components. They are brittle and hard to review.

- **Use**: For small, stable outputs (e.g., utility function results, small SVG components).
- **Avoid**: Large UI layouts. One CSS class change breaks 10 tests.
