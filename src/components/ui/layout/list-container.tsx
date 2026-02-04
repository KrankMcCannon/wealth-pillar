'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { layoutStyles } from '@/styles/system';

export interface ListContainerProps {
  children: React.ReactNode;
  divided?: boolean;
  className?: string;
}

export function ListContainer({
  children,
  divided = false,
  className,
}: Readonly<ListContainerProps>) {
  return (
    <div
      className={cn(layoutStyles.list.container, divided && layoutStyles.list.divided, className)}
    >
      {children}
    </div>
  );
}

export interface ListItemProps {
  children: React.ReactNode;
  className?: string;
}

export function ListItem({ children, className }: Readonly<ListItemProps>) {
  return <div className={cn(layoutStyles.list.item, className)}>{children}</div>;
}
