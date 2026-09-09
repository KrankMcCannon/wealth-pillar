import type { ReactNode } from 'react';
import { stitchTransactions } from '@/styles/home-design-foundation';

type RouteEmptyStateProps = {
  title: string;
  description: string;
  children: ReactNode;
  role?: 'alert' | 'status';
};

export function RouteEmptyState({
  title,
  description,
  children,
  role = 'alert',
}: RouteEmptyStateProps) {
  return (
    <div className={stitchTransactions.emptyState} role={role}>
      <h1 className={stitchTransactions.emptyTitle}>{title}</h1>
      <p className={stitchTransactions.emptyDescription}>{description}</p>
      <div className={stitchTransactions.emptyActions}>{children}</div>
    </div>
  );
}
