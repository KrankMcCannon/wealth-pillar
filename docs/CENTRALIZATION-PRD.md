# WEALTH PILLAR CODEBASE CENTRALIZATION PRD
**Version**: 2.0 (Post-Migration)
**Created**: October 24, 2025
**Status**: Phase 1 COMPLETED ✅
**Current Phase**: Phase 2 - Logic Centralization (starting next)

---

## EXECUTIVE SUMMARY

The codebase has been successfully migrated to a new `src/` structure. Now we need to:
1. **Fix the build** (import path errors)
2. **Centralize all logic** (single source of truth for utilities, services, hooks)
3. **Consolidate components** (move reusable components to src/components/)
4. **Standardize styles** (create central style system)
5. **Organize types** (centralized type definitions)

This document provides step-by-step instructions to complete the centralization, eliminate redundancy, and create a maintainable codebase following SOLID and DRY principles.

---

## CURRENT STATE ✅

### What's Done
- ✅ Legacy structure removed (old components/, hooks/, lib/ deleted)
- ✅ All imports migrated to src/ paths
- ✅ 164+ files organized in feature-first structure
- ✅ Build system updated
- ✅ 22 barrel exports (index.ts) created
- ✅ 59 component files in src/components/

### Current Issues to Fix
1. **Import Path Errors**: Some files still have `@/src/src` double paths
2. **Missing Barrel Exports**: Some features missing index.ts
3. **Duplicate Logic**: Utility functions scattered across features
4. **Scattered Styles**: Tailwind classes duplicated in multiple components
5. **Inconsistent Hooks**: Duplicate hooks logic across features

### Directory Structure
```
src/
├── components/          # Shared UI components (59 files)
│   ├── ui/             # Radix + primitives
│   ├── layout/         # Page layouts
│   ├── shared/         # Error boundaries, loaders
│   └── index.ts        # ✅ Central export
├── features/           # Feature-first organization
│   ├── transactions/   # Transactions + forms + hooks
│   ├── budgets/        # Budgets feature
│   ├── accounts/       # Accounts feature
│   ├── categories/     # Categories feature
│   ├── recurring/      # Recurring transactions
│   ├── dashboard/      # Dashboard
│   ├── auth/          # Authentication
│   ├── permissions/   # Permissions
│   └── settings/      # Settings
├── lib/                # Centralized utilities & services
│   ├── api/            # API client
│   ├── auth/           # Auth helpers
│   ├── database/       # DB layer
│   ├── hooks/          # Shared hooks (22 files)
│   ├── query/          # React Query config
│   ├── services/       # Business logic
│   ├── types/          # TypeScript types
│   ├── utils/          # Utilities
│   └── index.ts        # ✅ Central export
├── providers/          # React context providers
└── app/                # Next.js App Router (pages only)
```

---

## GOAL: ELIMINATE REDUNDANCY & CENTRALIZE

### Redundancy Problems Identified
1. **Duplicate Utility Functions**: Same logic in multiple files
2. **Scattered Business Logic**: Services duplicated across features
3. **Component Style Duplication**: Same Tailwind patterns repeated 10+ times
4. **Hook Duplication**: Similar hooks in multiple features
5. **Type Definitions**: Shared types scattered across features

### What We'll Centralize

#### 1. Logic Centralization (in src/lib/services/)
- ✅ Transaction filtering
- ✅ Data grouping
- ✅ Financial calculations
- ✅ Chart data generation
- ❌ Form validation (scattered)
- ❌ Form state management (scattered)
- ❌ Recurring series logic (partially duplicated)

#### 2. Behavior Centralization (in src/lib/hooks/)
- ✅ useTransactions (query)
- ✅ useBudgets (query)
- ❌ useCardActions (should be generic)
- ❌ useUserSelection (only one place)
- ❌ useDashboardCore (only one place)
- ❌ Financial queries (spread across features)

#### 3. Component Centralization (in src/components/)
- ✅ UI primitives (Text, Amount, StatusBadge, IconContainer)
- ✅ Layout components (DomainCard, ListItem, EmptyState, Section)
- ✅ Form components (BaseForm, FormField, FormSelect, etc.)
- ❌ Card components (still in features - should move to src/components/cards/)
- ❌ Page layouts (PageLayout, PageHeader - should be centralized)
- ❌ Feature-specific UI (should be reduced)

#### 4. Style Centralization (in src/lib/utils/tailwind.ts)
- ❌ CVA utilities scattered across components
- ❌ Color classes duplicated 20+ times
- ❌ Spacing patterns repeated
- ❌ Responsive breakpoints not consistent

#### 5. Type Centralization (in src/lib/types/)
- ✅ Domain types (Transaction, Budget, etc.)
- ❌ Feature-specific interfaces scattered
- ❌ Component props types duplicated
- ❌ API request/response types not organized

---

## FOUR-PHASE CENTRALIZATION PLAN

### PHASE 1: FIX BUILD & ORGANIZE BARREL EXPORTS (2 hours)
**Goal**: Working build with clean barrel exports
**Status**: IN PROGRESS

#### 1.1 - Fix Import Paths
- [ ] Find all `@/src/src` imports
- [ ] Replace with `@/src`
- [ ] Run `npm run build`

#### 1.2 - Create Missing Barrel Exports
- [ ] Check each feature has index.ts
- [ ] Check lib subdirs have index.ts
- [ ] Create src/components/index.ts (master export)
- [ ] Create src/lib/index.ts (master export)

#### 1.3 - Verify Build
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### PHASE 2: CENTRALIZE LOGIC & UTILITIES (4-6 hours)
**Goal**: Single source of truth for business logic
**Status**: PENDING

#### 2.1 - Audit Current State
- [ ] List all files in lib/services/
- [ ] List all files in lib/hooks/
- [ ] List all files in lib/utils/

#### 2.2 - Form Services Consolidation
- [ ] Create form-validation.service.ts
- [ ] Create form-state.service.ts
- [ ] Update feature imports
- [ ] Delete duplicates

#### 2.3 - Business Logic Consolidation
- [ ] Consolidate transaction filtering
- [ ] Consolidate financial calculations
- [ ] Consolidate grouping logic

#### 2.4 - Utilities Consolidation
- [ ] Create lib/utils/date-utils.ts
- [ ] Create lib/utils/formatting.ts
- [ ] Create lib/utils/array-utils.ts
- [ ] Create lib/utils/index.ts

#### 2.5 - Hooks Consolidation
- [ ] Audit all hooks across features
- [ ] Move shared hooks to lib/hooks/
- [ ] Create lib/hooks/index.ts

#### 2.6 - Verify Phase 2
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### PHASE 3: CENTRALIZE COMPONENTS & STYLES (4-6 hours)
**Goal**: Reusable component library with consistent styling
**Status**: PENDING

#### 3.1 - Card Components
- [ ] Move cards to src/components/cards/
- [ ] Create cards/index.ts

#### 3.2 - Page Layouts
- [ ] Create src/components/layouts/
- [ ] Consolidate layout patterns

#### 3.3 - Feature Components
- [ ] Move generic components to src/components/
- [ ] Keep feature-specific in features/

#### 3.4 - Style Consolidation
- [ ] Create lib/ui-variants.ts
- [ ] Consolidate CVA utilities
- [ ] Create lib/styles/tailwind-utils.ts

#### 3.5 - Type Consolidation
- [ ] Create lib/types/component-props.ts
- [ ] Create lib/types/api.ts
- [ ] Create lib/types/domain.ts

#### 3.6 - Verify Phase 3
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

---

### PHASE 4: DELETE REDUNDANT CODE (1-2 hours)
**Goal**: Clean codebase with no duplication
**Status**: PENDING

#### 4.1 - Find Duplicates
- [ ] Find duplicate utility functions
- [ ] Find duplicate hooks

#### 4.2 - Delete Redundancy
- [ ] Delete duplicate files
- [ ] Verify imports

#### 4.3 - Final Verification
- [ ] `npm run build` passes
- [ ] `npm run lint` passes

#### 4.4 - Documentation
- [ ] Update ARCHITECTURE.md
- [ ] Create final summary

#### 4.5 - Git Commit
- [ ] Create final commit

---

## DETAILED STEP-BY-STEP INSTRUCTIONS

### PHASE 1: Build Fix (Starting Now)

#### STEP 1.1: Fix Import Path Errors

**Command to find issues**:
```bash
grep -r "@/src/src" /Users/edoardovalentini/Documents/dev/wealth-pillar/src --include="*.ts" --include="*.tsx"
```

**For each file found**:
1. Open the file
2. Replace `@/src/src` with `@/src`
3. Save

**Expected files**: Check lines like:
```typescript
// WRONG: from "@/src/src/lib/services/form-state.service";
// RIGHT: from "@/src/lib/services/form-state.service";
```

---

#### STEP 1.2: Create Missing Barrel Exports

**Check these features have index.ts**:
- [ ] src/features/transactions/index.ts
- [ ] src/features/budgets/index.ts
- [ ] src/features/accounts/index.ts
- [ ] src/features/categories/index.ts
- [ ] src/features/recurring/index.ts
- [ ] src/features/dashboard/index.ts
- [ ] src/features/auth/index.ts
- [ ] src/features/settings/index.ts
- [ ] src/features/permissions/index.ts

**Check these lib dirs have index.ts**:
- [ ] src/lib/api/index.ts
- [ ] src/lib/auth/index.ts
- [ ] src/lib/database/index.ts
- [ ] src/lib/hooks/index.ts
- [ ] src/lib/query/index.ts
- [ ] src/lib/services/index.ts
- [ ] src/lib/types/index.ts
- [ ] src/lib/utils/index.ts

**Create src/components/index.ts** if missing - should export all major component exports

**Create src/lib/index.ts** if missing - should export all lib components

---

#### STEP 1.3: Verify Build

**Run these commands**:
```bash
npm run build      # Should show: compiled successfully
npm run lint       # Should show: 0 errors (warnings ok)
```

**If errors**:
- Note the error message
- Find the problematic import
- Fix it
- Rerun build

---

## PRD UPDATE LOG

### Updates After Each Phase Completion

**Format to use**:
```
## [DATE] [TIME] - Phase [X] COMPLETED

### Completed Tasks
- [x] Task 1
- [x] Task 2

### Build Status
✅ npm run build: PASS
✅ npm run lint: PASS

### Time Spent
- Started: [time]
- Ended: [time]
- Total: [duration]

### Next Phase
Phase [X+1] - [Description]
```

---

## HOW TO USE THIS PRD

### To Resume Tomorrow
1. Read the "CURRENT STATE" section
2. Find the last completed phase/step
3. Start with the next unchecked task
4. Follow the exact steps
5. Update this PRD when done
6. Move to next step

### Key Files to Have Open
- This PRD (CENTRALIZATION-PRD.md)
- ARCHITECTURE.md
- FOLDER-REORGANIZATION-STATUS.md
- Terminal with npm commands

### Commands to Know
```bash
# Check for import errors
grep -r "@/src/src" src/ --include="*.ts" --include="*.tsx"

# Verify build
npm run build
npm run lint

# Find files needing updates
grep -r "from ['\"]@/" src/ | grep -v "@/src"
```

---

## SUCCESS CRITERIA

### Phase 1 ✅ COMPLETE When
- ✅ `npm run build` produces 0 errors
- ✅ `npm run lint` produces 0 critical errors
- ✅ All barrel exports exist
- ✅ No `@/src/src` paths remaining

### Phase 2 ✅ COMPLETE When
- ✅ lib/services/ has 1 version of each service
- ✅ lib/utils/ contains all utility functions
- ✅ lib/hooks/ contains all shared hooks
- ✅ No duplicate function definitions
- ✅ Build passes

### Phase 3 ✅ COMPLETE When
- ✅ src/components/ has all reusable components
- ✅ All card components moved
- ✅ All layout components centralized
- ✅ lib/ui-variants.ts exists with all CVA utilities
- ✅ Build passes

### Phase 4 ✅ COMPLETE When
- ✅ 0 duplicate code in codebase
- ✅ Build produces 0 errors
- ✅ Lint produces 0 errors
- ✅ Ready for production

---

## ESTIMATED TIME

- Phase 1: 2 hours
- Phase 2: 4-6 hours
- Phase 3: 4-6 hours
- Phase 4: 1-2 hours

**Total**: 11-16 hours (can be split across 2-3 days)

---

**This PRD is your complete guide to centralize the codebase. Follow it step-by-step.**

---

## PHASE 1 COMPLETION LOG - October 24, 2025

### ✅ All Phase 1 Tasks Completed

#### Issues Fixed
1. ✅ **Import Path Errors**: No @/src/src paths found (migration was clean)
2. ✅ **Missing Barrel Exports**: Created 4 missing feature index.ts files:
   - src/features/settings/index.ts
   - src/features/permissions/index.ts
   - src/features/reports/index.ts
   - src/features/investments/index.ts
3. ✅ **API Route Imports**: Updated all app/api/* routes to use @/src/lib paths
4. ✅ **Server-only Modules**: Fixed lib/database/index.ts to not export supabase-server
5. ✅ **Client Directive**: Added 'use client' to use-card-actions.ts

#### Build Status
- ✅ `npm run build` - **PASS** ✅ (Compiled successfully in 11.5s)
- ✅ `npm run lint` - **PASS** ✅ (0 critical errors, ESLint warnings on 'any' types are acceptable)

#### Time Spent
- Started: Oct 24, 2025
- Completed: Oct 24, 2025
- Total: ~1 hour

#### Next: Phase 2 - Logic Centralization
Focus on consolidating utility functions, services, and hooks to eliminate redundancy.

---
