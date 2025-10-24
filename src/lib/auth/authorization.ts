/**
 * Authorization Service - Centralized permission and role management
 */

import { AuthUser } from './auth';

// Resource types in the system
export const RESOURCE_TYPES = {
  TRANSACTION: 'transaction',
  ACCOUNT: 'account',
  BUDGET: 'budget',
  INVESTMENT: 'investment',
  USER: 'user',
  GROUP: 'group',
  REPORT: 'report',
  ADMIN_PANEL: 'admin_panel',
} as const;

export type ResourceType = typeof RESOURCE_TYPES[keyof typeof RESOURCE_TYPES];

// Actions that can be performed
export const ACTIONS = {
  CREATE: 'create',
  READ: 'read',
  UPDATE: 'update',
  DELETE: 'delete',
  MANAGE: 'manage', // Full access
  VIEW_ALL: 'view_all', // View all records
  EXPORT: 'export',
  IMPORT: 'import',
  ANALYZE: 'analyze',
} as const;

export type Action = typeof ACTIONS[keyof typeof ACTIONS];

// Permission structure
export interface Permission {
  resource: ResourceType;
  action: Action;
  scope: 'own' | 'group' | 'all';
}

// Resource context for permission checking
export interface ResourceContext {
  resourceType: ResourceType;
  resourceId?: string;
  resourceUserId?: string;
  resourceGroupId?: string;
  metadata?: Record<string, unknown>;
}

// Abstract base for permission strategies (Strategy Pattern)
export abstract class PermissionStrategy {
  abstract canAccess(
    user: AuthUser,
    action: Action,
    context: ResourceContext
  ): boolean;
}

// Role-based permission strategy
// Base permissions for roles
const MEMBER_PERMISSIONS: Permission[] = [
      // Own data access
      { resource: RESOURCE_TYPES.TRANSACTION, action: ACTIONS.READ, scope: 'own' },
      { resource: RESOURCE_TYPES.TRANSACTION, action: ACTIONS.CREATE, scope: 'own' },
      { resource: RESOURCE_TYPES.TRANSACTION, action: ACTIONS.UPDATE, scope: 'own' },
      { resource: RESOURCE_TYPES.TRANSACTION, action: ACTIONS.DELETE, scope: 'own' },

      { resource: RESOURCE_TYPES.ACCOUNT, action: ACTIONS.READ, scope: 'own' },
      { resource: RESOURCE_TYPES.ACCOUNT, action: ACTIONS.CREATE, scope: 'own' },
      { resource: RESOURCE_TYPES.ACCOUNT, action: ACTIONS.UPDATE, scope: 'own' },

      { resource: RESOURCE_TYPES.BUDGET, action: ACTIONS.READ, scope: 'own' },
      { resource: RESOURCE_TYPES.BUDGET, action: ACTIONS.CREATE, scope: 'own' },
      { resource: RESOURCE_TYPES.BUDGET, action: ACTIONS.UPDATE, scope: 'own' },
      { resource: RESOURCE_TYPES.BUDGET, action: ACTIONS.DELETE, scope: 'own' },

      { resource: RESOURCE_TYPES.INVESTMENT, action: ACTIONS.READ, scope: 'own' },
      { resource: RESOURCE_TYPES.INVESTMENT, action: ACTIONS.CREATE, scope: 'own' },
      { resource: RESOURCE_TYPES.INVESTMENT, action: ACTIONS.UPDATE, scope: 'own' },
      { resource: RESOURCE_TYPES.INVESTMENT, action: ACTIONS.DELETE, scope: 'own' },

      { resource: RESOURCE_TYPES.REPORT, action: ACTIONS.READ, scope: 'own' },
      { resource: RESOURCE_TYPES.REPORT, action: ACTIONS.EXPORT, scope: 'own' },
];

export class RoleBasedPermissionStrategy extends PermissionStrategy {
  private readonly rolePermissions: Record<string, Permission[]> = {
    member: MEMBER_PERMISSIONS,

    admin: [
      // Inherit member permissions
      ...MEMBER_PERMISSIONS,

      // Group-level access
      { resource: RESOURCE_TYPES.TRANSACTION, action: ACTIONS.READ, scope: 'group' },
      { resource: RESOURCE_TYPES.TRANSACTION, action: ACTIONS.ANALYZE, scope: 'group' },

      { resource: RESOURCE_TYPES.ACCOUNT, action: ACTIONS.READ, scope: 'group' },
      { resource: RESOURCE_TYPES.ACCOUNT, action: ACTIONS.MANAGE, scope: 'group' },

      { resource: RESOURCE_TYPES.BUDGET, action: ACTIONS.READ, scope: 'group' },
      { resource: RESOURCE_TYPES.BUDGET, action: ACTIONS.ANALYZE, scope: 'group' },

      { resource: RESOURCE_TYPES.INVESTMENT, action: ACTIONS.READ, scope: 'group' },
      { resource: RESOURCE_TYPES.INVESTMENT, action: ACTIONS.ANALYZE, scope: 'group' },

      { resource: RESOURCE_TYPES.USER, action: ACTIONS.READ, scope: 'group' },
      { resource: RESOURCE_TYPES.USER, action: ACTIONS.VIEW_ALL, scope: 'group' },
      { resource: RESOURCE_TYPES.USER, action: ACTIONS.UPDATE, scope: 'group' },

      { resource: RESOURCE_TYPES.REPORT, action: ACTIONS.READ, scope: 'group' },
      { resource: RESOURCE_TYPES.REPORT, action: ACTIONS.EXPORT, scope: 'group' },
      { resource: RESOURCE_TYPES.REPORT, action: ACTIONS.ANALYZE, scope: 'group' },

      { resource: RESOURCE_TYPES.GROUP, action: ACTIONS.READ, scope: 'own' },
      { resource: RESOURCE_TYPES.GROUP, action: ACTIONS.UPDATE, scope: 'own' },
    ],

    superadmin: [
      // Full system access
      { resource: RESOURCE_TYPES.TRANSACTION, action: ACTIONS.MANAGE, scope: 'all' },
      { resource: RESOURCE_TYPES.ACCOUNT, action: ACTIONS.MANAGE, scope: 'all' },
      { resource: RESOURCE_TYPES.BUDGET, action: ACTIONS.MANAGE, scope: 'all' },
      { resource: RESOURCE_TYPES.INVESTMENT, action: ACTIONS.MANAGE, scope: 'all' },
      { resource: RESOURCE_TYPES.USER, action: ACTIONS.MANAGE, scope: 'all' },
      { resource: RESOURCE_TYPES.GROUP, action: ACTIONS.MANAGE, scope: 'all' },
      { resource: RESOURCE_TYPES.REPORT, action: ACTIONS.MANAGE, scope: 'all' },
      { resource: RESOURCE_TYPES.ADMIN_PANEL, action: ACTIONS.MANAGE, scope: 'all' },
    ],
  };

  private getRolePermissions(role: string): Permission[] {
    return this.rolePermissions[role] || [];
  }

  canAccess(user: AuthUser, action: Action, context: ResourceContext): boolean {
    const userPermissions = this.getRolePermissions(user.role);

    return userPermissions.some(permission => {
      // Check resource type and action match
      if (permission.resource !== context.resourceType ||
          (permission.action !== action && permission.action !== ACTIONS.MANAGE)) {
        return false;
      }

      // Check scope-based access
      return this.checkScopeAccess(user, permission.scope, context);
    });
  }

  private checkScopeAccess(
    user: AuthUser,
    scope: Permission['scope'],
    context: ResourceContext
  ): boolean {
    switch (scope) {
      case 'all':
        return true;

      case 'group':
        return user.group_id === context.resourceGroupId;

      case 'own':
        return user.id === context.resourceUserId;

      default:
        return false;
    }
  }
}

// Permission checker interface (Dependency Inversion)
export interface IPermissionChecker<ResourceEntity = unknown> {
  canAccess(user: AuthUser, action: Action, context: ResourceContext): boolean;
  canAccessResource(user: AuthUser, action: Action, resource: ResourceEntity): boolean;
  hasRole(user: AuthUser, requiredRole: string): boolean;
}

// Main authorization service
import type { Account, User as AppUser, Budget, Group, InvestmentHolding, Transaction } from '@/lib/types';
type ResourceEntity = Transaction | Account | Budget | InvestmentHolding | AppUser | Group;

export class AuthorizationService implements IPermissionChecker<ResourceEntity> {
  constructor(private permissionStrategy: PermissionStrategy) {}

  canAccess(user: AuthUser, action: Action, context: ResourceContext): boolean {
    return this.permissionStrategy.canAccess(user, action, context);
  }

  canAccessResource(user: AuthUser, action: Action, resource: ResourceEntity): boolean {
    const context: ResourceContext = {
      resourceType: this.inferResourceType(resource),
      resourceId: 'id' in resource ? String(resource.id) : undefined,
      resourceUserId: 'user_id' in resource ? String(resource.user_id) : undefined,
      resourceGroupId: 'group_id' in resource ? String(resource.group_id) : undefined,
      metadata: resource as unknown as Record<string, unknown>,
    };

    return this.canAccess(user, action, context);
  }

  hasRole(user: AuthUser, requiredRole: string): boolean {
    const roleHierarchy = { member: 0, admin: 1, superadmin: 2 };
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] ?? -1;
    const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] ?? 999;

    return userLevel >= requiredLevel;
  }

  // Feature flags and conditional access
  canAccessFeature(user: AuthUser, feature: string): boolean {
    const featureAccess: Record<string, string[]> = {
      'advanced_analytics': ['admin', 'superadmin'],
      'bulk_operations': ['admin', 'superadmin'],
      'user_management': ['admin', 'superadmin'],
      'system_settings': ['superadmin'],
      'export_data': ['member', 'admin', 'superadmin'],
      'group_insights': ['admin', 'superadmin'],
    };

    return featureAccess[feature]?.includes(user.role) || false;
  }

  // Helper to get available actions for a resource
  getAvailableActions(user: AuthUser, context: ResourceContext): Action[] {
    const allActions = Object.values(ACTIONS);
    return allActions.filter(action =>
      this.canAccess(user, action, context)
    );
  }

  private inferResourceType(resource: ResourceEntity): ResourceType {
    // Infer resource type from object structure
    if ('amount' in resource && 'category' in resource) {
      return RESOURCE_TYPES.TRANSACTION;
    }
    if ('type' in resource && ['payroll', 'savings', 'cash', 'investments'].includes(String(resource.type))) {
      return RESOURCE_TYPES.ACCOUNT;
    }
    if ('symbol' in resource && 'quantity' in resource) {
      return RESOURCE_TYPES.INVESTMENT;
    }
    if ('description' in resource && 'categories' in resource) {
      return RESOURCE_TYPES.BUDGET;
    }
    if ('name' in resource && 'email' in resource && 'role' in resource) {
      return RESOURCE_TYPES.USER;
    }
    if ('user_ids' in resource && 'plan' in resource) {
      return RESOURCE_TYPES.GROUP;
    }

    return RESOURCE_TYPES.TRANSACTION; // Default fallback
  }
}

// Singleton instance
export const authorizationService = new AuthorizationService(
  new RoleBasedPermissionStrategy()
);

// Convenience functions for common checks
export const createPermissionChecker = (user: AuthUser | null) => ({
  canRead: (resource: ResourceEntity) =>
    user ? authorizationService.canAccessResource(user, ACTIONS.READ, resource) : false,
  canCreate: (resourceType: ResourceType) =>
    user ? authorizationService.canAccess(user, ACTIONS.CREATE, { resourceType }) : false,
  canUpdate: (resource: ResourceEntity) =>
    user ? authorizationService.canAccessResource(user, ACTIONS.UPDATE, resource) : false,
  canDelete: (resource: ResourceEntity) =>
    user ? authorizationService.canAccessResource(user, ACTIONS.DELETE, resource) : false,
  canManage: (resourceType: ResourceType) =>
    user ? authorizationService.canAccess(user, ACTIONS.MANAGE, { resourceType }) : false,
  canViewAll: (resourceType: ResourceType) =>
    user ? authorizationService.canAccess(user, ACTIONS.VIEW_ALL, { resourceType }) : false,
  canExport: (resourceType: ResourceType) =>
    user ? authorizationService.canAccess(user, ACTIONS.EXPORT, { resourceType }) : false,
  hasRole: (role: string) =>
    user ? authorizationService.hasRole(user, role) : false,
  canAccessFeature: (feature: string) =>
    user ? authorizationService.canAccessFeature(user, feature) : false,
});
