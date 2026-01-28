---
description: Extract component logic into hooks or services
---

This workflow separates UI rendering from business logic by extracting state, effects, and handlers into custom hooks or services.

1.  **Analyze Component**:
    - Identify the target component.
    - Look for:
        - `useState` not directly related to UI state (e.g., data fetching state vs. modal open state).
        - `useEffect` blocks.
        - Complex event handlers or data transformation logic.
        - API calls.

2.  **Create Custom Hook/Service**:
    - Create a new file named `use{ComponentName}.ts` (or similar) in a `hooks/` directory (or collocated if preferred).
    - If the logic is pure business logic unrelated to React state, consider a service file (e.g., `services/myService.ts`).

3.  **Refactor**:
    - Move states, effects, and functions from the component to the new hook/service.
    - Return only the necessary data and handlers from the hook.

4.  **Update Component**:
    - Import and call the new hook in the component.
    - `const { data, isLoading, handler } = useMyComponent();`
    - Ensure the component now focuses primarily on JSX structure and rendering.

5.  **Verification**:
    - Ensure the component renders the same output.
    - Ensure all interactions still work.
    - Check that the component file size is reduced and readability is improved.
