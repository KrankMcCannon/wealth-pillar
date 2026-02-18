# Project: Modal System Refactor

## Goal
Refactor all modal components, files, and logic to achieve best-in-class modal handling. Adhere to modern UX/UI design best practices using Tailwind CSS v4, Next.js 16, and shadcn/ui. Ensure a seamless experience across both mobile and desktop, utilizing adaptive patterns (e.g., Drawers for mobile, Dialogs for desktop) where appropriate.

## Core Objectives
1.  **Standardize Modal Management:** Transition from the current URL-state-driven `ModalProvider` to a more robust and flexible pattern if needed, or refine the existing one to be more performant and type-safe.
2.  **Adaptive UI/UX:** Implement responsive modal designs that feel native to their platform (Desktop vs. Mobile).
3.  **Modern Stack:** Fully leverage Next.js 16 (React 19) features and Tailwind CSS v4's new capabilities.
4.  **Component Architecture:** Ensure all modals follow a consistent structure, utilizing shadcn/ui components (Dialog, Drawer, etc.).
5.  **Performance:** Optimize modal loading (already using lazy loading, but can be improved with React 19 features).

## Success Criteria
- [ ] All existing modals refactored to the new system.
- [ ] Responsive behavior: Dialogs on desktop, Drawers on mobile (using `vaul` or similar).
- [ ] Consistent animation and accessibility (ARIA) across all modals.
- [ ] Improved developer experience for adding new modals.
- [ ] Zero regressions in modal functionality.
