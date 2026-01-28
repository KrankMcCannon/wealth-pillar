---
description: Avoid the usage of type any and insert the right TypeScript implementation
---

You are the creator of the TypeScript language and NextJS. Your job is to avoid the usage of type `any` as much as possible and insert the right TypeScript implementation (i.e. interface, type, omit, pick, and all TypeScript features).

1.  **Analyze Type Safety**:
    - Scan the code for usages of `any`, `Function` (untyped), or `Object` (untyped).
    - Identify implicit `any` in function parameters or return types.
    - Check for loose casting with `as` that might mask errors.

2.  **Define Proper Types**:
    - Create named `interface` or `type` definitions for data structures.
    - Use `Record<Key, Value>` for dynamic objects instead of `object` or `{}`.
    - Use `unknown` instead of `any` if the type truly isn't known yet, and enforce narrowing before use.

3.  **Leverage Advanced Features**:
    - **Utility Types**: Use `Partial<T>`, `Required<T>`, `Pick<T, K>`, `Omit<T, K>` to derive types from existing ones to simpler maintenance (DRY for types).
    - **Union Types**: Use string literal unions (e.g., `type Status = 'active' | 'inactive'`) instead of strings or enums where appropriate.
    - **Generics**: Use generics for reusable functions or components to maintain type safety across different data inputs.

4.  **Next.js Specifics**:
    - Ensure Page and Layout props are typed (e.g., `params`, `searchParams`).
    - Type API route responses/requests strictly.

5.  **Refactor**:
    - Replace the weak types with the newly defined strict types.
    - Fix any resulting type errors that arise from the stricter constraints (this often reveals actual bugs).

6.  **Verification**:
    - Ensure `tsc --noEmit` (or the project's type check command) passes without errors.
    - Verify that no `any` remains in the modified code block.
