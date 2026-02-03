---
name: Next.js v16 Best Practices
description: A skill for building scalable, high-performance Next.js applications using App Router, Server Components, and Server Actions (v16 standards).
---

# My Skill

I am an expert in modern Next.js architecture (App Router). I design applications that are "Server-First" by default, minimizing client-side JavaScript to ensure maximum performance and SEO. I enforce a strict separation of concerns using feature-based architecture. I prioritize the use of Server Components for data fetching and Server Actions for data mutations, avoiding legacy patterns like `getServerSideProps` or unnecessary API routes.

# When to use this skill

Use this skill when:

- **Creating new pages**: To determine the correct file structure (`page.tsx`, `layout.tsx`, `loading.tsx`).
- **Fetching data**: To implement direct DB calls in Server Components using `await`.
- **Handling forms/interactions**: To implement Server Actions (`'use server'`) instead of REST APIs.
- **Structuring the project**: To decide where to place components, stores, and utilities.
- **Optimizing performance**: To implement Streaming, Suspense, and Image optimization.

**Examples:**

- "Create a dashboard page that fetches user data on the server and streams the chart component."
- "Refactor this client-side form to use a Server Action with simple validation."
- "Should this component be 'use client' or a Server Component?" (Answer: Server, unless hooks/interactivity are needed).
- "Implement a skeleton loader while the main content is fetching."

# How to use it

Follow these strict architectural guidelines:

### 1. Feature-Based Architecture

To ensure scalability, do not dump everything in `components/`. Group code by "Feature".
Structure:

```
src/
  app/                    # Routing layer (Keep thin!)
    (marketing)/          # Route Group
      page.tsx
    dashboard/
      page.tsx
  features/               # Business Logic & UI
    auth/
      components/         # Auth-specific UI
      actions.ts          # Server Actions
      queries.ts          # DB Fetching Logic
    dashboard/
      components/
  components/             # Global shared UI (Buttons, Inputs)
  lib/                    # Global utilities
```

### 2. Server Components by Default

- **Fetch in `page.tsx`**: Do not use `useEffect` for data. Async/await the DB call in the component.
- **Pass Data Down**: fetching component -> prop -> presentation component.
- **"Leaf" Client Components**: Push `use client` down the tree. Only the interactive button/chart needs it, not the whole page wrapper.

```tsx
// app/dashboard/page.tsx
import { getDashboardStats } from "@/features/dashboard/queries";
import { StatsGrid } from "@/features/dashboard/components/stats-grid";

export default async function DashboardPage() {
  const stats = await getDashboardStats(); // Direct Server Call
  return <StatsGrid stats={stats} />;
}
```

### 3. Server Actions for Mutations

Avoid creating `/api/...` routes for internal mutations. Use strict Server Actions.

- Define actions in `actions.ts` within the feature folder.
- Always validate inputs (e.g., using Zod) inside the action.
- Use `revalidatePath` to update UI after mutation.

```ts
// features/todos/actions.ts
'use server'
import { revalidatePath } from "next/cache"

export async function createTodo(formData: FormData) {
  // Validate and Insert
  await db.insert(...)
  revalidatePath('/todos')
}
```

### 4. Streaming & Suspense

Never block the entire page for slow data.

- **Use `loading.tsx`**: For instant navigation feedback.
- **Granular Suspense**: Wrap slow components in `<Suspense fallback={<Skeleton />}>` to let the rest of the page load first.

### 5. Performance Checklist

- [ ] Are we using `<Image>` with explicit sizing to prevent CLS?
- [ ] Is `next/font` used for zero layout shift?
- [ ] Is dynamic content wrapped in Suspense?
- [ ] Are we caching data reads where appropriate (using `unstable_cache` or native fetch cache)?

### 6. Simplicity & Maintenance

- **Keep `app/` clean**: The `app` directory is for routing. Actual component code lives in `features/` or `components/`.
- **Type Everything**: Share types between Server Action and Client Component.
