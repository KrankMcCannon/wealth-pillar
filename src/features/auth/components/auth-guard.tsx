'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { authorizationService } from '@/lib';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRole?: 'member' | 'admin' | 'superadmin';
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireAuth = true,
  requireRole,
  fallback = <div>Loading...</div>
}: AuthGuardProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        router.push('/sign-in');
        return;
      }

      if (requireRole && user) {
        const hasRole = authorizationService.hasRole(user, requireRole);
        if (!hasRole) {
          router.push('/dashboard?error=insufficient-permissions');
          return;
        }
      }
    }
  }, [isLoading, isAuthenticated, user, requireAuth, requireRole, router]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (requireAuth && !isAuthenticated) {
    return <>{fallback}</>;
  }

  if (requireRole && user) {
    const hasRole = authorizationService.hasRole(user, requireRole);
    if (!hasRole) {
      return <div>Permessi insufficienti</div>;
    }
  }

  return <>{children}</>;
}
