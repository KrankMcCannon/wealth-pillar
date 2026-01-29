---
description: Extract components into smaller components to be able to re-use them in the project
---

This workflow decomposes large components into smaller, reusable UI components to improve maintainability and reusability.

1.  **Identify Logical Sections**:
    - Review the target component's JSX.
    - Identify distinct UI sections (e.g., specific cards, list items, headers).
    - **Check for Prop Drilling**: If you find yourself passing props down multiple levels, consider if a different pattern (like Composition or Context) is better.

2.  **Evaluate Reusability**:
    - Ask: "Could this UI piece be used elsewhere?"
    - Check if a similar component already exists.

3.  **Extract Component**:
    - Create a new file for the sub-component.
    - Copy the relevant JSX, styles, and necessary imports.

4.  **Define Interface**:
    - Create a strictly typed Props interface for the new component.
    - Pass only the necessary data.

5.  **Refactor Original**:
    - Import the new component.
    - Replace the extracted JSX with the component instance.

6.  **Verification**:
    - Ensure the UI renders exactly as before.
    - Verify interactive elements work.
    - **Build Check**: Run `tsc --noEmit` locally (if applicable) to ensure no type errors introduced.

