# UI System Documentation

**Version**: 2.0
**Last Updated**: October 2025
**Status**: ✅ Production Ready

---

## Table of Contents

1. [Overview](#overview)
2. [Design System](#design-system)
3. [Component Library](#component-library)
4. [Form System](#form-system)
5. [Modal System](#modal-system)
6. [Styling Guidelines](#styling-guidelines)
7. [Setup & Configuration](#setup--configuration)

---

## Overview

### Technology Stack

- **Framework**: Next.js 15 + React 18
- **Styling**: Tailwind CSS v4 with `@theme` directive
- **UI Library**: Radix UI primitives
- **Component Variants**: Class Variance Authority (CVA)
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Typography**: Spline Sans (custom font)

### Architecture Philosophy

The Wealth Pillar UI system follows these principles:

1. **Single Source of Truth** - All design tokens in `app/globals.css`
2. **Zero Hardcoded Styles** - Everything references design tokens
3. **Type-Safe Variants** - CVA for consistent component variations
4. **Accessibility First** - WCAG AA compliant, keyboard navigation
5. **Mobile-First** - Responsive design with touch-friendly interactions
6. **Performance** - Optimized CSS, minimal runtime overhead

---

## Design System

### OKLCH Color System

We use the OKLCH color space for perceptually uniform colors:

```css
/* Format: oklch(Lightness Chroma Hue / Alpha) */
--color-primary: oklch(0.595 0.178 270);  /* Brand purple #7678E4 */
```

**Benefits**:
- Perceptual uniformity (colors appear equally bright)
- Better accessibility (easier to maintain contrast ratios)
- Smooth gradients (no color banding)
- Wide color gamut (Display P3 support)

### Design Tokens

All tokens defined in `app/globals.css` using the `@theme` directive:

#### Primary Colors

```css
--color-primary: oklch(0.595 0.178 270);           /* #7678E4 - Brand purple */
--color-primary-foreground: oklch(1 0 0);          /* White text on primary */
--color-secondary: oklch(0.68 0.08 235);           /* Steel blue */
--color-accent: oklch(0.71 0.07 185);              /* Mint green */
```

#### Semantic Colors

```css
/* Backgrounds */
--color-background: oklch(0.94 0.008 90);          /* Page background */
--color-card: oklch(0.99 0 0);                     /* Soft white for cards */
--color-muted: oklch(0.88 0.008 90);               /* Muted backgrounds */

/* Text */
--color-foreground: oklch(0.25 0.015 90);          /* Primary text */
--color-muted-foreground: oklch(0.50 0.010 90);    /* Secondary text */

/* Borders & States */
--color-border: oklch(0.85 0.008 90);              /* Standard borders */
--color-destructive: oklch(0.55 0.22 25);          /* Error/delete states */
--color-warning: oklch(0.75 0.15 85);              /* Warning states */
--color-success: oklch(0.65 0.15 155);             /* Success states */
```

#### Financial Colors

```css
/* Used specifically for financial data */
.text-finance-positive   /* Green - gains, income */
.text-finance-negative   /* Red - losses, expenses */
.text-finance-warning    /* Amber - approaching limits */
.text-finance-neutral    /* Steel blue - neutral data */
```

### Typography

**Font Stack**:
```css
--font-sans: var(--font-spline-sans), system-ui, -apple-system, sans-serif;
```

**Font Smoothing**:
```css
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
```

**Usage Guidelines**:
- **Headings**: `font-semibold` (600) or `font-bold` (700)
- **Body text**: Default weight (400)
- **Labels**: `font-medium` (500)
- **Numbers/Data**: `font-mono` for better readability

### Spacing & Layout

Tailwind's default spacing scale (0.25rem increments):

| Class | Value | Usage |
|-------|-------|-------|
| `gap-1` | 0.25rem | Tight spacing |
| `gap-2` | 0.5rem | Default icon-text gap |
| `gap-3` | 0.75rem | Section spacing |
| `gap-4` | 1rem | Card padding |
| `gap-6` | 1.5rem | Component separation |
| `gap-8` | 2rem | Section separation |

### Border Radius

```css
--radius-sm: 0.5rem;   /* 8px - Small elements */
--radius-md: 0.75rem;  /* 12px - Medium elements */
--radius-lg: 1rem;     /* 16px - Cards, dialogs */
--radius-xl: 1.5rem;   /* 24px - Large cards */
```

**Usage**:
- **Buttons**: `rounded-xl` (1rem)
- **Cards**: `rounded-xl` (1rem)
- **Inputs**: `rounded-md` (0.75rem)
- **Dialogs**: `rounded-3xl` (1.5rem+)
- **Badges**: `rounded-full`

### Shadows

```css
--shadow-xs:  0 1px 2px 0 oklch(0% 0 0 / 0.05);
--shadow-sm:  0 1px 3px 0 oklch(0% 0 0 / 0.1);
--shadow-md:  0 4px 6px -1px oklch(0% 0 0 / 0.1);
--shadow-lg:  0 10px 15px -3px oklch(0% 0 0 / 0.1);
--shadow-xl:  0 20px 25px -5px oklch(0% 0 0 / 0.1);
```

**Usage**:
- **Cards at rest**: `shadow-sm`
- **Dropdowns/inputs**: `shadow-md`
- **Modals/dialogs**: `shadow-lg`
- **Notifications**: `shadow-xl`

---

## Component Library

### Primitive Components

Located in `components/ui/primitives/` - atomic, reusable building blocks.

#### Text

**File**: `primitives/text.tsx`

```typescript
interface TextProps {
  variant: 'heading' | 'body' | 'muted' | 'emphasis' | 'subtle' | 'primary';
  size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  as?: 'p' | 'span' | 'div' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'label';
  className?: string;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
import { Text } from "@/components/ui/primitives";

<Text variant="heading" size="xl">Page Title</Text>
<Text variant="muted" size="sm">Helper text</Text>
<Text variant="primary" as="h2">Section Title</Text>
```

#### IconContainer

**File**: `primitives/icon-container.tsx`

```typescript
interface IconContainerProps {
  size: 'sm' | 'md' | 'lg' | 'xl';
  color: 'primary' | 'warning' | 'destructive' | 'success' | 'muted' | 'accent';
  className?: string;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
import { IconContainer } from "@/components/ui/primitives";
import { WalletIcon } from "lucide-react";

<IconContainer size="md" color="primary">
  <WalletIcon className="h-6 w-6" />
</IconContainer>
```

**Sizes**:
- `sm`: 2rem (32px)
- `md`: 2.75rem (44px)
- `lg`: 3.5rem (56px)
- `xl`: 4rem (64px)

#### StatusBadge

**File**: `primitives/status-badge.tsx`

```typescript
interface StatusBadgeProps {
  status: 'success' | 'warning' | 'danger' | 'neutral' | 'info';
  size: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
  children: React.ReactNode;
}
```

**Usage**:
```tsx
import { StatusBadge } from "@/components/ui/primitives";

<StatusBadge status="success" showDot>Active</StatusBadge>
<StatusBadge status="warning" size="sm">78%</StatusBadge>
```

#### Amount

**File**: `primitives/amount.tsx`

```typescript
interface AmountProps {
  type: 'income' | 'expense' | 'transfer' | 'balance' | 'neutral';
  size: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  emphasis: 'default' | 'strong' | 'subtle';
  currency?: boolean; // default: true
  className?: string;
  children: number;
}
```

**Usage**:
```tsx
import { Amount } from "@/components/ui/primitives";

<Amount type="income" size="lg">1234.56</Amount>
<Amount type="expense" emphasis="strong">-567.89</Amount>
```

**Automatic Formatting**:
- Adds € symbol by default
- Formats with IT locale (1.234,56)
- Colors based on type (green/red/neutral)

### UI Components

#### Button

**File**: `ui/button.tsx`

**Variants**:
```tsx
<Button variant="default">Primary</Button>
<Button variant="outline">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="link">Learn More</Button>
```

**Sizes**: `sm` | `md` | `lg` | `icon`

**Built-in Features**:
- ✅ Focus-visible ring
- ✅ Disabled states
- ✅ Loading states
- ✅ Icon support
- ✅ aria-invalid support

#### Input

**File**: `ui/input.tsx`

```tsx
<Input
  type="text"
  placeholder="Enter value..."
  className="focus-visible:border-primary"
/>
```

**Features**:
- ✅ Focus ring states
- ✅ Error states (aria-invalid)
- ✅ Disabled states
- ✅ Icon slots (left/right)

#### Select

**File**: `ui/select.tsx`

Based on Radix UI Select primitive.

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<Select value={value} onValueChange={setValue}>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

**Features**:
- ✅ Keyboard navigation
- ✅ Search/filter support
- ✅ Icon support
- ✅ Empty state handling

#### Card

**File**: `ui/card.tsx`

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

**Variants** (via CVA):
```tsx
import { cardVariants } from "@/lib/ui-variants";

<div className={cardVariants({ variant: "interactive", padding: "lg" })}>
  Card content
</div>
```

- `variant`: `default` | `elevated` | `flat` | `interactive` | `glass`
- `padding`: `none` | `sm` | `md` | `lg`

#### Dialog / Modal

**File**: `ui/dialog.tsx`

Based on Radix UI Dialog primitive.

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";

<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <div>Content</div>
    <DialogFooter>
      <Button>Action</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

**Features**:
- ✅ Focus trap
- ✅ Escape to close
- ✅ Click outside to close
- ✅ Accessible (ARIA)
- ✅ Portal rendering

#### Drawer

**File**: `ui/drawer.tsx`

Mobile-friendly drawer component (Vaul library).

```tsx
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";

<Drawer open={open} onOpenChange={setOpen}>
  <DrawerContent>
    <DrawerHeader>
      <DrawerTitle>Title</DrawerTitle>
    </DrawerHeader>
    <div>Content</div>
  </DrawerContent>
</Drawer>
```

**Use Case**: Mobile bottom sheets, side panels

#### Checkbox, RadioGroup, Switch

All based on Radix UI primitives with consistent styling:

```tsx
<Checkbox checked={checked} onCheckedChange={setChecked} />
<Switch checked={enabled} onCheckedChange={setEnabled} />
```

#### ScrollArea

**File**: `components/ui/scroll-area.tsx`

Radix UI ScrollArea for custom-styled scrollable regions.

```tsx
<ScrollArea className="h-[300px] w-full">
  <div className="p-4">
    {/* Scrollable content */}
  </div>
</ScrollArea>
```

**Features**:
- ✅ Styled scrollbars (better than native)
- ✅ Cross-browser consistency
- ✅ Smooth scrolling
- ✅ Vertical and horizontal support
- ✅ Touch-friendly
- ✅ Lightweight wrapper

**Usage in Popovers**:
```tsx
// Fixed header + scrollable content
<PopoverContent className="w-[320px] p-0">
  <div className="p-3 border-b">
    <Input placeholder="Search..." />
  </div>
  <ScrollArea className="h-[300px]">
    <div className="p-3">
      {/* Long list of items */}
    </div>
  </ScrollArea>
</PopoverContent>
```

**Best Practices**:
- Always set explicit height (h-[300px], max-h-[400px], etc.)
- Wrap content in div for proper padding
- Use in Popovers, Modals, Sidebars
- Prefer over `overflow-y-scroll` for better UX

#### Badge, Tabs, Tooltip

See respective files in `components/ui/` - all follow same patterns:
- ✅ Design token usage
- ✅ CVA variants where applicable
- ✅ Focus states
- ✅ Accessible

#### Popover

**File**: `components/ui/popover.tsx`

Floating content component built on Radix UI Popover primitive.

```tsx
<Popover>
  <PopoverTrigger asChild>
    <Button>Open</Button>
  </PopoverTrigger>
  <PopoverContent className="w-80">
    <ScrollArea className="max-h-[300px]">
      Content here
    </ScrollArea>
  </PopoverContent>
</Popover>
```

**Features**:
- ✅ Collision detection and auto-positioning
- ✅ Smooth animations (fade + zoom + slide)
- ✅ Keyboard accessible (Esc to close)
- ✅ Click outside to dismiss
- ✅ Focus management
- ✅ Portal rendering (prevents overflow issues)
- ✅ Max dimensions to prevent viewport overflow
- ✅ Responsive positioning with `collisionPadding`

**Best Practices for Scrollable Content**:

```tsx
// ✅ DO: Wrap scrollable content in ScrollArea
<PopoverContent className="w-[320px] p-0">
  <div className="p-3 border-b">
    <Input placeholder="Search..." />
  </div>
  <ScrollArea className="h-[300px]">
    <div className="p-3">
      {/* Scrollable content */}
    </div>
  </ScrollArea>
</PopoverContent>

// ❌ DON'T: Use native overflow-y-scroll
<PopoverContent className="w-[320px] overflow-y-scroll">
  {/* Content - poor scrollbar styling */}
</PopoverContent>
```

**Common Props**:
- `align`: "start" | "center" | "end" - Horizontal alignment
- `side`: "top" | "right" | "bottom" | "left" - Positioning side
- `sideOffset`: Number - Distance from trigger (default: 4)
- `collisionPadding`: Number - Padding from viewport edges (default: 10)

**Usage Examples**:
- FormDatePicker: Calendar popup with ScrollArea
- IconPicker: Searchable icon grid with ScrollArea
- FilterDialog: Complex filtering UI

---

## Form System

### Architecture

**Layers**:
1. **Services** - Pure business logic (validation, state management)
2. **Controllers** - React hooks (orchestration, mutations)
3. **UI Components** - Presentation-only form fields

### Form Validation Service

**File**: `lib/services/form-validation.service.ts`

#### Validation Rules

```typescript
// Built-in rules
const rules = {
  required: (message?: string) => ValidatorFn;
  minLength: (min: number, message?: string) => ValidatorFn;
  maxLength: (max: number, message?: string) => ValidatorFn;
  positiveAmount: (message?: string) => ValidatorFn;
  validDate: (message?: string) => ValidatorFn;
  dateNotInFuture: (message?: string) => ValidatorFn;
  email: (message?: string) => ValidatorFn;
  pattern: (regex: RegExp, message?: string) => ValidatorFn;
  arrayNotEmpty: (message?: string) => ValidatorFn;
  conditional: (condition: () => boolean, validator: ValidatorFn) => ValidatorFn;
};
```

#### Pre-built Schemas

```typescript
export const transactionValidationSchema = {
  user_id: [required('Seleziona un utente')],
  account_id: [required('Seleziona un conto')],
  amount: [required('Inserisci un importo'), positiveAmount()],
  date: [required('Seleziona una data'), validDate()],
  description: [required('Inserisci una descrizione'), minLength(2)],
  category: [required('Seleziona una categoria')],
  type: [required('Seleziona un tipo')],
};

export const budgetValidationSchema = { /* ... */ };
export const categoryValidationSchema = { /* ... */ };
export const recurringSeriesValidationSchema = { /* ... */ };
```

#### Validation Functions

```typescript
// Validate single field
const error = validateField(value, schema.field);

// Validate entire form
const errors = validateForm(formState, schema);

// Cross-field validation
const isValid = validateTransferTransaction(formState);
```

### Form State Service

**File**: `lib/services/form-state.service.ts`

#### State Management

```typescript
// Create form state
const formState = createFormState(initialValues, defaults);

// Update field (immutable)
const newState = updateFormField(formState, 'amount', 100);

// Update multiple fields
const newState = updateFormFields(formState, { amount: 100, date: '2025-01-01' });

// Check if dirty
const isDirty = isDirty(formState, initialState);
const dirtyFields = getDirtyFields(formState, initialState);
```

#### Transformation Utilities

```typescript
// Prefill defaults
const prefilled = prefillUserDefaults(formState, user);
const withAccount = prefillDefaultAccount(formState, user);
const withToday = prefillTodayDate(formState);

// Convert for API
const payload = formStateToPayload(formState);

// Parse from API
const formState = payloadToFormState(apiData);

// Sanitize before submit
const clean = sanitizeFormState(formState);
```

### Form Controllers

**Pattern**: React hooks that encapsulate form logic

**File**: `hooks/controllers/useTransactionFormController.ts` (example)

```typescript
export function useTransactionFormController({
  mode,
  initialType,
  selectedUserId,
  initialTransaction
}: ControllerOptions) {
  // 1. Initialize form state
  const [form, setForm] = useState(() => createInitialState());

  // 2. Validation state
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 3. Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 4. Mutations
  const createMutation = useCreateTransaction();
  const updateMutation = useUpdateTransaction();

  // 5. Field updater
  const setField = useCallback((key: string, value: any) => {
    setForm(prev => updateFormField(prev, key, value));
    // Optionally validate on change
    const error = validateFieldByName(key, value, transactionValidationSchema);
    if (error) {
      setErrors(prev => ({ ...prev, [key]: error }));
    } else {
      setErrors(prev => {
        const { [key]: removed, ...rest } = prev;
        return rest;
      });
    }
  }, []);

  // 6. Submit handler
  const submit = useCallback(async () => {
    setIsSubmitting(true);

    // Validate entire form
    const validationErrors = validateForm(form, transactionValidationSchema);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    // Sanitize and convert to payload
    const payload = formStateToPayload(sanitizeFormState(form));

    try {
      if (mode === 'create') {
        await createMutation.mutateAsync(payload);
      } else {
        await updateMutation.mutateAsync({ id: initialTransaction.id, data: payload });
      }
      // Success - parent component handles onOpenChange(false)
    } catch (error) {
      setErrors({ submit: 'Errore durante il salvataggio' });
    } finally {
      setIsSubmitting(false);
    }
  }, [form, mode]);

  // 7. Reset handler
  const reset = useCallback(() => {
    setForm(createInitialState());
    setErrors({});
  }, []);

  // 8. Return API
  return {
    form,
    errors,
    isSubmitting,
    isDirty: isDirty(form, initialState),
    setField,
    validateField: (key: string) => validateFieldByName(key, form[key], transactionValidationSchema),
    reset,
    submit,
  };
}
```

**Other Controllers**:
- `useBudgetFormController` - Budget form logic
- `useCategoryFormController` - Category form logic
- `useRecurringSeriesFormController` - Recurring series form logic

### Form UI Components

#### ModalWrapper

**File**: `components/ui/modal-wrapper.tsx`

Responsive wrapper that switches between Dialog (desktop) and Drawer (mobile).

```typescript
interface ModalWrapperProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  isLoading?: boolean;
  disableOutsideClose?: boolean;
}
```

**Usage**:
```tsx
<ModalWrapper
  isOpen={isOpen}
  onOpenChange={setOpen}
  title="New Transaction"
  description="Add a new transaction"
  footer={<FormActions submitType="submit" onCancel={() => setOpen(false)} />}
>
  <form onSubmit={handleSubmit}>
    {/* form fields */}
  </form>
</ModalWrapper>
```

**Auto-switches**:
- Desktop (≥768px): Renders as `Dialog`
- Mobile (<768px): Renders as `Drawer` (bottom sheet)

**Composition Helpers**:
```tsx
<ModalContent>  {/* Vertical spacing wrapper */}
  <ModalSection title="Details">  {/* Section with optional title */}
    {/* fields */}
  </ModalSection>
</ModalContent>
```

#### FormField

**File**: `components/ui/form-field.tsx`

Wrapper for label + input + error display.

```tsx
<FormField
  label="Email"
  error={errors.email}
  required
  helperText="Enter your email address"
>
  <Input value={email} onChange={...} />
</FormField>
```

**Features**:
- ✅ Automatic label association (htmlFor)
- ✅ Required field indicator (asterisk)
- ✅ Error message display
- ✅ Helper text support
- ✅ Accessible markup

#### FormSelect

**File**: `components/ui/form-select.tsx`

Enhanced Select with utilities.

```tsx
<FormSelect
  value={form.user_id}
  onValueChange={(v) => setField('user_id', v)}
  options={[
    { value: '1', label: 'User 1' },
    { value: '2', label: 'User 2', icon: <Icon /> }
  ]}
  placeholder="Select user"
  showEmpty
  emptyLabel="None"
/>
```

**Utilities**:
```typescript
// Convert array to options
const options = toSelectOptions(users, (u) => u.id, (u) => u.name);

// Sort alphabetically
const sorted = sortSelectOptions(options);
```

#### FormDatePicker

**File**: `components/ui/form-date-picker.tsx`

Calendar date picker with Italian locale support and dual input methods.

```tsx
<FormDatePicker
  value={form.date}
  onChange={(v) => setField('date', v)}
  placeholder="Seleziona data"
  minDate={new Date('2020-01-01')}
  maxDate={new Date()}
/>
```

**Features**:
- ✅ Italian locale (DD/MM/YYYY display format)
- ✅ ISO 8601 format (YYYY-MM-DD) for API/database
- ✅ Dual input: manual text entry + calendar picker
- ✅ Side-by-side layout (input + calendar button)
- ✅ ScrollArea for calendar popover
- ✅ Min/max date constraints
- ✅ Auto-formatting on blur
- ✅ Date validation with visual feedback
- ✅ Collision detection for mobile screens
- ✅ Accessible (keyboard navigation, ARIA labels)

**Layout Structure**:
```tsx
// Input and calendar button are side-by-side, NOT overlapping
<div className="flex gap-2">
  <Input />           {/* Flexible width */}
  <Button />          {/* Fixed icon button */}
</div>
```

**Utilities**:
```typescript
formatDateForInput(date);   // Date → 'YYYY-MM-DD'
parseInputDate(string);     // 'YYYY-MM-DD' → Date
getTodayString();           // Current date as 'YYYY-MM-DD'
isToday(dateString);        // Boolean
isPast(dateString);         // Boolean
isFuture(dateString);       // Boolean
```

**Best Practices**:
- Always use YYYY-MM-DD format for storing dates
- Display format (DD/MM/YYYY) is automatically handled
- Set appropriate minDate/maxDate for better UX
- The calendar button is visually separated from the input

#### IconPicker

**File**: `components/ui/icon-picker.tsx`

Icon picker with searchable Lucide React icons library.

```tsx
<IconPicker
  value={form.icon}
  onChange={(iconName) => setField('icon', iconName)}
/>
```

**Features**:
- ✅ 100+ popular icons from Lucide React
- ✅ Real-time search/filter functionality
- ✅ Smooth scrolling with ScrollArea
- ✅ Visual selection feedback
- ✅ Organized by categories
- ✅ Grid layout (6 columns)
- ✅ Hover states and animations
- ✅ Empty state for no results

**Icon Categories**:
- **Finance**: Wallet, CreditCard, Banknote, PiggyBank, TrendingUp, Calculator
- **Shopping & Food**: ShoppingCart, Store, Coffee, Pizza, Wine
- **Transportation**: Car, Bus, Train, Plane, Bike, Fuel
- **Home & Living**: Home, Building, Sofa, Bed, Lamp, Tv
- **Health & Fitness**: Heart, Activity, Dumbbell, Pill
- **Entertainment**: Film, Music, Gamepad2, Ticket, Gift
- **Education & Work**: GraduationCap, BookOpen, Briefcase, Laptop
- **Utilities**: Zap, Droplet, Wifi, Shield, Bell, Settings
- **Nature**: Sun, Moon, Leaf, Tree, Flower
- **People**: User, Users, Baby, HeartHandshake
- **Miscellaneous**: Star, Flag, Tag, Clock, Calendar, MapPin

**Usage in Forms**:
```tsx
<FormField label="Icona" required error={errors.icon}>
  <IconPicker
    value={controller.form.icon}
    onChange={(iconName) => controller.setField('icon', iconName)}
  />
</FormField>
```

**Popover Structure**:
```tsx
// Fixed search at top + scrollable grid
<PopoverContent>
  <div>
    <Input />  {/* Search field */}
  </div>
  <ScrollArea className="h-[300px]">
    <div className="grid grid-cols-6 gap-2">
      {/* Icon buttons */}
    </div>
  </ScrollArea>
</PopoverContent>
```

**Best Practices**:
- Store icon name as string (e.g., "Wallet")
- Icons are dynamically loaded from Lucide React
- Use search for quick icon discovery
- Consider category when selecting relevant icon

#### FormCurrencyInput

**File**: `components/ui/form-currency-input.tsx`

EUR currency input with formatting.

```tsx
<FormCurrencyInput
  value={form.amount}
  onChange={(v) => setField('amount', v)}
  min={0}
  showSymbol={true}
/>
```

**Features**:
- ✅ € symbol display
- ✅ Auto-format to 2 decimals on blur
- ✅ Numeric-only validation
- ✅ IT locale formatting (1.234,56)

**Utilities**:
```typescript
formatCurrency(amount);         // 100 → '€ 100,00'
parseCurrency(value);          // '€ 100,00' → 100
isValidCurrency(value);        // Boolean
roundCurrency(amount);         // Round to 2 decimals
```

#### FormCheckboxGroup

**File**: `components/ui/form-checkbox-group.tsx`

Multiple checkbox selection.

```tsx
<FormCheckboxGroup
  value={form.categories}  // string[]
  onChange={(v) => setField('categories', v)}
  options={[
    { value: 'food', label: 'Food', icon: <Icon /> },
    { value: 'transport', label: 'Transport' }
  ]}
  showSearch
  showSelectAll
  maxHeight="300px"
/>
```

**Features**:
- ✅ Search/filter within options
- ✅ Select all / deselect all
- ✅ Selection count display ("3 / 10 selected")
- ✅ Icon support

**Utilities**:
```typescript
toCheckboxOptions(items, getValue, getLabel);
sortCheckboxOptions(options);
groupCheckboxOptions(options, groupBy);
```

#### FormActions

**File**: `components/ui/form-actions.tsx`

Button footer for forms.

```tsx
<FormActions
  submitType="submit"
  submitLabel="Create"
  onCancel={() => setOpen(false)}
  isSubmitting={isSubmitting}
/>
```

**Variants**:
```tsx
// Standard (Save + Cancel)
<FormActions ... />

// Destructive (Delete + Cancel)
<DestructiveFormActions
  onConfirm={handleDelete}
  onCancel={() => setOpen(false)}
  confirmLabel="Delete"
/>

// Single action
<SingleFormAction
  onSubmit={handleSubmit}
  label="Submit"
/>
```

### Form Usage Example

**Complete Transaction Form**:

```tsx
export function TransactionForm({
  isOpen,
  onOpenChange,
  transaction,
  mode = 'create'
}: TransactionFormProps) {
  // 1. Get controller
  const controller = useTransactionFormController({
    mode,
    initialTransaction: transaction
  });

  // 2. Get reference data
  const { data: categories = [] } = useCategories();
  const { data: accounts = [] } = useAccounts();
  const { data: users = [] } = useUsers();

  // 3. Prepare options
  const categoryOptions = useMemo(() =>
    sortSelectOptions(toSelectOptions(categories, c => c.key, c => c.label)),
    [categories]
  );

  // 4. Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await controller.submit();
    if (!controller.isSubmitting && Object.keys(controller.errors).length === 0) {
      onOpenChange(false);
    }
  };

  // 5. Render
  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={mode === 'edit' ? 'Edit Transaction' : 'New Transaction'}
      footer={
        <FormActions
          submitType="submit"
          submitLabel={mode === 'edit' ? 'Update' : 'Create'}
          onCancel={() => onOpenChange(false)}
          isSubmitting={controller.isSubmitting}
        />
      }
    >
      <form onSubmit={handleSubmit}>
        <ModalContent>
          <ModalSection>
            <FormField label="User" required error={controller.errors.user_id}>
              <FormSelect
                value={controller.form.user_id}
                onValueChange={(v) => controller.setField('user_id', v)}
                options={userOptions}
                placeholder="Select user"
              />
            </FormField>

            <FormField label="Amount" required error={controller.errors.amount}>
              <FormCurrencyInput
                value={controller.form.amount}
                onChange={(v) => controller.setField('amount', v)}
              />
            </FormField>

            <FormField label="Date" required error={controller.errors.date}>
              <FormDatePicker
                value={controller.form.date}
                onChange={(v) => controller.setField('date', v)}
              />
            </FormField>

            {/* More fields... */}
          </ModalSection>
        </ModalContent>
      </form>
    </ModalWrapper>
  );
}
```

---

## Modal System

### Architecture

**Responsive Strategy**:
- **Desktop (≥768px)**: Dialog component (centered overlay)
- **Mobile (<768px)**: Drawer component (bottom sheet)
- **Auto-detection**: `useMediaQuery('(min-width: 768px)')`

### ModalWrapper Component

**Single API for both contexts**:

```typescript
<ModalWrapper
  isOpen={isOpen}
  onOpenChange={setOpen}
  title="Modal Title"
  description="Modal description"
  footer={<Footer />}
>
  {/* Content - same for Dialog and Drawer */}
</ModalWrapper>
```

**Props**:
- `isOpen` - Controlled open state
- `onOpenChange` - State setter
- `title` - Accessible title (required)
- `description` - Optional description
- `children` - Modal content
- `footer` - Action buttons
- `maxWidth` - Desktop width (`sm` | `md` | `lg` | `xl` | `full`)
- `showCloseButton` - Show X button (default: true for Dialog)
- `isLoading` - Show loading overlay
- `disableOutsideClose` - Prevent Esc/outside click close

### Accessibility

**Built-in ARIA**:
- Title mapped to `DialogTitle` / `DrawerTitle`
- Description mapped to `DialogDescription` / `DrawerDescription`
- Focus trap enabled
- Escape key to close (unless disabled)
- Outside click to close (unless disabled)

### Composition Helpers

```tsx
<ModalContent>  {/* Adds consistent vertical spacing */}
  <ModalSection title="Details">  {/* Optional section title */}
    {/* Fields */}
  </ModalSection>
  <ModalSection title="Settings">
    {/* More fields */}
  </ModalSection>
</ModalContent>
```

---

## Styling Guidelines

### Design Token Usage

**✅ DO**:
```tsx
<div className="bg-primary text-primary-foreground">
<div className="text-muted-foreground">
<div className="border-border">
```

**❌ DON'T**:
```tsx
<div style={{ backgroundColor: '#7678E4' }}>
<div className="text-slate-600">  // Hardcoded color class
<div className="text-[#333]">      // Arbitrary value
```

### CVA Variant Patterns

**Import variants**:
```typescript
import {
  cardVariants,
  statusBadgeVariants,
  progressBarVariants,
  amountVariants
} from "@/lib/ui-variants";
```

**Use in components**:
```tsx
<div className={cardVariants({ variant: "interactive", padding: "lg" })}>
  Content
</div>

<span className={amountVariants({ type: "income", size: "xl", emphasis: "strong" })}>
  € 1,234.56
</span>
```

**Available Variants**:
- `cardVariants` - Card styling options
- `iconContainerVariants` - Icon background variations
- `statusBadgeVariants` - Status indicator styles
- `progressBarVariants` / `progressFillVariants` - Progress bars
- `amountVariants` - Financial amount styling

### Focus States

**All interactive elements must have**:
```tsx
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-ring
focus-visible:ring-offset-2
```

**Already implemented in**:
- Button, Input, Checkbox, Select, Tabs, Badge

### Hover Effects

**Reduced intensity (20-60% less than before)**:

```tsx
// Background hovers
hover:bg-primary/8        // Subtle (dropdowns, menus)
hover:bg-primary/12       // Medium (buttons)

// Scale hovers
hover:scale-[1.01]        // Subtle (cards)
hover:scale-[1.02]        // Medium (buttons)

// Shadow hovers
hover:shadow-md           // Medium elevation
hover:shadow-primary/10   // Colored shadow
```

**Pattern**:
```tsx
<Button className="hover:bg-primary/12 hover:scale-[1.02] transition-all">
```

### Mobile-First Approach

**Breakpoints**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
```

**Responsive utilities**:
```tsx
<div className="px-4 md:px-6 lg:px-8">  {/* Padding increases on larger screens */}
<div className="text-sm md:text-base">  {/* Text size scales */}
```

### Component Composition

**✅ DO** - Use primitives:
```tsx
<IconContainer size="md" color="primary">
  <Icon />
</IconContainer>
<Text variant="heading" size="xl">Title</Text>
<StatusBadge status="success" showDot>Active</StatusBadge>
```

**❌ DON'T** - Recreate styling:
```tsx
<div className="flex size-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20...">
  <Icon />
</div>
```

---

## Setup & Configuration

### Tailwind v4 Configuration

**File**: `app/globals.css`

```css
@import "tailwindcss";

@theme {
  /* All design tokens defined here */
  --color-primary: oklch(0.595 0.178 270);
  /* ... */
}

@utility icon-container {
  /* Custom utility classes */
}

/* Base styles */
@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

### Import Patterns

**Primitives**:
```typescript
import { Text, IconContainer, StatusBadge, Amount } from "@/components/ui/primitives";
```

**UI Components**:
```typescript
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
```

**Variants**:
```typescript
import { cardVariants, amountVariants } from "@/lib/ui-variants";
```

**Form Components**:
```typescript
import { ModalWrapper, ModalContent } from "@/components/ui/modal-wrapper";
import { FormField } from "@/components/ui/form-field";
import { FormSelect } from "@/components/ui/form-select";
```

### Path Aliases

Configured in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

**Usage**:
```typescript
import { Button } from "@/components/ui/button";  // Not ../../components/ui/button
```

---

## Best Practices

### Component Development

1. **Always use primitives** for text, icons, badges, amounts
2. **Import from index** (`@/components/ui/primitives`)
3. **Use semantic tokens** (`text-primary` not `text-purple-600`)
4. **Leverage CVA variants** - Don't recreate patterns
5. **Add comments** for clarity

### Form Development

1. **Use controller hooks** for all form logic
2. **Validate with schemas** from validation service
3. **Sanitize before submit** using form state service
4. **Use ModalWrapper** for consistent modals
5. **Compose with form components** (FormField, FormSelect, etc.)

### Styling Best Practices

1. **Mobile-first** - Start with mobile styles, add `md:` and `lg:` as needed
2. **Semantic colors** - Use `text-destructive` not `text-red-600`
3. **Focus states** - Always include `focus-visible` classes
4. **Hover subtly** - Use reduced intensity (primary/8 not primary/20)
5. **Compose utilities** - `className="bg-card text-foreground hover:bg-accent"`

### Accessibility

1. **Keyboard navigation** - All interactive elements must be keyboard accessible
2. **Focus indicators** - Clear focus-visible styles required
3. **ARIA labels** - Add to icon-only buttons
4. **Color contrast** - Maintain WCAG AA ratios (4.5:1 for text)
5. **Screen readers** - Use semantic HTML and ARIA attributes

---

## Quick Reference

### Common Patterns

```tsx
// Heading
<Text variant="heading" size="2xl">Page Title</Text>

// Icon with background
<IconContainer size="lg" color="primary"><Icon /></IconContainer>

// Status indicator
<StatusBadge status="success" showDot>Active</StatusBadge>

// Financial amount
<Amount type="income" size="xl" emphasis="strong">1234.56</Amount>

// Card wrapper
<div className={cardVariants({ variant: "interactive", padding: "lg" })}>
  Content
</div>

// Form field
<FormField label="Email" required error={errors.email}>
  <Input value={email} onChange={...} />
</FormField>

// Modal
<ModalWrapper
  isOpen={isOpen}
  onOpenChange={setOpen}
  title="Title"
  footer={<FormActions submitType="submit" onCancel={...} />}
>
  <form>{/* fields */}</form>
</ModalWrapper>
```

### Color Reference

| Token | Usage | Example |
|-------|-------|---------|
| `primary` | Brand color, CTAs | `bg-primary text-primary-foreground` |
| `foreground` | Primary text | `text-foreground` |
| `muted-foreground` | Secondary text | `text-muted-foreground` |
| `card` | Card backgrounds | `bg-card` |
| `border` | Borders | `border-border` |
| `destructive` | Errors, delete | `text-destructive bg-destructive/10` |
| `warning` | Warnings | `text-warning` |
| `accent` | Success, positive | `text-accent` |

---

**Status**: ✅ Production Ready
**Last Updated**: October 2025
**Maintainer**: Wealth Pillar Team
