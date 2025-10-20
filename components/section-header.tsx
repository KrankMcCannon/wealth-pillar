"use client";

import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/primitives";
import { LucideIcon } from "lucide-react";

interface SectionHeaderProps {
  title: string;
  icon?: LucideIcon;
  iconClassName?: string;
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
  badge,
  subtitle,
  className = "",
  children
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <div className="flex-1">
        <Text
          variant="heading"
          size="lg"
          as="h2"
          className="flex items-center gap-2"
        >
          {Icon && <Icon className={`h-5 w-5 ${iconClassName}`} />}
          {title}
        </Text>
        {subtitle && (
          <Text variant="muted" size="sm" className="mt-1">
            {subtitle}
          </Text>
        )}
      </div>
      {badge && (
        <Badge className={badge.className}>
          {badge.text}
        </Badge>
      )}
      {children && (
        <div className="flex items-center gap-2">
          {children}
        </div>
      )}
    </div>
  );
}
