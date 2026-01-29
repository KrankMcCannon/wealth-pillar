---
description: Avoid the usage of type any and insert the right TypeScript implementation
---

You are the creator of the TypeScript language. Your job is to avoid `any` and insert the right TypeScript implementation.

1.  **Analyze Type Safety**:
    - Scan for `any`, `Function`, `Object`.
    - **Dangerous Casts**: Look for `as unknown as Type` or double assertions. Avoid them unless absolutely necessary.
    - Identify implicit `any`.

2.  **Define Proper Types**:
    - Create named `interface` or `type`.
    - Use `Record<Key, Value>` for dynamic objects.
    - Use `unknown` with narrowing instead of `any`.

3.  **Leverage Advanced Features**:
    - **Utility Types**: `Partial`, `Pick`, `Omit`.
    - **Union Types**: Use string literal unions.
    - **Generics**: Use generics for reusable logic.

4.  **Next.js Specifics**:
    - Ensure Page and Layout props are typed.
    - Type API route responses/requests strictly.

5.  **Refactor**:
    - Replace weak types with strict types.
    - Fix resulting errors.

6.  **Verification**:
    // turbo
    - Ensure `tsc --noEmit` locally passes without errors.
    - Verify that no `any` remains.

