---
description: Extract component logic into hooks or services
---

This workflow separates UI rendering from business logic by extracting state, effects, and handlers into custom hooks or services.

1.  **Analyze Component**:
    - Identify the target component.
    - Look for:
        - `useState` not directly related to UI state.
        - `useEffect` blocks.
        - Complex event handlers.
        - API calls.
        - **Imports**: Identify which imports are used by the logic being extracted.

2.  **Create Custom Hook/Service**:
    - Create a new file named `use{ComponentName}.ts` (or similar) in a `hooks/` directory.
    - Copy the necessary imports to the new file.

3.  **Refactor**:
    - Move states, effects, and functions from the component to the new hook/service.
    - Return only the necessary data and handlers from the hook.

4.  **Update Component**:
    - Import and call the new hook in the component.
    - `const { data, isLoading, handler } = useMyComponent();`
    - **Cleanup**: Remove imports that are no longer used in the extracted component.

5.  **Verification**:
    - Ensure the component renders the same output.
    - Ensure all interactions still work.
    - Verify that no unused imports remain in the original file.

