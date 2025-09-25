'use client';

import {
  ACTIONS,
  authorizationService,
  createPermissionChecker,
  RESOURCE_TYPES,
  type ResourceContext,
  type ResourceType,
} from '@/lib/authorization';
import type { Account, Budget, InvestmentHolding, Transaction, User } from '@/lib/types';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useAuth } from './useAuth';

/**
 * Hook per la gestione centralizzata dei permessi
 */
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  const { data: permissionChecker } = useQuery({
    queryKey: ['permissions', user?.id],
    queryFn: () => createPermissionChecker(user),
    enabled: isAuthenticated && !!user,
    staleTime: 5 * 60 * 1000, // Cache per 5 minuti
    gcTime: 10 * 60 * 1000, // Mantieni in memoria per 10 minuti
  });

  // Memoizza i checker di permesso più comuni
  const permissions = useMemo(() => {
    if (!permissionChecker) {
      return {
        canRead: () => false,
        canCreate: () => false,
        canUpdate: () => false,
        canDelete: () => false,
        canManage: () => false,
        canViewAll: () => false,
        canExport: () => false,
        hasRole: () => false,
        canAccessFeature: () => false,
      };
    }
    return permissionChecker;
  }, [permissionChecker]);

  return {
    permissions,
    user,
    isAuthenticated,
  };
};

/**
 * Hook specializzato per i permessi delle transazioni
 */
export const useTransactionPermissions = () => {
  const { permissions } = usePermissions();

  return useMemo(() => ({
    canCreateTransaction: permissions.canCreate(RESOURCE_TYPES.TRANSACTION),
    canViewAllTransactions: permissions.canViewAll(RESOURCE_TYPES.TRANSACTION),
    canExportTransactions: permissions.canExport(RESOURCE_TYPES.TRANSACTION),
    canAnalyzeTransactions: permissions.canAccessFeature('advanced_analytics'),
    canBulkEditTransactions: permissions.canAccessFeature('bulk_operations'),

    // Funzioni specifiche per transazioni
    canReadTransaction: (transaction: Transaction) => permissions.canRead(transaction),
    canUpdateTransaction: (transaction: Transaction) => permissions.canUpdate(transaction),
    canDeleteTransaction: (transaction: Transaction) => permissions.canDelete(transaction),
  }), [permissions]);
};

/**
 * Hook per i permessi degli account
 */
export const useAccountPermissions = () => {
  const { permissions } = usePermissions();

  return useMemo(() => ({
    canCreateAccount: permissions.canCreate(RESOURCE_TYPES.ACCOUNT),
    canViewAllAccounts: permissions.canViewAll(RESOURCE_TYPES.ACCOUNT),
    canManageAccounts: permissions.canManage(RESOURCE_TYPES.ACCOUNT),

    canReadAccount: (account: Account) => permissions.canRead(account),
    canUpdateAccount: (account: Account) => permissions.canUpdate(account),
    canDeleteAccount: (account: Account) => permissions.canDelete(account),
  }), [permissions]);
};

/**
 * Hook per i permessi dei budget
 */
export const useBudgetPermissions = () => {
  const { permissions } = usePermissions();

  return useMemo(() => ({
    canCreateBudget: permissions.canCreate(RESOURCE_TYPES.BUDGET),
    canViewAllBudgets: permissions.canViewAll(RESOURCE_TYPES.BUDGET),
    canAnalyzeBudgets: permissions.canAccessFeature('advanced_analytics'),

    canReadBudget: (budget: Budget) => permissions.canRead(budget),
    canUpdateBudget: (budget: Budget) => permissions.canUpdate(budget),
    canDeleteBudget: (budget: Budget) => permissions.canDelete(budget),
  }), [permissions]);
};

/**
 * Hook per i permessi degli investimenti
 */
export const useInvestmentPermissions = () => {
  const { permissions } = usePermissions();

  return useMemo(() => ({
    canCreateInvestment: permissions.canCreate(RESOURCE_TYPES.INVESTMENT),
    canViewAllInvestments: permissions.canViewAll(RESOURCE_TYPES.INVESTMENT),
    canAnalyzeInvestments: permissions.canAccessFeature('advanced_analytics'),

    canReadInvestment: (investment: InvestmentHolding) => permissions.canRead(investment),
    canUpdateInvestment: (investment: InvestmentHolding) => permissions.canUpdate(investment),
    canDeleteInvestment: (investment: InvestmentHolding) => permissions.canDelete(investment),
  }), [permissions]);
};

/**
 * Hook per i permessi della gestione utenti
 */
export const useUserManagementPermissions = () => {
  const { permissions } = usePermissions();

  return useMemo(() => ({
    canManageUsers: permissions.canAccessFeature('user_management'),
    canViewAllUsers: permissions.canViewAll(RESOURCE_TYPES.USER),
    canManageGroup: permissions.canManage(RESOURCE_TYPES.GROUP),

    canReadUser: (targetUser: User) => permissions.canRead(targetUser),
    canUpdateUser: (targetUser: User) => permissions.canUpdate(targetUser),
    canDeleteUser: (targetUser: User) => permissions.canDelete(targetUser),
  }), [permissions]);
};

/**
 * Hook per i permessi dei report e analisi
 */
export const useReportPermissions = () => {
  const { permissions } = usePermissions();

  return useMemo(() => ({
    canViewReports: permissions.canViewAll(RESOURCE_TYPES.REPORT),
    canExportReports: permissions.canExport(RESOURCE_TYPES.REPORT),
    canViewAdvancedAnalytics: permissions.canAccessFeature('advanced_analytics'),
    canViewGroupInsights: permissions.canAccessFeature('group_insights'),
    canAccessSystemSettings: permissions.canAccessFeature('system_settings'),
  }), [permissions]);
};

/**
 * Hook per controlli di visibilità UI basati sui ruoli
 */
export const useRoleBasedUI = () => {
  const { permissions } = usePermissions();

  return useMemo(() => {
    const isAdmin = permissions.hasRole('admin');
    const isSuperAdmin = permissions.hasRole('superadmin');
    const isMember = !isAdmin && !isSuperAdmin;

    return {
      // Ruoli
      isAdmin,
      isSuperAdmin,
      isMember,

      // Sezioni UI condizionali
      showAdminPanel: isAdmin,
      showUserManagement: permissions.canAccessFeature('user_management'),
      showAdvancedAnalytics: permissions.canAccessFeature('advanced_analytics'),
      showSystemSettings: permissions.canAccessFeature('system_settings'),
      showGroupInsights: permissions.canAccessFeature('group_insights'),
      showBulkOperations: permissions.canAccessFeature('bulk_operations'),

      // Badge e indicatori
      userRoleDisplay: isSuperAdmin ? 'Sviluppatore' : isAdmin ? 'Admin' : 'Membro',
      userRoleColor: isSuperAdmin ? 'amber' : isAdmin ? 'blue' : 'green',

      // Menu items dinamici
      getVisibleMenuItems: () => {
        const baseItems = ['dashboard', 'transactions', 'budgets', 'investments'];
        const adminItems = isAdmin ? ['reports', 'users'] : [];
        const superAdminItems = isSuperAdmin ? ['admin', 'system'] : [];

        return [...baseItems, ...adminItems, ...superAdminItems];
      },
    };
  }, [permissions]);
};

/**
 * Hook per permessi contestuali con performance ottimizzata
 */
type BaseEntity = { id?: string; user_id?: string; group_id?: string };

export const useContextualPermissions = <T extends BaseEntity = BaseEntity>(
  resource: T | null,
  resourceType: ResourceType
) => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['contextual-permissions', user?.id, resource, resourceType],
    queryFn: () => {
      if (!user || !resource) return null;

      const context: ResourceContext = {
        resourceType,
        resourceId: resource.id,
        resourceUserId: resource.user_id,
        resourceGroupId: resource.group_id,
        metadata: resource,
      };

      return {
        canRead: authorizationService.canAccess(user, ACTIONS.READ, context),
        canUpdate: authorizationService.canAccess(user, ACTIONS.UPDATE, context),
        canDelete: authorizationService.canAccess(user, ACTIONS.DELETE, context),
        canManage: authorizationService.canAccess(user, ACTIONS.MANAGE, context),
        availableActions: authorizationService.getAvailableActions(user, context),
      };
    },
    enabled: !!user && !!resource,
    staleTime: 2 * 60 * 1000, // Cache per 2 minuti per permessi contestuali
  });
};
