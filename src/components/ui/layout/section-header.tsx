'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Text } from '@/components/ui/primitives';
import { Badge } from '@/components/ui/badge';
import { layoutStyles } from '@/styles/system';

export interface SectionHeaderProps {
  title: React.ReactNode;
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
    <div className={cn(layoutStyles.section.headerRow, className)}>
      <div className="flex flex-col gap-1">
        <Text as="h2" className={cn(layoutStyles.section.title, titleClassName)}>
          {title}
        </Text>
        {subtitle && (
          <Text as="p" className={cn(layoutStyles.section.subtitle, subtitleClassName)}>
            {subtitle}
          </Text>
        )}
      </div>
      {(Icon || leading || badge || actions || children) && (
        <div className={layoutStyles.section.actions}>
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
