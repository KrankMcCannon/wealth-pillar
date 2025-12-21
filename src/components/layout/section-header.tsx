"use client";

import { LucideIcon } from "lucide-react";
import { Badge, Text } from "../ui";

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  iconClassName?: string;
  leading?: React.ReactNode;
  badge?: {
    text: string;
    className?: string;
  };
  subtitle?: string;
  className?: string;
  children?: React.ReactNode;
}

export function SectionHeader({
  title,
  icon: Icon,
  iconClassName = "",
  leading,
  badge,
  subtitle,
  className = "",
  children,
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <div className="flex flex-1 flex-col">
        <Text variant="heading" size="lg" as="h2">
          {title}
        </Text>
        {subtitle && (
          <Text variant="muted" size="sm" className="mt-1">
            {subtitle}
          </Text>
        )}
      </div>
      <div className="flex items-center gap-2">
        {Icon && <Icon className={`h-5 w-5 ${iconClassName}`} />}
        {leading && <span className="shrink-0">{leading}</span>}
        {badge && <Badge className={badge.className}>{badge.text}</Badge>}
        {children}
      </div>
    </div>
  );
}
