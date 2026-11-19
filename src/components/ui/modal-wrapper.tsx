'use client';

import { formModalStyles as modalS } from '@/components/form/form-modal-styles';
import { cn } from '@/lib/utils';
import { stitchSurface } from '@/styles/home-design-foundation';
import * as React from 'react';
import {
  Drawer,
  DrawerNested,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from './drawer';
import { Spinner } from './spinner';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

export interface ModalWrapperProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  className?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  isLoading?: boolean;
  disableOutsideClose?: boolean;
  repositionInputs?: boolean;
  /** When true, renders as Vaul NestedRoot (required when opening over another drawer). */
  nested?: boolean;
  drawerHeaderClassName?: string;
  drawerCloseClassName?: string;
  /** Compact centered card for sequential confirmations. */
  presentation?: 'sheet' | 'alert';
  leadingAction?: React.ReactNode;
  contentId?: string | undefined;
  onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  fitVisualViewport?: boolean;
}

export function ModalWrapper({
  isOpen,
  onOpenChange,
  title,
  description,
  children,
  className,
  titleClassName,
  descriptionClassName,
  showCloseButton = true,
  isLoading = false,
  disableOutsideClose = false,
  repositionInputs = false,
  nested = false,
  drawerHeaderClassName,
  drawerCloseClassName,
  presentation = 'sheet',
  leadingAction,
  contentId,
  onEscapeKeyDown,
  fitVisualViewport = false,
}: Readonly<ModalWrapperProps>) {
  const tCommon = useTranslations('Common');
  const DrawerRoot = nested ? DrawerNested : Drawer;
  const isAlert = presentation === 'alert';
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const viewport = window.visualViewport;
    const content = contentRef.current;
    if (!fitVisualViewport || !isOpen || !viewport || !content) return;

    function update() {
      if (!viewport || !content) return;
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      content.style.setProperty('--sheet-viewport-height', `${viewport.height}px`);
      content.style.setProperty('--sheet-keyboard-inset', `${inset}px`);
    }

    update();
    viewport.addEventListener('resize', update);
    viewport.addEventListener('scroll', update);
    return () => {
      viewport.removeEventListener('resize', update);
      viewport.removeEventListener('scroll', update);
      content.style.removeProperty('--sheet-viewport-height');
      content.style.removeProperty('--sheet-keyboard-inset');
    };
  }, [fitVisualViewport, isOpen]);

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (disableOutsideClose && !open) {
        return;
      }
      onOpenChange(open);
    },
    [disableOutsideClose, onOpenChange]
  );

  return (
    <DrawerRoot
      open={isOpen}
      onOpenChange={handleOpenChange}
      dismissible={!disableOutsideClose}
      repositionInputs={repositionInputs}
      shouldScaleBackground={false}
    >
      <DrawerContent
        ref={contentRef}
        {...(contentId ? { id: contentId } : {})}
        onEscapeKeyDown={onEscapeKeyDown}
        className={cn(
          isAlert ? modalS.drawerShell.alertContent : modalS.shell.formContent,
          fitVisualViewport &&
            'max-md:bottom-(--sheet-keyboard-inset,0px) max-md:max-h-[min(90dvh,var(--sheet-viewport-height,90dvh))]',
          className
        )}
      >
        <DrawerHeader className={cn(modalS.shell.header, drawerHeaderClassName)}>
          {isAlert ? (
            <DrawerTitle className={cn(modalS.shell.title, titleClassName)}>{title}</DrawerTitle>
          ) : (
            <div className="flex w-full min-w-0 items-center gap-1">
              {leadingAction ?? <span className="size-11 shrink-0" aria-hidden />}
              <DrawerTitle className={cn(modalS.shell.title, titleClassName)}>{title}</DrawerTitle>
              {showCloseButton ? (
                <DrawerClose className={cn(modalS.shell.closeButton, drawerCloseClassName)}>
                  <X aria-hidden />
                  <span className="sr-only">{tCommon('closeDialog')}</span>
                </DrawerClose>
              ) : (
                <span className="size-11 shrink-0" aria-hidden />
              )}
            </div>
          )}
          {description ? (
            <DrawerDescription className={cn(modalS.shell.description, descriptionClassName)}>
              {description}
            </DrawerDescription>
          ) : (
            <DrawerDescription className="sr-only">{title}</DrawerDescription>
          )}
        </DrawerHeader>

        {isLoading ? (
          <div className={modalS.shell.loadingWrap} role="status" aria-live="polite">
            <Spinner className="size-10 text-modal-fg-muted" />
            <span className="sr-only">{tCommon('PageLoader.message')}</span>
          </div>
        ) : (
          <div className={modalS.shell.body}>{children}</div>
        )}
      </DrawerContent>
    </DrawerRoot>
  );
}

export function ModalBody({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div
      className={cn(
        'flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-4 py-2',
        className
      )}
    >
      {children}
    </div>
  );
}

export function ModalFooter({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div
      className={cn(
        stitchSurface.modalFooter,
        'flex flex-col gap-2 px-4 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]',
        className
      )}
    >
      {children}
    </div>
  );
}

export function ModalSection({
  title,
  children,
  className,
}: Readonly<{
  title?: string;
  children: React.ReactNode;
  className?: string;
}>) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {title ? <h3 className={modalS.shell.sectionEyebrow}>{title}</h3> : null}
      {children}
    </div>
  );
}
