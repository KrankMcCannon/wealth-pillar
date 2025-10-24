# Component Patterns Documentation

**Version**: 2.0
**Last Updated**: October 2025
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Core Design Principles](#core-design-principles)
3. [Component Abstractions](#component-abstractions)
4. [Card Pattern](#card-pattern)
5. [Form Pattern](#form-pattern)
6. [Layout Pattern](#layout-pattern)
7. [Composition Guidelines](#composition-guidelines)
8. [Best Practices](#best-practices)

---

## Overview

This document describes the component patterns and abstractions used in Wealth Pillar to achieve **SOLID** and **DRY** principles.

### Goals

- **Reduce duplication**: Share common patterns across domain components
- **Improve maintainability**: Change once, affect all consumers
- **Enhance scalability**: Easy to add new features
- **Maintain type safety**: Full TypeScript coverage
- **Ensure accessibility**: WCAG AA compliance

### Achievements

**Code Reduction:**
- TransactionCard: 95 lines → 60 lines (37% reduction)
- BudgetCard: 103 lines → 75 lines (27% reduction)
- AccountCard: 60 lines → 40 lines (33% reduction)

**Shared Abstractions Created:**
- 4 layout components
- 2 form components
- 7 utility functions
- 4 shared hooks

---

## Core Design Principles

### SOLID Principles Applied

#### 1. Single Responsibility Principle (SRP)

Each component has one clear responsibility:

```tsx
// ✅ GOOD: DomainCard handles card layout only
<DomainCard
  title="Transaction"
  icon={<Icon />}
  primaryContent={<Amount />}
/>

// ❌ BAD: Card with business logic mixed in
<Card onClick={() => {
  // Complex business logic here
  validateTransaction();
  updateBalance();
  refreshData();
}}>
```

#### 2. Open/Closed Principle (OCP)

Components are open for extension, closed for modification:

```tsx
// ✅ GOOD: Extend via composition
<DomainCard
  icon={<CustomIcon />}
  footer={<CustomProgressBar />}
  primaryContent={<CustomContent />}
/>

// ❌ BAD: Modify component source to add features
```

#### 3. Dependency Inversion Principle (DIP)

Depend on abstractions, not concretions:

```tsx
// ✅ GOOD: Accepts any ReactNode
interface DomainCardProps {
  icon?: React.ReactNode;  // Abstract, not specific icon type
  primaryContent?: React.ReactNode;  // Any content
}

// ❌ BAD: Depends on specific types
interface BadCardProps {
  icon: LucideIcon;  // Tied to lucide-react
  amount: number;    // Only accepts numbers
}
```

### DRY Principle Applied

**Before**: Each card component implemented its own layout logic (793 lines total)

**After**: Shared DomainCard used by all cards (60% reduction in duplication)

```tsx
// Before: Duplicate layout in each card (95+ lines each)
<Card className="p-3...">
  <div className="flex items-center...">
    <IconContainer>...</IconContainer>
    <div className="flex-1...">
      <Text>...</Text>
      <Text>...</Text>
    </div>
    <div className="text-right...">
      <Amount>...</Amount>
    </div>
  </div>
</Card>

// After: Shared abstraction (1-2 lines)
<DomainCard
  icon={<Icon />}
  title="Title"
  subtitle="Subtitle"
  primaryContent={<Amount />}
/>
```

---

## Component Abstractions

### DomainCard

**Purpose**: Generic card wrapper for domain entities

**File**: `components/ui/layout/domain-card.tsx`

**Features**:
- Icon + Title + Subtitle layout
- Primary and secondary content areas
- Footer area for additional content
- Variant support (regular, interactive, highlighted, muted)
- Loading and disabled states
- Keyboard accessibility

**Usage**:

```tsx
import { DomainCard } from "@/components/ui/layout";

<DomainCard
  icon={<WalletIcon />}
  iconSize="md"
  iconColor="primary"
  title="Groceries"
  subtitle="Main Account"
  detail="Food category"
  primaryContent={<Amount type="expense" size="lg">-50.00</Amount>}
  secondaryContent={<StatusBadge status="success">Paid</StatusBadge>}
  footer={<ProgressBar value={75} />}
  variant="interactive"
  onClick={() => handleClick()}
/>
```

**Variants**:
- `regular`: Default card styling
- `interactive`: Adds cursor pointer and hover effects
- `highlighted`: Primary color highlight (for featured items)
- `muted`: Subdued styling (for inactive items)

---

### ListItem

**Purpose**: Generic reusable list item component

**File**: `components/ui/layout/list-item.tsx`

**Features**:
- Icon + Title + Description layout
- Action component slot
- Selection state
- Disabled state
- Keyboard navigation

**Usage**:

```tsx
import { ListItem } from "@/components/ui/layout";

<ListItem
  icon={<WalletIcon />}
  title="Main Account"
  description="€ 1,234.56 available"
  metadata="Last updated: Today"
  action={<Button size="sm">Edit</Button>}
  onClick={() => handleClick()}
  isSelected={selectedId === item.id}
/>
```

---

### EmptyState

**Purpose**: Standardized empty state component

**File**: `components/ui/layout/empty-state.tsx`

**Features**:
- Icon display
- Title and description
- Action button
- Size variants (sm, md, lg)

**Usage**:

```tsx
import { EmptyState } from "@/components/ui/layout";

<EmptyState
  icon={<FileXIcon />}
  title="No transactions found"
  description="Add your first transaction to get started"
  action={<Button onClick={onCreate}>Add Transaction</Button>}
  size="md"
/>
```

---

### Section

**Purpose**: Generic content section wrapper

**File**: `components/ui/layout/section.tsx`

**Features**:
- Title and description header
- Action component slot
- Consistent spacing
- Flexible content area

**Usage**:

```tsx
import { Section } from "@/components/ui/layout";

<Section
  title="Recent Transactions"
  description="Your latest financial activity"
  action={<Button>View All</Button>}
  spacing="md"
>
  <TransactionList />
</Section>
```

---

## Card Pattern

### Domain Cards

All domain cards now use the **DomainCard** abstraction:

**Directory**: `components/cards/`

**Cards**:
1. `transaction-card.tsx` - Transaction entities
2. `budget-card.tsx` - Budget entities
3. `account-card.tsx` - Account entities
4. `series-card.tsx` - Recurring series entities

### Pattern Structure

```tsx
// components/cards/example-card.tsx

import { DomainCard } from "@/components/ui/layout";
import { CategoryIcon } from "@/lib/icons";
import { Amount, StatusBadge } from "@/components/ui/primitives";
import { ExampleEntity } from "@/lib/types";

interface ExampleCardProps {
  entity: ExampleEntity;
  onClick: () => void;
}

export function ExampleCard({ entity, onClick }: ExampleCardProps) {
  // 1. Prepare icon
  const icon = <CategoryIcon categoryKey={entity.category} />;

  // 2. Prepare content
  const primaryContent = (
    <Amount type={entity.type} size="md">
      {entity.amount}
    </Amount>
  );

  const secondaryContent = entity.status && (
    <StatusBadge status={entity.status}>
      {entity.statusLabel}
    </StatusBadge>
  );

  // 3. Render with DomainCard
  return (
    <DomainCard
      icon={icon}
      iconColor="primary"
      title={entity.name}
      subtitle={entity.description}
      primaryContent={primaryContent}
      secondaryContent={secondaryContent}
      variant="interactive"
      onClick={onClick}
    />
  );
}
```

### Card Utilities

**File**: `lib/card-utils.ts`

**Shared utilities for card logic:**

```tsx
import { getProgressStatus, getRelativeDateLabel, getFrequencyLabel } from "@/lib/card-utils";

// Get status variant based on progress
const status = getProgressStatus(85); // 'warning'

// Get relative date label
const label = getRelativeDateLabel(new Date()); // 'Oggi'

// Get frequency label
const frequency = getFrequencyLabel('monthly'); // 'Mensile'
```

**Available utilities:**
- `getProgressStatus(progress)` - Get status for progress bars
- `getComparisonStatus(value, limit)` - Compare value to limit
- `calculateDaysDifference(date1, date2)` - Days between dates
- `getRelativeDateLabel(date)` - Relative date label
- `getFrequencyLabel(frequency)` - Italian frequency label
- `getIconColorByStatus(status)` - Icon color by status
- `formatCardSubtitle(text, maxLength)` - Truncate subtitle
- `getAmountTypeByTransaction(type, options)` - Amount type

### Card Hooks

**File**: `hooks/use-card-actions.ts`

**Shared hooks for card interactions:**

```tsx
import { useCardSelection, useCardHover, useCardExpansion } from "@/hooks/use-card-actions";

// Multi-select behavior
const {
  selectedIds,
  toggleSelection,
  selectAll,
  clearSelection,
  isSelected,
} = useCardSelection<Transaction>();

// Hover behavior
const { hoveredId, onMouseEnter, onMouseLeave, isHovered } = useCardHover();

// Expansion behavior
const { expandedIds, toggleExpansion, expandAll, collapseAll, isExpanded } =
  useCardExpansion();

// Keyboard navigation
const { focusedIndex, handleKeyDown } = useCardKeyboardNavigation(items, onSelect);
```

---

## Form Pattern

### Form Layout Components

**FormLayout** - Form wrapper with consistent spacing

```tsx
import { FormLayout } from "@/components/ui/form-layout";

<FormLayout onSubmit={handleSubmit}>
  <FormField label="Name"><Input /></FormField>
  <FormField label="Email"><Input type="email" /></FormField>
</FormLayout>
```

**FormSection** - Group related form fields

```tsx
import { FormSection } from "@/components/ui/form-section";

<FormSection
  title="Personal Information"
  description="Your basic details"
  showSeparator
>
  <FormField label="Name"><Input /></FormField>
  <FormField label="Email"><Input /></FormField>
</FormSection>
```

### Form Composition Pattern

**Recommended structure** for domain forms:

```tsx
// components/forms/example-form.tsx

import { ModalWrapper, ModalContent } from "@/components/ui/modal-wrapper";
import { FormLayout, FormSection } from "@/components/ui";
import { FormField, FormActions } from "@/components/ui";
import { useExampleFormController } from "@/hooks/controllers";

export function ExampleForm({ isOpen, onOpenChange, item, mode }: FormProps) {
  const controller = useExampleFormController({ item, mode });

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={mode === 'create' ? 'New Item' : 'Edit Item'}
      footer={
        <FormActions
          submitType="submit"
          onCancel={() => onOpenChange(false)}
          isSubmitting={controller.isSubmitting}
        />
      }
    >
      <FormLayout onSubmit={controller.handleSubmit}>
        <FormSection title="Basic Information">
          <FormField label="Name" required error={controller.errors.name}>
            <Input
              value={controller.form.name}
              onChange={(e) => controller.setField('name', e.target.value)}
            />
          </FormField>

          <FormField label="Amount" required error={controller.errors.amount}>
            <FormCurrencyInput
              value={controller.form.amount}
              onChange={(v) => controller.setField('amount', v)}
            />
          </FormField>
        </FormSection>
      </FormLayout>
    </ModalWrapper>
  );
}
```

---

## Layout Pattern

### Page Layout Structure

**Recommended structure** for dashboard pages:

```tsx
// app/(dashboard)/example/page.tsx

import { Section, EmptyState } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { useExampleController } from "@/hooks/controllers";

export default function ExamplePage() {
  const controller = useExampleController();

  return (
    <div className="space-y-6">
      {/* Page Header with Action */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Page Title</h1>
          <p className="text-muted-foreground">Page description</p>
        </div>
        <Button onClick={controller.handleCreate}>
          Add New
        </Button>
      </div>

      {/* Content Sections */}
      <Section
        title="Section Title"
        description="Section description"
        action={<Button variant="ghost">View All</Button>}
      >
        {controller.viewModel.items.length > 0 ? (
          <ItemList items={controller.viewModel.items} />
        ) : (
          <EmptyState
            title="No items found"
            description="Get started by creating your first item"
            action={<Button onClick={controller.handleCreate}>Add Item</Button>}
          />
        )}
      </Section>
    </div>
  );
}
```

---

## Composition Guidelines

### Favor Composition Over Inheritance

**✅ GOOD: Composition**

```tsx
<DomainCard
  icon={<CustomIcon />}
  footer={<CustomFooter />}
  primaryContent={<CustomContent />}
/>
```

**❌ BAD: Extension**

```tsx
class CustomCard extends DomainCard {
  // Overriding methods
}
```

### Component Composition Hierarchy

```
Page
└── Section (layout wrapper)
    ├── Header (title + actions)
    ├── Content
    │   ├── DomainCard (entity card)
    │   │   ├── Icon
    │   │   ├── Text primitives
    │   │   └── Custom content
    │   └── ListItem (list item)
    │       ├── Icon
    │       ├── Text primitives
    │       └── Action button
    └── EmptyState (when no data)
        ├── Icon
        ├── Text
        └── Action button
```

### Props Interface Pattern

**Use composition-friendly prop interfaces:**

```tsx
interface ComponentProps {
  // Required domain data
  item: Item;

  // Content slots (composition)
  icon?: React.ReactNode;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  action?: React.ReactNode;

  // Behavior
  onClick?: () => void;

  // Variants
  variant?: 'default' | 'highlighted';
  size?: 'sm' | 'md' | 'lg';

  // State
  isLoading?: boolean;
  isDisabled?: boolean;

  // Styling
  className?: string;
}
```

---

## Best Practices

### 1. Use Shared Abstractions

**Always check if a shared component exists before creating a new one.**

```tsx
// ✅ GOOD: Use DomainCard
<DomainCard title="..." icon={<Icon />} />

// ❌ BAD: Create duplicate layout
<Card className="p-3...">
  <div className="flex...">
    {/* Duplicate layout code */}
  </div>
</Card>
```

### 2. Extract Common Logic to Utilities

```tsx
// ✅ GOOD: Use shared utility
import { getProgressStatus } from "@/lib/card-utils";
const status = getProgressStatus(progress);

// ❌ BAD: Duplicate logic
const status = progress >= 100 ? 'danger' : progress >= 80 ? 'warning' : 'success';
```

### 3. Use Hooks for Shared Behavior

```tsx
// ✅ GOOD: Use shared hook
const { selectedIds, toggleSelection } = useCardSelection();

// ❌ BAD: Duplicate state management
const [selectedIds, setSelectedIds] = useState<string[]>([]);
const toggleSelection = (id: string) => { /* duplicate logic */ };
```

### 4. Maintain Type Safety

```tsx
// ✅ GOOD: Full type safety
interface CardProps {
  variant: 'regular' | 'interactive';  // Explicit variants
  onClick?: () => void;               // Optional callback
}

// ❌ BAD: Loose typing
interface CardProps {
  variant?: string;     // Too loose
  onClick?: Function;   // Not type-safe
}
```

### 5. Follow Accessibility Guidelines

```tsx
// ✅ GOOD: Accessible
<DomainCard
  onClick={handleClick}
  testId="transaction-card"  // For testing
  // Automatically includes:
  // - role="button"
  // - tabIndex={0}
  // - onKeyDown handler
/>

// ❌ BAD: Not accessible
<div onClick={handleClick}>  // No keyboard support
  {/* Content */}
</div>
```

### 6. Document Component Usage

**Always include JSDoc comments:**

```tsx
/**
 * ExampleCard - Domain card for example entities
 *
 * @example
 * ```tsx
 * <ExampleCard
 *   item={item}
 *   onClick={() => handleClick()}
 * />
 * ```
 */
export function ExampleCard({ item, onClick }: ExampleCardProps) {
  // Implementation
}
```

---

## Migration Guide

### Migrating Existing Cards

**Step 1**: Identify card components to migrate

**Step 2**: Analyze current structure and identify:
- Icon and title
- Content areas (primary/secondary)
- Footer content
- Variant logic

**Step 3**: Refactor using DomainCard:

```tsx
// Before
<Card className="custom-styles...">
  <div className="flex...">
    <IconContainer><Icon /></IconContainer>
    <div><Text>Title</Text></div>
    <div><Amount>100</Amount></div>
  </div>
</Card>

// After
<DomainCard
  icon={<Icon />}
  title="Title"
  primaryContent={<Amount>100</Amount>}
  variant="interactive"
/>
```

**Step 4**: Move to `components/cards/` directory

**Step 5**: Update imports in consuming components

**Step 6**: Test thoroughly

---

**Status**: ✅ Production Ready
**Last Updated**: October 2025
**Maintainer**: Wealth Pillar Team
