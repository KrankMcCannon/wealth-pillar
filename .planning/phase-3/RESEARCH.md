# Phase 3 Research: Input Optimization

## Current State Analysis

### 1. `DateField` & `MobileCalendarDrawer`
- **Current**: Uses a custom-built `MobileCalendarDrawer` with Radix `Dialog` for all devices.
- **Issues**: Deviates from shadcn/ui standard (`react-day-picker`). Custom month navigation and grid logic are harder to maintain than `react-day-picker`.
- **Target**: Refactor `DateField` to use `react-day-picker`. Use a responsive wrapper: `Popover` for desktop and `Drawer` (Vaul) for mobile.

### 2. `CategorySelect` & `FormSelect`
- **Current**: Use standard shadcn/ui `Select` (Radix Select) which opens as a floating popover.
- **Issues**: Floating popovers can be clunky on mobile, especially when they contain search inputs or long lists.
- **Target**: Implement a `ResponsiveSelect` pattern.
  - **Desktop**: Keep standard `Select` or `Popover` + `Command` (for search).
  - **Mobile**: Use a `Drawer` (Bottom Sheet) to show options. This provides a much better "thumb-friendly" UX.

### 3. `FormCurrencyInput`
- **Current**: I need to check its implementation, but usually, these need careful handling of decimals, symbols, and mobile numeric keyboards.

### 4. Input Spacing & Consistency
- **Current**: Many inputs have custom padding and borders defined in `system.ts`.
- **Target**: Ensure all inputs (Select, Date, Text, Number) follow the same height, padding, and focus ring standards defined in Phase 1.

## Proposed Components to Create/Refactor

1. **`ResponsivePicker`**: A base component that handles the Popover/Drawer switch logic.
2. **`ModernCalendar`**: A `react-day-picker` wrapper styled for Wealth Pillar, compatible with `ResponsivePicker`.
3. **`ModernSelect`**: A searchable select component that uses `Command` (shadcn) in a `ResponsivePicker`.

## Technical Constraints (Tailwind v4)
- Leverage `bg-primary-subtle`, `border-glass-border`, etc., for all input states (hover, focus, disabled).
- Use `oklch` colors consistently.
