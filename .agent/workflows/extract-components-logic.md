---
description: Refactor monotonic "God Components" by decoupling logic (Hooks) and decomposing UI (Sub-components).
---

This workflow guides you through breaking down complex, oversized components into maintainable, single-responsibility units. It enforces the separation of concerns: **Logic** (Hooks/Services) vs **Presentation** (UI Components).

### 1. Preparation & Skills Loading

// turbo
Before modifying code, load the necessary context and best practices.

- **Read Skills**:
  - `view_file .agent/skills/typescript-best-practices.md` (Ensure strict typing for new props).
  - `view_file .agent/skills/nextjs-best-practices.md` (Check Server vs Client component rules).
  - `view_file .agent/skills/centralize-tailwind-styles.md` (Ensure extracted UI keeps consistent styling).
  - `view_file .agent/skills/shadcn-ui-best-practices.md` (If using Shadcn components).

### 2. Analysis: Identify the "God Component"

Scan the target file. A component needs refactoring if:

- It exceeds **150-200 lines**.
- It contains multiple `useEffect` or `useState` calls mixed with large JSX blocks.
- It handles disparate tasks (e.g., checking authentication _and_ form validation _and_ data fetching).
- The JSX is nested deeper than 3-4 levels (Callback Hell).

**Action**:

- Identify **Logical Clusters**: Group related state and effects (e.g., "Form Logic", "Data Fetching", "Filter State").
- Identify **Visual Sections**: Look for distinct UI regions (e.g., "Header", "Sidebar", "Data Grid", "Pagination").

### 3. Execution Phase 1: Logic Extraction (Custom Hooks)

Move business logic out of the component.

1. Create a `hooks` folder in the feature directory (e.g., `src/features/dashboard/hooks/`).
2. Create `use[FeatureName].ts`.
3. **Move**:
   - `useState`, `useEffect`, `useCallback`, `useMemo`.
   - API fetchers and event handlers.
   - Zod schemas or form configurations.
4. **Return**: Expose _only_ what the UI needs (values and simplified handler functions).
5. **Type**: Define clear return types for the hook.

### 4. Execution Phase 2: UI Decomposition (Sub-components)

Break the massive JSX return into smaller, "dumb" components.

1. Create a `components` folder in the feature directory (e.g., `src/features/dashboard/components/`).
2. **Isolate Sections**:
   - Move big chunks of JSX into their own files (e.g., `DashboardHeader.tsx`, `UserGrid.tsx`).
3. **Props Interface**:
   - Define clear `interface Props` for each new component. **DO NOT** pass the entire state object. Pass specific primitives or typed objects.
4. **Replace**:
   - In the parent component, replace the huge JSX block with `<SubComponent prop={value} />`.

### 5. Patterns & Examples

#### ❌ Bad Pattern (The "God Component")

```tsx
// Mixed concerns, huge file, hard to read
export const UserDashboard = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  // ... 20 more lines of state ...

  useEffect(() => {
    /* Complex fetching logic */
  }, []);

  return (
    <div className="p-4">
      <header>...</header> {/* 50 lines of header */}
      <table>...</table> {/* 100 lines of table */}
      <dialog>...</dialog> {/* 50 lines of modal */}
    </div>
  );
};
```

#### ✅ Good Pattern (Separation of Concerns)

```tsx
// src/features/users/components/UserDashboard.tsx
import { useUserDashboard } from '../hooks/useUserDashboard';
import { UserListTable } from './UserListTable';
import { DashboardHeader } from './DashboardHeader';

export const UserDashboard = () => {
  // 1. Single hook for logic
  const { users, isLoading, filters, updateFilters } = useUserDashboard();

  // 2. Clean, declarative UI
  return (
    <div className="space-y-4">
      <DashboardHeader filters={filters} onFilterChange={updateFilters} />
      <UserListTable data={users} isLoading={isLoading} />
    </div>
  );
};
```

### 6. Verification & Cleanup

1. **No Unused Imports**: Run a linter or check manually to remove unused imports in the original file.
2. **Type Safety**: Ensure `npm run build` or `tsc` produces no errors on the new props.
3. **Behavior Check**:
   - Does the page load?
   - Do the interactions (clicks, forms) still work exactly as before?
4. **File Structure**: Ensure new files are in the correct `components/` and `hooks/` folders, following the project's architecture.
