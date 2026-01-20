# AGENTS.md

This document provides guidelines and commands for agentic coding assistants working on this repository.

## Development Commands

### Build & Quality Checks
- `npm run build` - Production build
- `npm run lint` - ESLint check
- `npm run typecheck` - TypeScript type checking (tsc --noEmit)

### Development
- `npm run dev` - Start development server (Next.js)
- `npm run start` - Start production server

### Database
- `npx prisma generate` - Generate Prisma client (runs automatically on install)
- `npx prisma db push` - Push schema changes to database
- `npx prisma studio` - Open Prisma Studio

### Testing
- No test framework configured (Playwright installed but not configured)
- To add tests, configure vitest or jest in package.json

## Code Style Guidelines

### Project Structure
This is a Next.js 16 application with TypeScript using the App Router pattern:
- `app/` - Next.js App Router pages and layouts
- `src/` - Source code organized by domain:
  - `components/` - UI components (ui, layout, shared, form, cards)
  - `features/` - Feature-based modules (accounts, auth, budgets, etc.)
  - `hooks/` - Custom React hooks (state, data, use-*)
  - `lib/` - Utilities, types, cache, styles
  - `server/` - Server-side code (services, DAL, db)
  - `stores/` - Zustand state management
  - `providers/` - React context providers
  - `styles/` - CSS-in-JS style objects

### Imports & Path Aliases
- Use `@/*` for src/* directory imports
- Use direct imports for current directory
- Group imports: external → internal → types
- Prefer named exports over default exports

```typescript
import { useState, useEffect } from "react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Transaction } from "@/lib/types";
```

### File Naming Conventions
- Components: PascalCase (e.g., `UserButton.tsx`)
- Utilities: kebab-case (e.g., `currency-formatter.ts`)
- Hooks: use-case with prefix `use-` (e.g., `use-debounced-value.ts`)
- Stores: kebab-case with suffix `-store` (e.g., `ui-state-store.ts`)
- Services: kebab-case with suffix `.service` (e.g., `transaction.service.ts`)
- Repositories: kebab-case with suffix `.repository` (e.g., `transaction.repository.ts`)

### TypeScript & Types
- Strict mode enabled - always type all variables and function parameters
- Use `interface` for object shapes, `type` for unions/primitives
- Export types from `index.ts` barrel files
- Use `export type` for type-only exports
- Avoid `any` - use `unknown` if necessary

### Component Patterns
- Client components: Add `"use client";` at file top
- Server-only code: Import `'server-only'` at file top
- Use `React.forwardRef` for ref-forwarding components
- Define props interfaces before component
- Use named exports, not default exports

```typescript
"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline";
  size?: "default" | "sm" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return <button ref={ref} className={cn(baseClasses, className)} {...props} />;
  }
);
Button.displayName = "Button";
```

### Styling & Tailwind CSS
- Use Tailwind CSS v4 with CSS variables
- Use `cn()` utility from `@/lib/utils` for merging classes
- Class Variance Authority (CVA) for component variants
- Centralize variants in `src/lib/utils/ui-variants.ts`

### State Management
- Use Zustand with middleware (persist, devtools) for global state
- Create selector hooks for optimized re-renders
- Store files in `src/stores/` with `-store` suffix

```typescript
import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';

interface UIStateStore {
  activeTabs: Record<string, string>;
  setActiveTab: (page: string, tab: string) => void;
}

export const useUIStateStore = create<UIStateStore>()(
  devtools(
    persist((set) => ({
      activeTabs: {},
      setActiveTab: (page, tab) => set({ activeTabs: { [page]: tab } }),
    }), { name: 'ui-state' })
  )
);
```

### Server-Side Code
- Use `import 'server-only'` for server-only functions
- Repository pattern in `src/server/dal/` for data access
- Service layer in `src/server/services/` for business logic
- Use Prisma Client for database operations
- Cache with Next.js `revalidateTag` and custom cache utilities

### Error Handling & Documentation
- Define error interfaces in `src/lib/types/`
- Use JSDoc comments for functions and complex logic
- Add inline comments for non-obvious code
- Document custom hooks with usage examples

### Database (Prisma)
- Schema in `prisma/schema.prisma`
- Use UUID primary keys with `@default(dbgenerated("gen_random_uuid()"))`
- Add indexes for frequently queried fields
- Use Timestamptz for timestamps with timezone support

### Code Quality
- Run `npm run lint` before committing
- Run `npm run typecheck` before committing
- ESLint rule: `@typescript-eslint/no-explicit-any` is set to "warn"
- Follow existing patterns when adding new features
- Import from barrel files (`index.ts`) when available
