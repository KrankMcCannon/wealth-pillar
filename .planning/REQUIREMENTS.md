# Requirements: Modal System Refactor

## Functional Requirements

- **FR1: Unified Responsive Modals**: All application modals must use a single `ModalWrapper` component that switches between a `Dialog` (desktop) and a `Drawer` (mobile).
- **FR2: Modern Calendar Input**: Date selection must use `react-day-picker`. It should appear as a `Popover` on desktop and a `Drawer` on mobile.
- **FR3: Optimized Inputs**: All inputs within modals (Text, Number, Select, Date, Category) must follow a consistent, high-quality UX pattern.
- **FR4: URL-State Sync**: Modals must remain synchronized with the URL via `nuqs` for shareability and deep-linking.
- **FR5: Keyboard Accessibility**: All modals and inputs must be fully navigable via keyboard, adhering to ARIA standards.

## Non-Functional Requirements

- **NFR1: Tailwind v4 Alignment**: Move design tokens from `system.ts` to the Tailwind v4 `@theme` block.
- **NFR2: Next.js 16 / React 19 Optimization**: Utilize new features like `Suspense` and `lazy` for optimal bundle size and loading states.
- **NFR3: Performance**: Modals should open/close smoothly with zero layout shift or "flicker" on mobile.
- **NFR4: Type Safety**: All modal props and URL states must be strictly typed.

## UI/UX Standards

- **Desktop**: Centered Dialogs with clean overlays.
- **Mobile**: Bottom Drawers (Vaul) with "grabber" handles.
- **Inputs**: Consistent spacing, clear labels, and meaningful error messages.
- **Feedback**: Loading states and success/error feedback within the modal footer.
