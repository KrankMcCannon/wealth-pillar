'use client';

import { usePermissions, useRoleBasedUI } from '@/src/lib';
import { ReactNode } from 'react';

interface PermissionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;

  // Controlli basati su ruoli
  requireRole?: 'member' | 'admin' | 'superadmin';
  allowRoles?: Array<'member' | 'admin' | 'superadmin'>;

  // Controlli basati su feature
  requireFeature?: string;

  // Controlli personalizzati
  condition?: boolean;
  customCheck?: () => boolean;

  // Modalità di visualizzazione
  showFallback?: boolean;
  hideCompletely?: boolean;
}

/**
 * Componente per controllo condizionale della visibilità basato sui permessi
 * Segue il principio DRY centralizzando i controlli di autorizzazione
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  fallback = null,
  requireRole,
  allowRoles,
  requireFeature,
  condition = true,
  customCheck,
  showFallback = true,
  hideCompletely = false,
}) => {
  const { permissions } = usePermissions();

  // Controllo ruolo richiesto
  if (requireRole) {
    const hasRequiredRole = permissions.hasRole(requireRole);
    if (!hasRequiredRole) {
      if (hideCompletely) return null;
      return showFallback ? <>{fallback}</> : null;
    }
  }

  // Controllo ruoli permessi
  if (allowRoles && allowRoles.length > 0) {
    const hasAllowedRole = allowRoles.some(role => permissions.hasRole(role));
    if (!hasAllowedRole) {
      if (hideCompletely) return null;
      return showFallback ? <>{fallback}</> : null;
    }
  }

  // Controllo feature
  if (requireFeature) {
    const hasFeature = permissions.canAccessFeature(requireFeature);
    if (!hasFeature) {
      if (hideCompletely) return null;
      return showFallback ? <>{fallback}</> : null;
    }
  }

  // Controllo condizione personalizzata
  if (!condition) {
    if (hideCompletely) return null;
    return showFallback ? <>{fallback}</> : null;
  }

  // Controllo personalizzato
  if (customCheck && !customCheck()) {
    if (hideCompletely) return null;
    return showFallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

interface RoleBasedContentProps {
  children: ReactNode;
  memberContent?: ReactNode;
  adminContent?: ReactNode;
  superAdminContent?: ReactNode;
}

/**
 * Componente per rendering condizionale basato sul ruolo
 */
export const RoleBasedContent: React.FC<RoleBasedContentProps> = ({
  children,
  memberContent,
  adminContent,
  superAdminContent,
}) => {
  const { isMember, isAdmin, isSuperAdmin } = useRoleBasedUI();

  if (isSuperAdmin && superAdminContent) {
    return <>{superAdminContent}</>;
  }

  if (isAdmin && adminContent) {
    return <>{adminContent}</>;
  }

  if (isMember && memberContent) {
    return <>{memberContent}</>;
  }

  return <>{children}</>;
};

interface FeatureToggleProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Componente per abilitazione condizionale delle feature
 */
export const FeatureToggle: React.FC<FeatureToggleProps> = ({
  feature,
  children,
  fallback = null,
}) => {
  const { permissions } = usePermissions();

  if (permissions.canAccessFeature(feature)) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
};

/**
 * HOC per proteggere componenti con permessi
 */
export function withPermissions<P extends object>(
  Component: React.ComponentType<P>,
  permissionConfig: Omit<PermissionGuardProps, 'children'>
) {
  return function ProtectedComponent(props: P) {
    return (
      <PermissionGuard {...permissionConfig}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}

export default PermissionGuard;
