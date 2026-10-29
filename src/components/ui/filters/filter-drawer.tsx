'use client';

import type { ReactNode } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHandle,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { formModalStyles } from '@/components/form/form-modal-styles';
import { cn } from '@/lib/utils';

interface FilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
  contentClassName?: string;
}

export function FilterDrawer({
  open,
  onOpenChange,
  title,
  children,
  contentClassName,
}: FilterDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} shouldScaleBackground={false}>
      <DrawerContent className={cn(formModalStyles.shell.content, contentClassName)}>
        <DrawerHandle className={formModalStyles.shell.handle} aria-hidden />
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{title}</DrawerDescription>
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
