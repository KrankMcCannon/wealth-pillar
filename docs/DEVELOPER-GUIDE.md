# Wealth Pillar - Developer Guide

**Last Updated**: October 24, 2024
**For**: New developers, contributors, and debugging

---

## Table of Contents

1. [Quick Start](#quick-start) - 5-minute setup
2. [Environment Setup](#environment-setup) - Full configuration
3. [Running the Application](#running-the-application) - Development & production
4. [Feature Development](#feature-development) - How to build features
5. [Code Patterns](#code-patterns) - Copy-paste examples
6. [Troubleshooting](#troubleshooting) - Debug common issues
7. [Getting Help](#getting-help) - Resources and documentation

---

## Quick Start

### Prerequisites
- Node.js 18+ (`node --version`)
- npm 9+ (`npm --version`)
- Git
- VSCode (recommended)

### 5-Minute Setup

```bash
# 1. Clone and enter directory
git clone https://github.com/your-org/wealth-pillar.git
cd wealth-pillar

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000
```

**✅ Done!** You're now running the app locally.

---

## Environment Setup

### Step 1: Install Node.js

**macOS (Homebrew)**:
```bash
brew install node
```

**Windows (Chocolatey)**:
```bash
choco install nodejs
```

**Linux (Ubuntu/Debian)**:
```bash
sudo apt update
sudo apt install nodejs npm
```

**Verify**:
```bash
node --version  # Should be 18+
npm --version   # Should be 9+
```

### Step 2: Clone Repository

```bash
git clone https://github.com/your-org/wealth-pillar.git
cd wealth-pillar
```

### Step 3: Install Dependencies

```bash
npm install
```

If you encounter issues:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### Step 4: Environment Variables

Create `.env.local` in project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Database
DATABASE_URL=your_database_url

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Step 5: IDE Configuration

**VSCode Extensions** (recommended):
- ESLint
- Prettier
- TypeScript Vue Plugin
- Tailwind CSS IntelliSense
- Thunder Client (API testing)

**VSCode Settings** (`.vscode/settings.json`):
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

---

## Running the Application

### Development Server

```bash
npm run dev
```

- Runs at `http://localhost:3000`
- Hot reload enabled (changes appear instantly)
- Debug mode active

### Production Build

```bash
npm run build
npm run start
```

- Optimized for production
- Build time: ~14.5 seconds
- Size-optimized bundles

### Code Quality

```bash
npm run lint              # Check for issues
npm run lint -- --fix     # Auto-fix issues
```

---

## Feature Development

### Project Structure

```
wealth-pillar/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth pages (login, signup, etc)
│   ├── (dashboard)/             # Dashboard pages
│   └── api/                     # API routes (server endpoints)
├── src/
│   ├── components/              # React components
│   │   ├── ui/                  # UI primitives (Button, Card, etc)
│   │   ├── pages/               # Page components (lazy-loaded)
│   │   └── shared/              # Shared components
│   ├── features/                # Feature modules
│   │   ├── auth/                # Authentication feature
│   │   ├── transactions/        # Transactions feature
│   │   ├── budgets/             # Budgets feature
│   │   ├── accounts/            # Accounts feature
│   │   ├── recurring/           # Recurring transactions
│   │   ├── categories/          # Categories feature
│   │   ├── dashboard/           # Dashboard feature
│   │   ├── reports/             # Reports feature
│   │   ├── investments/         # Investments feature
│   │   ├── settings/            # Settings feature
│   │   └── permissions/         # Permissions feature
│   ├── lib/                     # Shared utilities
│   │   ├── api-client.ts        # API service classes
│   │   ├── services/            # Business logic
│   │   ├── utils/               # Helper functions
│   │   ├── hooks/               # Custom hooks
│   │   ├── types.ts             # TypeScript types
│   │   ├── database/            # Database utilities
│   │   └── query/               # React Query config
│   └── styles/                  # Global styles
├── docs/                        # Documentation
├── public/                      # Static assets
├── .env.local                   # Local env variables (create this)
├── .env.example                 # Env template
├── tsconfig.json                # TypeScript config
├── tailwind.config.ts           # Tailwind config
├── next.config.ts               # Next.js config
└── package.json                 # Dependencies

```

### Data Flow

```
User Action → Component → Hook → API Client → API Route → Service → Database
     ↓
   UI Update (via React Query cache)
```

### Architecture Overview

**1. Service Layer**
- All API calls go through services in `lib/api-client.ts`
- Services call Next.js API routes
- API routes validate requests server-side

**2. React Query**
- Manages server state and caching
- Query hooks in `lib/hooks/use-query-hooks.ts`
- Mutation hooks in feature-specific files

**3. Features**
- Self-contained modules in `src/features/`
- Each feature has: components, hooks, services
- Barrel exports for clean public APIs

**4. Utilities**
- Shared functions in `src/lib/utils/`
- Business logic in `src/lib/services/`
- Custom hooks in `src/lib/hooks/`

---

## Code Patterns

### Pattern 1: Adding a New Page

**Step 1: Create page file**
```bash
mkdir -p app/(dashboard)/my-feature
touch app/(dashboard)/my-feature/page.tsx
```

**Step 2: Create page component**
```tsx
// src/components/pages/my-feature-page.tsx
export function MyFeaturePage() {
  return <div>My Feature Content</div>;
}
```

**Step 3: Lazy-load in page**
```tsx
// app/(dashboard)/my-feature/page.tsx
import { lazy, Suspense } from 'react';
import { PageLoader } from '@/src/components/shared';

const MyFeatureComponent = lazy(() =>
  import('@/src/components/pages/my-feature-page').then(mod => ({
    default: mod.MyFeaturePage
  }))
);

export default function Page() {
  return (
    <Suspense fallback={<PageLoader message="Loading..." />}>
      <MyFeatureComponent />
    </Suspense>
  );
}
```

### Pattern 2: Creating a Query Hook

**In `src/lib/hooks/use-query-hooks.ts`**:
```typescript
export const useMyData = () => {
  return useQuery({
    queryKey: queryKeys.myData(),
    queryFn: myService.getAll,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};
```

**Add to query keys** in `src/lib/query/keys.ts`:
```typescript
myData: () => ['wealth-pillar', 'my-data'],
```

**Use in component**:
```tsx
const { data, isLoading, error } = useMyData();
```

### Pattern 3: Creating Mutation Hooks

**In `src/features/my-feature/hooks/use-my-feature-mutations.ts`**:
```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { myService } from '@/src/lib/api-client';
import { queryKeys } from '@/src/lib/query-keys';

export const useCreateMyFeature = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: myService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.myData(),
      });
    },
  });
};
```

### Pattern 4: Creating a Service

**In `src/features/my-feature/services/my-feature.service.ts`**:
```typescript
import { apiClient } from '@/src/lib/api-client';
import { MyFeatureType } from '@/src/lib/types';

export const myFeatureService = {
  getAll: async (): Promise<MyFeatureType[]> => {
    const response = await apiClient.get('/api/my-feature');
    return response;
  },

  getById: async (id: string): Promise<MyFeatureType> => {
    const response = await apiClient.get(`/api/my-feature/${id}`);
    return response;
  },

  create: async (data: Partial<MyFeatureType>): Promise<MyFeatureType> => {
    const response = await apiClient.post('/api/my-feature', data);
    return response;
  },

  update: async (id: string, data: Partial<MyFeatureType>): Promise<MyFeatureType> => {
    const response = await apiClient.put(`/api/my-feature/${id}`, data);
    return response;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/my-feature/${id}`);
  },
};
```

### Pattern 5: Creating an API Route

**In `app/api/my-feature/route.ts`**:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, validateUserContext } from '@/src/lib/database/supabase-server';
import { withErrorHandler } from '@/src/lib';

export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    await validateUserContext();

    const { data, error } = await supabaseServer
      .from('my_table')
      .select('*');

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  });
}

export async function POST(request: NextRequest) {
  return withErrorHandler(async () => {
    await validateUserContext();

    const body = await request.json();

    const { data, error } = await supabaseServer
      .from('my_table')
      .insert(body)
      .select()
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json(data);
  });
}
```

### Pattern 6: Creating a Form Component

**Form Controller Hook**:
```typescript
// src/features/my-feature/hooks/use-my-feature-form-controller.ts
import { useCallback, useState } from 'react';

export const useMyFeatureFormController = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    // Validate and submit
    return formData;
  }, [formData]);

  return {
    formData,
    handleChange,
    handleSubmit,
  };
};
```

**Form Component**:
```tsx
// src/features/my-feature/components/my-feature-form.tsx
import { useMyFeatureFormController } from '../hooks/use-my-feature-form-controller';
import { useCreateMyFeature } from '../hooks/use-my-feature-mutations';

export function MyFeatureForm() {
  const { formData, handleChange, handleSubmit } = useMyFeatureFormController();
  const { mutate: create, isPending } = useCreateMyFeature();

  const onSubmit = (e: React.FormEvent) => {
    const data = handleSubmit(e);
    create(data);
  };

  return (
    <form onSubmit={onSubmit}>
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder="Name"
      />
      <textarea
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Description"
      />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
}
```

---

## Troubleshooting

### Quick Diagnosis

| Problem | Symptoms | Solution |
|---------|----------|----------|
| Build fails | `npm run build` shows errors | [Build Issues](#build-issues-1) |
| Dev server won't start | `npm run dev` errors | [Dev Server Issues](#dev-server-issues-1) |
| App crashes | Blank screen or error page | [Runtime Errors](#runtime-errors-1) |
| API not working | 404, 500, or no data | [API Issues](#api-issues-1) |
| Database problems | Cannot connect or query fails | [Database Issues](#database-issues-1) |
| Slow performance | Page loads slowly | [Performance Issues](#performance-issues-1) |
| Layout looks wrong | Components misaligned | [UI/Layout Issues](#uilayout-issues-1) |

### Build Issues

#### Error: "Cannot find module"

```
Module not found: Can't resolve '@/src/components/xyz'
```

**Solution**:
1. Verify file exists: `ls src/components/xyz.tsx`
2. Check import path uses `@/src/`
3. Verify barrel exports in `index.ts`
4. Clear cache: `rm -rf .next && npm run build`

```bash
# Find a file
find src -name "*xyz*"
```

#### Error: "Type error: Property 'X' does not exist"

```
Type error: Property 'myProp' does not exist on type 'Props'
```

**Solution**:
1. Check interface has the property
2. Verify spelling matches
3. Make sure types are imported
4. Run full build: `npm run build`

```typescript
// ❌ Wrong
interface Props { name: string; }
function MyComponent({ userName }: Props) {} // userName not in Props

// ✅ Correct
interface Props { name: string; }
function MyComponent({ name }: Props) {}
```

#### Error: "ESLint: Unexpected any"

**Solution**: These are warnings, not errors. Build still passes. To fix:

```typescript
// ❌ Avoid
function myFunc(data: any): any { }

// ✅ Better
function myFunc(data: unknown): Result { }
function myFunc(data: MyType): MyResult { }
```

#### Build takes > 30 seconds

**Solutions**:
```bash
# Clear cache
rm -rf .next node_modules package-lock.json
npm install
npm run build

# Check what's slow
npm run build -- --debug
```

### Dev Server Issues

#### Error: "Port 3000 already in use"

```
Error: listen EADDRINUSE :::3000
```

**macOS/Linux**:
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
```

**Windows**:
```bash
# Find process
netstat -ano | findstr :3000

# Kill process by PID
taskkill /PID <PID> /F

# Or use different port
npm run dev -- -p 3001
```

#### Error: "Supabase connection failed"

**Solution**:
1. Check `.env.local` has correct credentials
2. Verify Supabase project is active
3. Test connection:
   ```bash
   curl https://your-supabase-url/rest/v1/
   ```
4. Check network: Are you behind a proxy?

#### Hot reload not working

**Solution**:
```bash
# Restart dev server
npm run dev

# If still broken, clear cache
rm -rf .next
npm run dev
```

### Runtime Errors

#### Error: "undefined is not a function"

**Common causes**:
- Function not imported correctly
- Variable name typo
- Function not exported from module

**Debug**:
```typescript
// ❌ Wrong
import { myFunction } from '@/src/lib'; // Not exported

// ✅ Correct
import { myFunction } from '@/src/lib/utils';

// ✅ Or check barrel export
import * as lib from '@/src/lib';
console.log(Object.keys(lib)); // See what's exported
```

#### Error: "Hook called outside component"

**Cause**: Calling React hook outside of component or in wrong context

**Solution**:
```typescript
// ❌ Wrong
const data = useQuery(...); // Called outside component

// ✅ Correct
export function MyComponent() {
  const data = useQuery(...); // Called inside component
  return <div>{data}</div>;
}
```

#### Error: "Infinite loop detected"

**Common causes**:
- Query/mutation called in effect without dependencies
- useEffect missing dependency array
- Recursive function with no base case

**Solution**:
```typescript
// ❌ Wrong
useEffect(() => {
  myQuery(); // Called every render!
});

// ✅ Correct
useEffect(() => {
  myQuery();
}, []); // Empty array = run once
```

### API Issues

#### Error: 404 Not Found

**Solution**:
1. Check endpoint exists: `app/api/my-route/route.ts`
2. Verify method (GET, POST, etc.)
3. Check service calls correct endpoint
4. Check network tab for actual URL

```typescript
// Debug
console.log('Calling:', myService.getAll);
// Check Network tab (F12) for actual request URL
```

#### Error: 500 Internal Server Error

**Solution**:
1. Check API route has error handling
2. Look at terminal for error logs
3. Verify Supabase credentials in env
4. Check database query is valid

```typescript
// Good error handling
export async function GET(request: NextRequest) {
  return withErrorHandler(async () => {
    // This catches and formats errors
    const data = await supabaseServer.from('table').select('*');
    return NextResponse.json(data);
  });
}
```

#### No data returned from API

**Solution**:
1. Check query is correct
2. Verify data exists in database
3. Check RLS policies allow access
4. Look at Network tab (F12) to see response

### Database Issues

#### Error: "relation does not exist"

```
relation "my_table" does not exist
```

**Solution**:
1. Check table name in Supabase
2. Verify table is in correct schema (public)
3. Check spelling and case sensitivity
4. Run migrations if needed

#### Error: "permission denied"

**Cause**: Row Level Security (RLS) policy blocking access

**Solution**:
1. Check RLS policies in Supabase
2. Verify user has access to row
3. Check `validateUserContext()` in API route
4. Look at table policies in dashboard

### Performance Issues

#### Page loads slowly

**Diagnosis**:
1. Open Network tab (F12)
2. Look for slow API calls
3. Check bundle size (check if code splitting works)

**Solutions**:
```bash
# Check build output
npm run build

# Optimize images (already done)
# Code is split into lazy-loaded pages
# API calls are cached with React Query
```

#### Too many API calls

**Solution**: React Query caching should reduce this (25-50% fewer calls already implemented)

If still calling too much:
1. Check query hooks use correct staleTime
2. Verify mutations invalidate correctly
3. Look at Network tab to find redundant calls

### UI/Layout Issues

#### Component doesn't render

**Solution**:
1. Check component is exported
2. Verify import path is correct
3. Check for JavaScript errors (F12 Console)
4. Verify component props are correct

#### Styling not applied

**Solution**:
1. Check Tailwind classes are used (not custom CSS)
2. Verify `tailwind.config.ts` is configured
3. Check class names spelled correctly
4. Clear Next.js cache: `rm -rf .next`

#### Layout breaks on mobile

**Solution**:
1. Check responsive classes (sm:, md:, lg:)
2. Use mobile-first approach (base styles first)
3. Test with DevTools (F12) device emulation

---

## Code of Conduct & Best Practices

### Before You Start

1. **Read the Architecture** - Understand the system design
2. **Find Similar Code** - Look for existing implementations
3. **Ask Questions** - Don't assume, clarify requirements
4. **Plan First** - Think before coding

### Development Checklist

- [ ] Created feature structure in `src/features/`
- [ ] Added barrel exports for clean API
- [ ] Created components for UI
- [ ] Created hooks for state/logic
- [ ] Created services for API calls
- [ ] Added TypeScript types
- [ ] Tested locally (`npm run dev`)
- [ ] Ran linter (`npm run lint -- --fix`)
- [ ] Ready for code review

### Style Guidelines

**Imports**:
```typescript
// ✅ Correct order
import { external } from 'external-lib';
import { internal } from '@/src/lib';
import { local } from './local-file';
```

**Naming**:
- Components: `PascalCase` (MyComponent)
- Functions: `camelCase` (myFunction)
- Constants: `UPPER_SNAKE_CASE` (MY_CONSTANT)
- Files: `kebab-case` (my-component.tsx)

**TypeScript**:
- Use strict types (no `any`)
- Define interfaces for objects
- Use discriminated unions for variants
- Prefer readonly for immutable data

### Git Workflow

**Branch naming**:
```
feature/user-authentication
fix/transaction-calculation
refactor/query-optimization
docs/api-documentation
```

**Commit messages**:
```
feat: Add user authentication
fix: Resolve transaction calculation bug
refactor: Optimize database queries
docs: Update API documentation
```

**Pull Request Process**:
1. Create feature branch
2. Make changes with descriptive commits
3. Push to GitHub
4. Create PR with description
5. Address review comments
6. Merge when approved

---

## Getting Help

### Documentation References

| Document | For |
|----------|-----|
| [README.md](../README.md) | Project overview |
| [TECHNICAL-REFERENCE.md](./TECHNICAL-REFERENCE.md) | Architecture, API, database deep-dive |
| [PROJECT-HISTORY.md](./PROJECT-HISTORY.md) | Phase summaries and refactoring history |

### Common Questions

**Q: Where do I add a new API endpoint?**
A: Create `app/api/my-route/route.ts` using the pattern in [Pattern 5](#pattern-5-creating-an-api-route)

**Q: How do I add a page?**
A: Follow [Pattern 1](#pattern-1-adding-a-new-page) for lazy-loaded pages

**Q: How do I fetch data?**
A: Use query hooks from `use-query-hooks.ts` or create custom ones using [Pattern 2](#pattern-2-creating-a-query-hook)

**Q: How do I debug an issue?**
A: Start with [Quick Diagnosis](#quick-diagnosis) and search this guide for your error

---

## Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env.local`)
- [ ] Development server runs (`npm run dev`)
- [ ] Can access http://localhost:3000
- [ ] Can make a change and see it update (hot reload)
- [ ] Read this entire guide

**Estimated setup time**: 15-20 minutes
**Estimated guide reading time**: 30-45 minutes total

**Questions?** Check [Troubleshooting](#troubleshooting) or ask your team lead.

---

**Happy coding!** 🚀
