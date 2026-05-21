export const modalWrapperStyles = {
  dialogDescriptionHidden: 'sr-only',
  loadingWrap: 'flex items-center justify-center py-8',
  drawerContent: 'p-0 pb-10',
  drawerHeader: 'shrink-0 gap-0 text-left',
  drawerTitle: 'text-xl font-semibold leading-snug tracking-tight text-modal-fg',
  drawerDescription: 'text-xs text-modal-fg-muted',
  drawerContentBody: 'px-4 py-3 text-modal-fg flex min-h-0 flex-1 flex-col overflow-hidden',
  drawerFooter: 'pt-3 pb-4 px-4 border-t border-modal-border/30 bg-modal-surface shrink-0',
  modalSection: 'flex flex-col gap-4',
  modalSectionTitle:
    'text-xs font-semibold text-modal-fg-muted uppercase tracking-wide shrink-0 mb-2',
  modalActions: 'flex flex-col-reverse gap-2 py-4',
  /** Default drawer chrome (Stitch) */
  drawerSurface:
    'flex max-h-[min(751px,92dvh)] flex-col overflow-hidden rounded-t-[32px] border border-modal-border/40 bg-modal-surface/95 shadow-[0_-8px_40px_rgba(0,20,86,0.28)] ring-1 ring-inset ring-white/10 backdrop-blur-[24px]',
  handle: 'mx-auto mb-4 h-1.5 w-12 shrink-0 rounded-full bg-modal-handle/35',
  drawerHeaderShell:
    'border-0 border-b border-modal-border/40 bg-transparent px-4 pb-4 pt-2 shadow-none',
  headerClose:
    'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-modal-elevated/90 text-modal-fg shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)] transition-colors hover:bg-modal-elevated-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-modal-ring/45 active:scale-[0.97] motion-reduce:active:scale-100',
} as const;
