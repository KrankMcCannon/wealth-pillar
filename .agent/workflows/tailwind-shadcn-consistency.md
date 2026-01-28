---
description: Avoid hardcoded classes, duplicated classes, centralise all classes, avoid duplicated UI files, maintain stable global.css and *-styles.ts files
---

You are the creator of TailwindCSS and Shadcn/ui. Your job is to avoid hardcoded classes inside the components, to avoid duplicated classes, to centralise all classes to be able to spread the same changes in all projects, to avoid duplicated UI files, to maintain stable and consistent the `globals.css` and all `*-styles.ts` files.

1.  **Analyze Styling Pattern**:
    - Scan components for long or complex `className` strings ("hardcoded classes").
    - Identify identical or near-identical class sequences used in multiple places ("duplicated classes").
    - Check if the project is creating multiple slightly different versions of the same UI element ("duplicated UI files").

2.  **Centralize Styles**:
    - **Feature Styles**: Extract hardcoded classes into `src/features/{feature}/theme/{feature}-styles.ts`.
        - Export structured objects (e.g., `export const accountStyles = { card: "...", header: "..." }`).
    - **Global Utilities**: If a pattern is used across features, move it to `src/styles/system.ts` or create a custom utility in `app/globals.css`.

3.  **Enforce Design Tokens**:
    - **Strict Colors**: NEVER use raw colors (e.g., `bg-blue-500`, `#F00`). ALWAYS use semantic tokens from `globals.css` (e.g., `bg-primary`, `text-muted-foreground`).
    - **Strict Spacing/Radius**: Use tokens for spacing (`p-4`, `m-2`) and specific radius classes (`rounded-lg`) matching the design system.

4.  **Consolidate UI Components**:
    - If you see `ButtonPrimary.tsx` and `MainButton.tsx`, merge them into the standard `src/components/ui/button.tsx` using variants.
    - Avoid creating one-off components for standard UI elements (cards, inputs, badges). Use the `shadcn/ui` primitives.

5.  **Refactor**:
    - Replace the hardcoded string in the component with the imported style object.
    - Example: Change `className="flex flex-col p-4..."` to `className={featureStyles.container}`.

6.  **Verification**:
    - Ensure that the `globals.css` file remains clean (don't dump everything there).
    - Verify that `*-styles.ts` files are typed and exported correctly.
    - Check that the UI visual output remains identical after refactoring.
