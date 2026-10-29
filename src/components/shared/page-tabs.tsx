'use client';

import type { ReactNode } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib';
import { stitchPageTabs } from '@/styles/home-design-foundation';

export type PageTabItem = {
  value: string;
  label: ReactNode;
};

type PageTabsProps = {
  value: string;
  items: readonly PageTabItem[];
  ariaLabel: string;
  onValueChange?: (value: string) => void;
  className?: string;
};

/** Capsule page switch — investments template, shared by dashboard pages. */
export function PageTabs({ value, items, ariaLabel, onValueChange, className }: PageTabsProps) {
  return (
    <Tabs
      value={value}
      className={cn(stitchPageTabs.wrap, 'w-full', className)}
      {...(onValueChange ? { onValueChange } : {})}
    >
      <TabsList className={stitchPageTabs.list} aria-label={ariaLabel}>
        {items.map((item) => (
          <TabsTrigger key={item.value} value={item.value} className={stitchPageTabs.trigger}>
            {item.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

type PageTabsStickyProps = PageTabsProps & {
  leading?: ReactNode;
};

/** Sticky chrome from Investimenti: optional member chips, then the capsule switch. */
export function PageTabsSticky({ leading, ...tabs }: PageTabsStickyProps) {
  return (
    <div className={stitchPageTabs.stickyBar}>
      <div className={stitchPageTabs.stickyStack}>
        {leading ? <div className={stitchPageTabs.leading}>{leading}</div> : null}
        <PageTabs {...tabs} />
      </div>
    </div>
  );
}

export function PageTabsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn(stitchPageTabs.wrap, 'w-full', className)} aria-hidden>
      <div className={stitchPageTabs.list}>
        <Skeleton className="h-9 w-full rounded-full" />
        <Skeleton className="h-9 w-full rounded-full" />
      </div>
    </div>
  );
}
