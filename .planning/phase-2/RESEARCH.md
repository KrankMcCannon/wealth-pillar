# Phase 2 Research: Core Component Standardization

## 1. `ModalWrapper` Audit (`src/components/ui/modal-wrapper.tsx`)
### Strengths
- Already implements a responsive pattern (Dialog for desktop, Drawer for mobile).
- Uses `useMediaQuery` for clean switching.
- Compound pattern support with `ModalBody`, `ModalFooter`, and `ModalSection`.

### Areas for Improvement
- **Responsive Logic**: Currently uses a fixed breakpoint `(min-width: 640px)`.
- **Compound Pattern Usage**: Ensure all feature modals use `ModalBody` and `ModalFooter` consistently for uniform spacing and behavior.
- **Accessibility**: Ensure `aria-describedby` and `aria-labelledby` are handled correctly in both Dialog and Drawer.
- **Input Repositioning**: The `repositionInputs` prop is currently passed only to the Drawer. Verify if it's needed for Dialog on small viewports or if it should be standard.

## 2. `ModalProvider` Audit (`src/providers/modal-provider.tsx`)
### Strengths
- Uses lazy loading for performance.
- Centralizes all main feature modals.
- Decoupled from the main component tree via dynamic import.

### Areas for Improvement
- **Type Safety**: The `modal` type is checked via strings (`modal === 'transaction'`).
- **Scalability**: As the app grows, this file might become a bottleneck.
- **Consistency**: Ensure `isOpen={true}` is the standard way to trigger these modals from the provider.

## 3. URL State Audit (`src/lib/navigation/url-state.ts`)
### Strengths
- Uses `nuqs` for clean URL state management.
- Type-safe `MODAL_TYPES` array.

### Areas for Improvement
- **Utility Functions**: `openModal` and `closeModal` are great, but could benefit from a more flexible way to handle multiple params if needed (though keeping it simple is better).
- **Navigation Context**: Ensure `shallow: false` (or true) is used consistently depending on whether we want to trigger server-side re-renders or not (usually shallow is better for modals).

## Proposed Standardization Actions
1. **Refine `ModalWrapper`**: Standardize the footer and body components to ensure they work perfectly on both mobile (safe areas) and desktop.
2. **Type-Safe Provider**: Update `ModalProvider` to use the `ModalType` enum/type more strictly.
3. **Responsive Dialog Component**: Explore if we should move the `isDesktop` logic into a more reusable `ResponsiveDialog` primitive that `ModalWrapper` consumes.
