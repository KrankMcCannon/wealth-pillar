'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from './drawer';
import { modalWrapperStyles } from './theme/modal-wrapper-styles';
import { Loader2, X } from 'lucide-react';
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
  repositionInputs = false,
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
    <Drawer open={isOpen} onOpenChange={handleOpenChange} repositionInputs={repositionInputs}>
      <DrawerContent
        className={cn(
          modalWrapperStyles.drawerContent,
          modalWrapperStyles.drawerSurface,
          'mt-24 min-h-0',
          className
        )}
      >
        <div className={cn(modalWrapperStyles.handle, handleClassName)} aria-hidden />
        <DrawerHeader
          className={cn(
            modalWrapperStyles.drawerHeader,
            modalWrapperStyles.drawerHeaderShell,
            'flex flex-col gap-2 px-4 py-3',
            drawerHeaderClassName
          )}
        >
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <DrawerTitle className={cn(modalWrapperStyles.drawerTitle, titleClassName)}>
              {title}
            </DrawerTitle>
            {showCloseButton ? (
              <DrawerClose className={cn(modalWrapperStyles.headerClose, drawerCloseClassName)}>
                <X className="h-5 w-5" aria-hidden />
                <span className="sr-only">{tCommon('closeDialog')}</span>
              </DrawerClose>
            ) : null}
          </div>
          {description ? (
            <DrawerDescription
              className={cn(
                modalWrapperStyles.drawerDescription,
                descriptionClassName,
                'text-left'
              )}
            >
              {description}
            </DrawerDescription>
          ) : (
            <DrawerDescription className={modalWrapperStyles.dialogDescriptionHidden}>
              {title}
            </DrawerDescription>
          )}
        </DrawerHeader>

        {isLoading ? (
          <div className={modalWrapperStyles.loadingWrap}>
            <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
          </div>
        ) : (
          <div className={cn(modalWrapperStyles.drawerContentBody, 'min-h-0')}>{children}</div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

export function ModalBody({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div className={cn('min-h-0 flex-1 overflow-y-auto py-2 space-y-4', className)}>{children}</div>
  );
}

export function ModalFooter({
  children,
  className,
}: Readonly<{ children: React.ReactNode; className?: string }>) {
  return (
    <div
      className={cn(
        'mt-auto shrink-0 border-t border-border bg-card/95 py-4 pt-4 backdrop-blur-sm supports-backdrop-filter:bg-card/90 flex flex-col-reverse gap-3 pb-[max(env(safe-area-inset-bottom),0.75rem)]',
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
      {title && (
        <h3 className="text-xs font-semibold text-primary/60 uppercase tracking-wider">{title}</h3>
      )}
      {children}
    </div>
  );
}
