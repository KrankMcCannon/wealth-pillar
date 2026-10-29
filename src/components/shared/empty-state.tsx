'use client';

import { cn } from '@/lib';
import type { LucideIcon } from 'lucide-react';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export type EmptyStateVariant = 'default' | 'dashboard' | 'surface';

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  icon?: LucideIcon;
  title: string;
  titleId?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const variantClassName: Record<EmptyStateVariant, string> = {
  default: 'rounded-2xl border border-dashed border-border bg-card p-8',
  dashboard:
    'rounded-xl border border-border/50 bg-muted/30 px-4 py-3 text-sm text-muted-foreground',
  surface: 'rounded-2xl border border-border bg-card p-8 shadow-sm',
};

export function EmptyState({
  variant = 'default',
  icon: Icon,
  title,
  titleId,
  description,
  action,
  className,
}: Readonly<EmptyStateProps>) {
  if (variant === 'dashboard' && !Icon && !action) {
    return (
      <p className={cn(variantClassName.dashboard, className)} id={titleId}>
        {description ? `${title} — ${description}` : title}
      </p>
    );
  }

  return (
    <Empty className={cn(variantClassName[variant], className)}>
      <EmptyHeader>
        {Icon ? (
          <EmptyMedia variant="icon">
            <Icon />
          </EmptyMedia>
        ) : null}
        <EmptyTitle id={titleId}>{title}</EmptyTitle>
        {description ? <EmptyDescription>{description}</EmptyDescription> : null}
      </EmptyHeader>
      {action ? <EmptyContent>{action}</EmptyContent> : null}
    </Empty>
  );
}
