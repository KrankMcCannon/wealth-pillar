---
name: playwright-best-practices
description: Standards for writing maintainable, high-performance End-to-End (E2E) tests with Playwright.
---

# Playwright Best Practices

## When to use this skill

Use this skill whenever you are:

- Generating new E2E tests (`e2e/*.spec.ts`).
- Refactoring existing Playwright tests.
- Debugging flaky or slow E2E tests.
- Setting up the testing environment for a Next.js application.

## Core Philosophy: "Confident, Not Complex"

E2E tests should be **User-Centric**. We test what the user _sees_ and _does_, not the implementation details.

- **Reliable**: Tests must pass consistently (no flakiness).
- **Fast**: Run in parallel, fail fast.
- **Isolated**: Each test must set up its own state.

---

## 1. Locators: Resilience First

**NEVER** use CSS selectors (`.class-name`) or XPath if a user-visible locator is available. Coupling tests to styles leads to brittle tests.

### ✅ Best Practice (User-Centric)

Use locators that resemble how assistive technology (and users) perceive the page.

```ts
// Prefer these (by order of priority)
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Email Address').fill('user@example.com');
await page.getByPlaceholder('Search...').fill('query');
await page.getByText('Welcome back').isVisible();
await page.getByTestId('custom-element'); // Only if absolutely necessary
```

### ❌ Anti-Pattern (Implementation Details)

```ts
await page.locator('div > button.btn-primary').click(); // Breaks if class changes
await page.locator('#submit-btn').click(); // Breaks if ID changes
await page.locator('xpath=//div[3]/span').click(); // Extremely brittle
```

---

## 2. Idempotency & Isolation

Every test must be able to run independently, in any order, and potentially in parallel.

### ✅ Independent State

- **Don't share state** between files.
- Use `test.beforeEach` to navigate and set up.
- If creating data (e.g., "Create Post"), the test should optimally create _unique_ data to avoid conflicts (e.g., `Post Title ${Date.now()}`).

```ts
test.beforeEach(async ({ page }) => {
  // Always start from a clean slate specific to this test suite
  await page.goto('/dashboard');
});
```

### ❌ Shared State

- relying on a previous test to have created a user.
- relying on a hardcoded database ID that might be deleted by another test.

---

## 3. Waiting & Assertions

Playwright auto-waits for actionability. Do not add manual time waits.

### ✅ Auto-Wait & Web-First Assertions

Use `expect` assertions that retry automatically until the condition is met.

```ts
// Auto-retries until the button is enabled
await expect(page.getByRole('button')).toBeEnabled();

// Auto-retries until the text appears
await expect(page.getByText('Success')).toBeVisible();

// Auto-retries until URL changes
await expect(page).toHaveURL(/.*dashboard/);
```

### ❌ Hard Waits

```ts
await page.waitForTimeout(5000); // NEVER DO THIS. It slows down tests and is flaky.
```

---

## 4. Complexity Management & POM (Page Object Model)

For large apps, do not write raw selectors in every test file. Group interactions into **Page Models** only when scenarios get repetitive.

_Simple scenarios do not strictly need POM, but consistent helpers are good._

```ts
// tests/models/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, pass: string) {
    await this.page.getByLabel('Email').fill(email);
    await this.page.getByLabel('Password').fill(pass);
    await this.page.getByRole('button', { name: 'Sign in' }).click();
  }
}

// tests/auth.spec.ts
test('should login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('test@user.com', '123456');
  await expect(page).toHaveURL('/dashboard');
});
```

---

## 5. Performance & Scalability

- **Parallelism**: Playwright runs files in parallel by default. Ensure your tests don't collide on shared resources (like a single test user account).
  - _Tip_: Mock specific network requests for edge cases to avoid hitting the real backend 100 times.
- **Global Setup**: Use `global-setup.ts` for one-time heavy tasks (like seeding the DB or getting an Auth Token) and reuse the storage state.

```ts
// Using stored auth state to skip login screen in every test
test.use({ storageState: 'playwright/.auth/user.json' });
```

## 6. Verification

When writing a test, ensure:

1. **Happy Path**: Does it work when everything is correct?
2. **Error State**: Does it show the correct error when inputs are invalid? (Crucial for trust).
3. **Screenshots**: on CI failure, ensure screenshots/traces are captured to debug easily.
