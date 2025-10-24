/**
 * PageLayout - Standard page wrapper
 */

"use client";

import { cn } from '@/src/lib';

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  );
}
