"use client";

import { LucideIcon } from "lucide-react";
import { Badge, Text } from "../ui";
import { sectionHeaderStyles } from "./theme/section-header-styles";

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
    <div className={`${sectionHeaderStyles.container} ${className}`}>
      <div className={sectionHeaderStyles.titleColumn}>
        <Text variant="heading" size="lg" as="h2">
          {title}
        </Text>
        {subtitle && (
          <Text variant="muted" size="sm" className={sectionHeaderStyles.subtitle}>
            {subtitle}
          </Text>
        )}
      </div>
      <div className={sectionHeaderStyles.actions}>
        {Icon && <Icon className={`${sectionHeaderStyles.icon} ${iconClassName}`} />}
        {leading && <span className={sectionHeaderStyles.leading}>{leading}</span>}
        {badge && <Badge className={badge.className}>{badge.text}</Badge>}
        {children}
      </div>
    </div>
  );
}
