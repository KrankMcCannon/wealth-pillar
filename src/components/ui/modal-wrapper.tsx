'use client';

import { formModalStyles as modalS } from '@/components/form/form-modal-styles';
import { cn } from '@/lib/utils';
import { stitchSurface } from '@/styles/home-design-foundation';
import * as React from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from './sheet';
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
  handleClassName?: string;
  drawerHeaderClassName?: string;
  drawerCloseClassName?: string;
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
  repositionInputs: _repositionInputs = false,
  handleClassName,
  drawerHeaderClassName,
  drawerCloseClassName,
}: Readonly<ModalWrapperProps>) {
  const tCommon = useTranslations('Common');

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
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        className={cn(modalS.shell.content, className)}
        {...(disableOutsideClose
          ? {
              onInteractOutside: (event) => event.preventDefault(),
              onEscapeKeyDown: (event) => event.preventDefault(),
            }
          : {})}
      >
        <div className={cn(modalS.shell.handle, handleClassName)} aria-hidden />
        <SheetHeader className={cn(modalS.shell.header, drawerHeaderClassName)}>
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <SheetTitle className={cn(modalS.shell.title, titleClassName)}>{title}</SheetTitle>
            {showCloseButton ? (
              <SheetClose className={cn(modalS.shell.closeButton, drawerCloseClassName)}>
                <X aria-hidden />
                <span className="sr-only">{tCommon('closeDialog')}</span>
              </SheetClose>
            ) : null}
          </div>
          {description ? (
            <SheetDescription className={cn(modalS.shell.description, descriptionClassName)}>
              {description}
            </SheetDescription>
          ) : (
            <SheetDescription className="sr-only">{title}</SheetDescription>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className={modalS.shell.loadingWrap}>
            <Spinner className="size-10 text-modal-fg-muted" />
          </div>
        ) : (
          <div className={modalS.shell.body}>{children}</div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function ModalBody({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto py-2', className)}>
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
        'flex flex-col-reverse gap-3 px-4 py-4 pb-[max(env(safe-area-inset-bottom),0.75rem)]',
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
    <div className={cn('flex flex-col gap-3', className)}>
      {title ? <h3 className={modalS.shell.sectionEyebrow}>{title}</h3> : null}
      {children}
    </div>
  );
}
