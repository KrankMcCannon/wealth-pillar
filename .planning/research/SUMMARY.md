# Research Summary: Modal System Audit

## Findings
- **Architecture**: A `ModalWrapper` already exists that uses a responsive pattern (Dialog for desktop, Drawer for mobile). This is a strong foundation.
- **Input Handling**: `DateField` uses a custom `MobileCalendarDrawer` instead of the standard shadcn/ui `Popover` + `react-day-picker` pattern.
- **Styling**: Tailwind v4 is already in use, but many styles are centralized in a large `src/styles/system.ts` file using hardcoded utility strings.
- **Mobile UX**: Drawers are used for mobile, which aligns with the user's preference for "thumb-friendly" interfaces.

## Optimization Opportunities
1.  **Standardize `ModalWrapper`**: Ensure *all* feature modals (Transactions, Budgets, etc.) use this shared component consistently.
2.  **Modernize Calendar Input**: Refactor `DateField` to use `react-day-picker` (shadcn/ui standard) within the existing responsive wrapper (Popover for desktop, Drawer for mobile).
3.  **Tailwind v4 `@theme` Migration**: Move hardcoded color and style strings from `system.ts` into the Tailwind v4 `@theme` block in `globals.css` using CSS variables.
4.  **Input Component Refinement**: Enhance all modal inputs (Selects, TextInputs, etc.) to use standard shadcn/ui patterns while maintaining the existing custom styling "soul" of the app.
5.  **Refine Modal Logic**: Improve the URL-state (nuqs) integration to be more robust and type-safe across all modals.
