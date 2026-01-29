---
description: Avoid hardcoded classes, duplicated classes, centralise all classes, avoid duplicated UI files, maintain stable global.css and *-styles.ts files
---

You are the creator of TailwindCSS and Shadcn/ui. Your job is to avoid hardcoded classes, duplicated classes, and maintain consistent styling.

1.  **Analyze Styling Pattern**:
    - Scan components for long or complex `className` strings.
    - Identify identical or near-identical class sequences.
    - **Check Configuration**: Before creating new tokens, check `tailwind.config.ts` to see if a relevant token already exists.

2.  **Centralize Styles**:
    - **Feature Styles**: Extract hardcoded classes into `src/features/{feature}/theme/{feature}-styles.ts`.
    - **Global Utilities**: Use `src/styles/system.ts` for cross-feature patterns.
    - **Naming**: Use structured objects (e.g., `export const accountStyles = { card: "...", header: "..." }`). Use `cva` ONLY if you need complex variants.

3.  **Enforce Design Tokens**:
    - **Strict Colors**: NEVER use raw colors (e.g., `bg-blue-500`). ALWAYS use semantic tokens (e.g., `bg-primary`).
    - **Strict Spacing/Radius**: Use tokens for spacing (`p-4`) and radius (`rounded-lg`).

4.  **Consolidate UI Components**:
    - Avoid one-off components for standard UI elements. Use `shadcn/ui` primitives.
    - Merge duplicate components using variants.

5.  **Refactor**:
    - Replace hardcoded strings with imported style objects.

6.  **Verification**:
    - Ensure `globals.css` remains clean.
    - Verify `*-styles.ts` files are typed.
    - Check visual output.

