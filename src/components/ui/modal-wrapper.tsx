'use client';

import { cn } from '@/lib/utils';
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
        className={cn('max-h-[85vh] gap-0 rounded-t-3xl border-border px-0 pb-0', className)}
        {...(disableOutsideClose
          ? {
              onInteractOutside: (event) => event.preventDefault(),
              onEscapeKeyDown: (event) => event.preventDefault(),
            }
          : {})}
      >
        <div
          className={cn(
            'mx-auto mt-3 mb-2 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30',
            handleClassName
          )}
          aria-hidden
        />
        <SheetHeader
          className={cn(
            'flex flex-col gap-2 border-b border-border px-4 py-3 text-left',
            drawerHeaderClassName
          )}
        >
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <SheetTitle className={cn('text-lg font-semibold text-foreground', titleClassName)}>
              {title}
            </SheetTitle>
            {showCloseButton ? (
              <SheetClose
                className={cn(
                  'inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground',
                  drawerCloseClassName
                )}
              >
                <X aria-hidden />
                <span className="sr-only">{tCommon('closeDialog')}</span>
              </SheetClose>
            ) : null}
          </div>
          {description ? (
            <SheetDescription
              className={cn('text-left text-muted-foreground', descriptionClassName)}
            >
              {description}
            </SheetDescription>
          ) : (
            <SheetDescription className="sr-only">{title}</SheetDescription>
          )}
        </SheetHeader>

        {isLoading ? (
          <div className="flex min-h-40 items-center justify-center py-8">
            <Spinner className="size-10 text-muted-foreground" />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">{children}</div>
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
        'mt-auto flex shrink-0 flex-col-reverse gap-3 border-t border-border bg-card/95 py-4 backdrop-blur-sm supports-backdrop-filter:bg-card/90 pb-[max(env(safe-area-inset-bottom),0.75rem)]',
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
      {title ? (
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </h3>
      ) : null}
      {children}
    </div>
  );
}
