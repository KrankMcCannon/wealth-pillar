# Roadmap: Modal System Refactor

## Phase 1: Style & Theme Migration
- [x] Task 1.1: Audit `src/styles/system.ts` and identify hardcoded Tailwind v4 tokens.
- [x] Task 1.2: Migrate identifies tokens to the Tailwind v4 `@theme` block in `app/globals.css` using CSS variables.
- [x] Task 1.3: Refactor `src/styles/system.ts` to consume CSS variables instead of hardcoded utility strings where appropriate.

## Phase 2: Core Component Standardization
**Goal**: Refine 'ModalWrapper', 'ModalProvider', and 'url-state.ts' to achieve a standardized, type-safe, and responsive modal system.
**Plans**: 2 plans
- [ ] 02-01-PLAN.md — Refine core modal infrastructure (Wrapper, Provider, URL state)
- [ ] 02-02-PLAN.md — Align feature modals and verify cross-viewport performance

- [ ] **Task 2.1**: Audit `src/components/ui/modal-wrapper.tsx` and ensure full alignment with shadcn/ui's Responsive Dialog pattern.
- [ ] **Task 2.2**: Standardize `ModalProvider` (in `src/providers/modal-provider.tsx`) to be the single source of truth for all global modals.
- [ ] **Task 2.3**: Improve URL state (nuqs) types and utility functions in `src/lib/navigation/url-state.ts`.

## Phase 3: Input Optimization
- [ ] **Task 3.1**: Refactor `DateField` to use `react-day-picker` within a responsive Popover/Drawer wrapper.
- [ ] **Task 3.2**: Optimize other common modal inputs (CategorySelect, FormSelect, CurrencyInput) for both mobile (touch-friendly) and desktop (keyboard-friendly).
- [ ] **Task 3.3**: Ensure all inputs follow a consistent design and accessibility pattern.

## Phase 4: Feature Integration & Validation
- [ ] **Task 4.1**: Refactor `TransactionFormModal` to use the standardized `ModalWrapper` and new inputs.
- [ ] **Task 4.2**: Refactor `BudgetFormModal`, `CategoryFormModal`, `RecurringFormModal`, and `AccountFormModal`.
- [ ] **Task 4.3**: Refactor `AddInvestmentModal`.
- [ ] **Task 4.4**: Final E2E testing (Playwright) of all modal flows on both desktop and mobile viewports.
- [ ] **Task 4.5**: Performance audit of modal opening/closing and input responsiveness.

## Phase 5: Cleanup & Final Documentation
- [ ] **Task 5.1**: Remove deprecated modal components and older input patterns.
- [ ] **Task 5.2**: Update developer documentation for creating new modals.
