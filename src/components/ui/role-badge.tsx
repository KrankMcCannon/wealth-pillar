"use client";

import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";
import { roleBadgeStyles } from "./theme/role-badge-styles";
import { Crown, Shield, User } from "lucide-react";

interface RoleBadgeProps {
  role?: "member" | "admin" | "superadmin";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "outline" | "subtle";
  showIcon?: boolean;
  className?: string;
}

/**
 * Badge per visualizzare i ruoli utente con stili consistenti
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role = "member",
  size = "md",
  variant = "subtle",
  showIcon = false,
  className
}) => {
  // Display text for each role
  const displayRole = role === 'superadmin'
    ? 'Sviluppatore'
    : role === 'admin'
    ? 'Admin'
    : 'Membro';

  // Get configuration for each role
  const getRoleConfig = (roleType: string) => {
    const baseConfig = {
      color: 'primary',
      bgClass: variant === 'outline'
        ? 'border-primary/30 text-primary bg-transparent hover:bg-primary/5'
        : variant === 'subtle'
        ? 'bg-primary/10 text-primary border-primary/20'
        : 'bg-primary/10 text-primary border-primary/20',
    };

    switch (roleType) {
      case 'superadmin':
        return { ...baseConfig, icon: Crown };
      case 'admin':
        return { ...baseConfig, icon: Shield };
      default:
        return { ...baseConfig, icon: User };
    }
  };

  const config = getRoleConfig(role);
  const Icon = config.icon;

  // Size classes
  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-2.5 py-1",
    lg: "text-sm px-3 py-1.5",
  };

  // Icon sizes
  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-4 w-4",
  };

  return (
    <Badge
      className={cn(
        "inline-flex items-center gap-1.5 font-semibold border transition-colors",
        config.bgClass,
        sizeClasses[size],
        className
      )}
    >
      {showIcon && (
        <Icon className={cn('shrink-0', iconSizes[size])} />
      )}
      <span>{displayRole}</span>
    </Badge>
  );
};

interface PermissionLevelIndicatorProps {
  level: "low" | "medium" | "high";
  size?: "sm" | "md";
  showLabel?: boolean;
}

/**
 * Indicatore del livello di permessi
 */
export const PermissionLevelIndicator: React.FC<PermissionLevelIndicatorProps> = ({
  level,
  size = "md",
  showLabel = true,
}) => {
  const configs = {
    low: {
      label: "Limitato",
      color: "bg-primary/20",
      dots: 1,
    },
    medium: {
      label: "Standard",
      color: "bg-primary/40",
      dots: 2,
    },
    high: {
      label: "Completo",
      color: "bg-primary/60",
      dots: 3,
    },
  };

  const config = configs[level];
  const dotSize = size === "sm" ? roleBadgeStyles.dotSmall : roleBadgeStyles.dotLarge;

  return (
    <div className={roleBadgeStyles.container}>
      <div className={roleBadgeStyles.dots}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              roleBadgeStyles.dotBase,
              dotSize,
              index < config.dots ? config.color : roleBadgeStyles.dotInactive
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn(roleBadgeStyles.label, size === "sm" ? roleBadgeStyles.labelSmall : roleBadgeStyles.labelLarge)}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default RoleBadge;
