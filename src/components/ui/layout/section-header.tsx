'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';

const headerRow = 'flex items-center justify-between gap-3';
const headerTitle = 'text-lg font-semibold text-primary';
const headerSubtitle = 'text-sm text-muted-foreground';
const headerActions = 'flex items-center gap-2';

export interface SectionHeaderProps {
  title: React.ReactNode;
  /** Per aria-labelledby su sezioni contenitore */
  titleId?: string;
  /** Livello heading per gerarchia sotto la pagina */
  titleAs?: 'h2' | 'h3' | 'h4';
  subtitle?: React.ReactNode;
  icon?: React.ElementType<{ className?: string }>;
  iconClassName?: string;
  leading?: React.ReactNode;
  badge?: {
    text: string;
    className?: string;
  };
  actions?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  children?: React.ReactNode;
}

export function SectionHeader({
  title,
  titleId,
  titleAs = 'h2',
  subtitle,
  icon: Icon,
  iconClassName = 'text-primary',
  leading,
  badge,
  actions,
  className,
  titleClassName,
  subtitleClassName,
  children,
}: Readonly<SectionHeaderProps>) {
  return (
    <div className={cn(headerRow, className)}>
      <div className="flex flex-col gap-1">
        <Text as={titleAs} id={titleId} className={cn(headerTitle, titleClassName)}>
          {title}
        </Text>
        {subtitle && (
          <Text as="p" className={cn(headerSubtitle, subtitleClassName)}>
            {subtitle}
          </Text>
        )}
      </div>
      {(Icon || leading || badge || actions || children) && (
        <div className={headerActions}>
          {Icon && <Icon className={iconClassName} />}
          {leading}
          {badge && <Badge className={badge.className}>{badge.text}</Badge>}
          {actions}
          {children}
        </div>
      )}
    </div>
  );
}
