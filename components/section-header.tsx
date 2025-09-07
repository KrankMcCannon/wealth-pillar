"use client";

import { Badge } from "@/components/ui/badge";
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
}

export function SectionHeader({ 
  title, 
  icon: Icon, 
  iconClassName = "",
  badge,
  subtitle,
  className = ""
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between mb-2 ${className}`}>
      <div className="flex-1">
        <h2 className="text-lg font-bold tracking-tight text-gray-900 flex items-center gap-2">
          {Icon && <Icon className={`h-5 w-5 ${iconClassName}`} />}
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
        )}
      </div>
      {badge && (
        <Badge className={badge.className}>
          {badge.text}
        </Badge>
      )}
    </div>
  );
}