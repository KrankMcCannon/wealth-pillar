'use client';

import { Badge } from '@/components/ui/badge';
import { useRoleBasedUI } from '@/hooks/usePermissions';
import { cn } from '@/lib/utils';
import { Shield, Crown, User } from 'lucide-react';

interface RoleBadgeProps {
  role?: 'member' | 'admin' | 'superadmin';
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'outline' | 'subtle';
  showIcon?: boolean;
  className?: string;
}

/**
 * Badge per visualizzare i ruoli utente con stili consistenti
 */
export const RoleBadge: React.FC<RoleBadgeProps> = ({
  role,
  size = 'md',
  variant = 'default',
  showIcon = true,
  className,
}) => {
  const { userRoleDisplay, isSuperAdmin, isAdmin } = useRoleBasedUI();

  // Usa il ruolo corrente se non specificato
  const currentRole = role || (isSuperAdmin ? 'superadmin' : isAdmin ? 'admin' : 'member');
  const displayRole = role
    ? (role === 'superadmin' ? 'Sviluppatore' : role === 'admin' ? 'Admin' : 'Membro')
    : userRoleDisplay;

  // Configurazione colori per ruolo
  const getRoleConfig = (roleType: string) => {
    switch (roleType) {
      case 'superadmin':
        return {
          color: 'primary',
          bgClass: variant === 'outline'
            ? 'border-primary/30 text-primary bg-transparent hover:bg-primary/5'
            : variant === 'subtle'
            ? 'bg-primary/10 text-primary border-primary/20'
            : 'bg-primary/10 text-primary border-primary/20',
          icon: Crown,
        };
      case 'admin':
        return {
          color: 'primary',
          bgClass: variant === 'outline'
            ? 'border-primary/30 text-primary bg-transparent hover:bg-primary/5'
            : variant === 'subtle'
            ? 'bg-primary/10 text-primary border-primary/20'
            : 'bg-primary/10 text-primary border-primary/20',
          icon: Shield,
        };
      default:
        return {
          color: 'primary',
          bgClass: variant === 'outline'
            ? 'border-primary/30 text-primary bg-transparent hover:bg-primary/5'
            : variant === 'subtle'
            ? 'bg-primary/10 text-primary border-primary/20'
            : 'bg-primary/10 text-primary border-primary/20',
          icon: User,
        };
    }
  };

  const config = getRoleConfig(currentRole);
  const Icon = config.icon;

  // Classi per dimensione
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  // Dimensioni icona
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-4 w-4',
  };

  return (
    <Badge
      className={cn(
        'inline-flex items-center gap-1.5 font-semibold border transition-colors',
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
  level: 'low' | 'medium' | 'high';
  size?: 'sm' | 'md';
  showLabel?: boolean;
}

/**
 * Indicatore del livello di permessi
 */
export const PermissionLevelIndicator: React.FC<PermissionLevelIndicatorProps> = ({
  level,
  size = 'md',
  showLabel = true,
}) => {
  const configs = {
    low: {
      label: 'Limitato',
      color: 'bg-primary/20',
      dots: 1,
    },
    medium: {
      label: 'Standard',
      color: 'bg-primary/40',
      dots: 2,
    },
    high: {
      label: 'Completo',
      color: 'bg-primary/60',
      dots: 3,
    },
  };

  const config = configs[level];
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className={cn(
              'rounded-full transition-colors',
              dotSize,
              index < config.dots ? config.color : 'bg-primary/20'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn(
          'font-medium text-primary',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default RoleBadge;
