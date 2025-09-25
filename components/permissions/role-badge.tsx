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
          color: 'amber',
          bgClass: variant === 'outline'
            ? 'border-amber-200 text-amber-800 bg-transparent hover:bg-amber-50'
            : variant === 'subtle'
            ? 'bg-amber-50 text-amber-700 border-amber-100'
            : 'bg-amber-100 text-amber-800 border-amber-200',
          icon: Crown,
        };
      case 'admin':
        return {
          color: 'blue',
          bgClass: variant === 'outline'
            ? 'border-blue-200 text-blue-800 bg-transparent hover:bg-blue-50'
            : variant === 'subtle'
            ? 'bg-blue-50 text-blue-700 border-blue-100'
            : 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Shield,
        };
      default:
        return {
          color: 'green',
          bgClass: variant === 'outline'
            ? 'border-green-200 text-green-800 bg-transparent hover:bg-green-50'
            : variant === 'subtle'
            ? 'bg-green-50 text-green-700 border-green-100'
            : 'bg-green-100 text-green-800 border-green-200',
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
      color: 'bg-gray-200',
      dots: 1,
    },
    medium: {
      label: 'Standard',
      color: 'bg-blue-400',
      dots: 2,
    },
    high: {
      label: 'Completo',
      color: 'bg-amber-400',
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
              index < config.dots ? config.color : 'bg-gray-200'
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className={cn(
          'font-medium text-gray-700',
          size === 'sm' ? 'text-xs' : 'text-sm'
        )}>
          {config.label}
        </span>
      )}
    </div>
  );
};

export default RoleBadge;
