'use client';

import type { ReactNode } from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

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
  contentClassName = 'max-h-[85vh] rounded-t-3xl border-t border-border bg-card text-foreground shadow-xl',
}: FilterDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className={contentClassName}>
        <DrawerHeader>
          <DrawerTitle className="text-foreground">{title}</DrawerTitle>
          <DrawerDescription className="sr-only">{title}</DrawerDescription>
        </DrawerHeader>
        {children}
      </DrawerContent>
    </Drawer>
  );
}
