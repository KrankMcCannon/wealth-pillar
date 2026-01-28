---
description: Extract components into smaller components to be able to re-use them in the project
---

This workflow decomposes large components into smaller, reusable UI components to improve maintainability and reusability.

1.  **Identify Logical Sections**:
    - Review the target component's JSX.
    - Identify distinct UI sections (e.g., specific cards, list items, headers, complex forms).
    - Look for repeated patterns or sections that are large enough to distract from the main component's purpose.

2.  **Evaluate Reusability**:
    - Ask: "Could this UI piece be used elsewhere?" or "Is this file getting too long?"
    - Check if a similar component already exists in `src/components` or `src/features/{feature}/components`.

3.  **Extract Component**:
    - Create a new file for the sub-component.
        - If generic: `src/components/{folder}/{ComponentName}.tsx`
        - If feature-specific: `src/features/{feature}/components/{ComponentName}.tsx`
    - Copy the relevant JSX and styles.

4.  **Define Interface**:
    - Create a strictly typed Props interface for the new component.
    - Pass only the necessary data (avoid passing large objects if only one field is needed).
    - Ensure callbacks (e.g., `onClick`, `onEdit`) are properly typed.

5.  **Refactor Original**:
    - Import the new component in the parent file.
    - Replace the extracted JSX with the component instance.
    - Pass the required props.

6.  **Verification**:
    - Ensure the UI renders exactly as before.
    - Verify that all interactive elements (buttons, inputs) work correctly in the new sub-component.
