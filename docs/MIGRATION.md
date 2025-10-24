# Component Refactoring Migration Guide

**Version**: 1.0
**Last Updated**: October 2025

---

## Overview

This guide helps you migrate from old component patterns to the new refactored structure following SOLID and DRY principles.

---

## Breaking Changes

### Directory Structure Changes

**Old Structure:**
```
components/
├── transaction-card.tsx
├── budget-card.tsx
├── bank-account-card.tsx
├── recurring-series-card.tsx
└── ui/
    └── ...
```

**New Structure:**
```
components/
├── cards/                  # NEW: All domain cards
│   ├── transaction-card.tsx
│   ├── budget-card.tsx
│   ├── account-card.tsx   # RENAMED from bank-account-card
│   └── series-card.tsx    # RENAMED from recurring-series-card
├── ui/
│   └── layout/            # NEW: Layout components
│       ├── domain-card.tsx
│       ├── list-item.tsx
│       ├── empty-state.tsx
│       └── section.tsx
└── ...
```

### Import Path Changes

#### Domain Cards

**Old:**
```tsx
import { TransactionCard } from "@/components/transaction-card";
import { BudgetCard } from "@/components/budget-card";
import { BankAccountCard } from "@/components/bank-account-card";
import { RecurringSeriesCard } from "@/components/recurring-series-card";
```

**New:**
```tsx
import { TransactionCard, BudgetCard, AccountCard, SeriesCard } from "@/components/cards";
// or individually:
import { TransactionCard } from "@/components/cards/transaction-card";
```

#### Layout Components

**New imports available:**
```tsx
import {
  DomainCard,
  ListItem,
  EmptyState,
  Section
} from "@/components/ui/layout";
```

#### Form Components

**New imports available:**
```tsx
import { FormLayout } from "@/components/ui/form-layout";
import { FormSection } from "@/components/ui/form-section";
```

### Component Renames

| Old Name | New Name | Location |
|----------|----------|----------|
| `BankAccountCard` | `AccountCard` | `components/cards/account-card.tsx` |
| `RecurringSeriesCard` | `SeriesCard` | `components/cards/series-card.tsx` |

---

## Migration Steps

### Step 1: Update Imports

**Find and replace** across your codebase:

```bash
# BankAccountCard → AccountCard
find . -type f -name "*.tsx" -exec sed -i '' 's/BankAccountCard/AccountCard/g' {} +
find . -type f -name "*.tsx" -exec sed -i '' 's/@\/components\/bank-account-card/@\/components\/cards\/account-card/g' {} +

# RecurringSeriesCard → SeriesCard
find . -type f -name "*.tsx" -exec sed -i '' 's/RecurringSeriesCard/SeriesCard/g' {} +
find . -type f -name "*.tsx" -exec sed -i '' 's/@\/components\/recurring-series-card/@\/components\/cards\/series-card/g' {} +

# TransactionCard
find . -type f -name "*.tsx" -exec sed -i '' 's/@\/components\/transaction-card/@\/components\/cards\/transaction-card/g' {} +

# BudgetCard
find . -type f -name "*.tsx" -exec sed -i '' 's/@\/components\/budget-card/@\/components\/cards\/budget-card/g' {} +
```

**Or use barrel exports:**

```tsx
// Instead of individual imports, use:
import { TransactionCard, BudgetCard, AccountCard, SeriesCard } from "@/components/cards";
```

### Step 2: Update Component Usage

The refactored components maintain the same props interface, so most usage should work without changes.

**Example - TransactionCard:**

```tsx
// Before and After - Same props interface
<TransactionCard
  transaction={transaction}
  accountNames={accountNames}
  variant="regular"
  onClick={() => handleClick()}
/>
```

**Example - BankAccountCard → AccountCard:**

```tsx
// Before
import { BankAccountCard } from "@/components/bank-account-card";

<BankAccountCard
  account={account}
  accountBalance={balance}
  onClick={handleClick}
/>

// After
import { AccountCard } from "@/components/cards";

<AccountCard
  account={account}
  accountBalance={balance}
  onClick={handleClick}
/>
```

### Step 3: Adopt New Patterns (Optional but Recommended)

#### Using DomainCard for Custom Cards

If you have custom card components, consider migrating them to use **DomainCard**:

**Before:**
```tsx
export function CustomCard({ item, onClick }: Props) {
  return (
    <Card className="p-3 bg-card hover:shadow-lg cursor-pointer">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <IconContainer size="md" color="primary">
            <WalletIcon className="h-5 w-5" />
          </IconContainer>
          <div>
            <Text variant="heading" size="sm">{item.name}</Text>
            <Text variant="muted" size="xs">{item.description}</Text>
          </div>
        </div>
        <Amount type="income" size="md">{item.amount}</Amount>
      </div>
    </Card>
  );
}
```

**After:**
```tsx
import { DomainCard } from "@/components/ui/layout";

export function CustomCard({ item, onClick }: Props) {
  return (
    <DomainCard
      icon={<WalletIcon className="h-5 w-5" />}
      iconColor="primary"
      title={item.name}
      subtitle={item.description}
      primaryContent={<Amount type="income" size="md">{item.amount}</Amount>}
      variant="interactive"
      onClick={onClick}
    />
  );
}
```

**Benefits:**
- 40-60% less code
- Consistent styling across all cards
- Built-in accessibility
- Keyboard navigation support
- Loading and disabled states

#### Using Shared Utilities

Replace duplicate logic with shared utilities:

**Before:**
```tsx
const status = progress >= 100 ? 'danger' : progress >= 80 ? 'warning' : 'success';
```

**After:**
```tsx
import { getProgressStatus } from "@/lib/card-utils";
const status = getProgressStatus(progress);
```

**Available utilities** in `lib/card-utils.ts`:
- `getProgressStatus(progress)`
- `getComparisonStatus(value, limit)`
- `calculateDaysDifference(date1, date2)`
- `getRelativeDateLabel(date)`
- `getFrequencyLabel(frequency)`
- `getIconColorByStatus(status)`
- `formatCardSubtitle(text, maxLength)`
- `getAmountTypeByTransaction(type, options)`

#### Using Shared Hooks

Replace duplicate state management with shared hooks:

**Before:**
```tsx
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const toggleSelection = (id: string) => {
  setSelectedIds(prev =>
    prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
  );
};
```

**After:**
```tsx
import { useCardSelection } from "@/hooks/use-card-actions";
const { selectedIds, toggleSelection, selectAll, clearSelection } = useCardSelection();
```

**Available hooks** in `hooks/use-card-actions.ts`:
- `useCardSelection<T>()` - Multi-select behavior
- `useCardHover()` - Hover state management
- `useCardExpansion()` - Expandable cards
- `useCardKeyboardNavigation()` - Keyboard navigation

#### Using FormLayout and FormSection

Migrate forms to use new layout components:

**Before:**
```tsx
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-4">
    <FormField label="Name"><Input /></FormField>
    <FormField label="Email"><Input /></FormField>
  </div>
  <Separator className="my-6" />
  <div className="space-y-4">
    <FormField label="Amount"><Input /></FormField>
  </div>
</form>
```

**After:**
```tsx
import { FormLayout, FormSection } from "@/components/ui";

<FormLayout onSubmit={handleSubmit}>
  <FormSection title="Basic Info">
    <FormField label="Name"><Input /></FormField>
    <FormField label="Email"><Input /></FormField>
  </FormSection>

  <FormSection title="Financial Info" showSeparator>
    <FormField label="Amount"><Input /></FormField>
  </FormSection>
</FormLayout>
```

---

## Verification Steps

### 1. Build Test

After migration, ensure your project builds without errors:

```bash
npm run build
```

Expected output:
```
✓ Compiled successfully
```

### 2. Type Check

Verify TypeScript types are correct:

```bash
npx tsc --noEmit
```

Expected output:
```
No errors found
```

### 3. Visual Regression Test

Test each page manually to ensure:
- Cards render correctly
- Hover states work
- Click handlers function
- Responsive design maintained
- Accessibility features intact

### 4. Import Resolution

Check that all imports resolve correctly:

```bash
npm run lint
```

Look for errors like:
```
Cannot find module '@/components/bank-account-card'
```

Fix by updating to new paths:
```
import { AccountCard } from "@/components/cards";
```

---

## Gradual Migration Strategy

You can migrate gradually without breaking existing functionality:

### Phase 1: Install New Components (Non-Breaking)

1. New components are already in place
2. Old components still work
3. No breaking changes yet

### Phase 2: Update Imports (Safe)

1. Update imports to use new paths
2. Test each page after updating
3. Keep old components as fallback

### Phase 3: Adopt New Patterns (Optional)

1. Refactor custom cards to use DomainCard
2. Replace duplicate logic with utilities
3. Use shared hooks for behavior

### Phase 4: Cleanup (Final)

1. Remove old component files (after verifying all references updated)
2. Remove duplicate utilities
3. Update documentation

---

## Troubleshooting

### Issue: Cannot find module '@/components/transaction-card'

**Solution**: Update import to new path:
```tsx
import { TransactionCard } from "@/components/cards";
```

### Issue: BankAccountCard is not defined

**Solution**: Component was renamed to AccountCard:
```tsx
import { AccountCard } from "@/components/cards";
<AccountCard account={account} ... />
```

### Issue: Build fails with "duplicate identifier"

**Solution**: Check for duplicate imports:
```tsx
// ❌ BAD
import { TransactionCard } from "@/components/transaction-card";
import { TransactionCard } from "@/components/cards";

// ✅ GOOD
import { TransactionCard } from "@/components/cards";
```

### Issue: Cards look different after migration

**Solution**: The refactored cards should look identical. If they don't:
1. Check if you're using custom className overrides
2. Verify icon sizes match (use iconSize prop)
3. Ensure variant prop is set correctly

### Issue: TypeScript errors after migration

**Solution**: Ensure you're using the correct prop interfaces. The refactored components maintain backward compatibility, but check for:
- Renamed components (BankAccountCard → AccountCard)
- Import paths (old → new)
- Prop types (should be the same)

---

## Rollback Plan

If you encounter critical issues and need to rollback:

### Option 1: Git Revert

```bash
git revert <commit-hash>
git push
```

### Option 2: Keep Old Components Temporarily

The old component files can coexist with new ones:

1. Keep old files in place
2. Revert import changes
3. Investigate and fix issues
4. Re-migrate when ready

---

## Support

If you encounter issues during migration:

1. Check this migration guide
2. Review [COMPONENT-PATTERNS.md](./COMPONENT-PATTERNS.md)
3. Check [UI-SYSTEM.md](./UI-SYSTEM.md) for component documentation
4. Consult with the team

---

**Migration Checklist:**

- [ ] Update all card component imports
- [ ] Rename BankAccountCard → AccountCard
- [ ] Rename RecurringSeriesCard → SeriesCard
- [ ] Test build (`npm run build`)
- [ ] Test type check (`npx tsc --noEmit`)
- [ ] Visual regression test all pages
- [ ] (Optional) Migrate custom cards to DomainCard
- [ ] (Optional) Replace duplicate logic with utilities
- [ ] (Optional) Use shared hooks
- [ ] Update team documentation
- [ ] Remove old component files (after verification)

---

**Status**: ✅ Ready for Migration
**Last Updated**: October 2025
