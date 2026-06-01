'use server';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { updateUserProfileUseCase } from '@/server/use-cases/users/user.use-cases';
import { updateUserPreferencesUseCase } from '@/server/use-cases/users/get-user-preferences.use-case';
import { createGroupInvitationUseCase } from '@/server/use-cases/groups/group-invitations.use-cases';
import { updateGroupUseCase } from '@/server/use-cases/groups/groups.use-cases';
import type { UserPreferences, GroupInvitation } from '@/lib/types';
import type { UserPreferencesUpdate } from '@/lib/types';
import type { ServiceResult } from '@/lib/types/service-result';
import type { User } from '@/lib/types';

/** Members may update self only. */
function assertSelfOrDenied(currentUser: User, targetUserId: string): string | null {
  if (currentUser.id !== targetUserId) {
    return 'Permission denied';
  }
  return null;
}

/**
 * Updates user profile (name and/or email)
 * Server action for EditProfileModal
 */
export async function updateUserProfileAction(
  userId: string,
  updates: { name?: string | undefined; email?: string | undefined }
): Promise<ServiceResult<{ id: string; name: string; email: string }>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Not authenticated' };
    }

    const permissionError = assertSelfOrDenied(currentUser as unknown as User, userId);
    if (permissionError) {
      return { data: null, error: permissionError };
    }

    if (!userId || userId.trim() === '') {
      return {
        data: null,
        error: 'User ID is required',
      };
    }

    if (!updates || Object.keys(updates).length === 0) {
      return {
        data: null,
        error: 'At least one field must be provided',
      };
    }

    const data = await updateUserProfileUseCase(userId, updates);

    return {
      data: {
        id: data.id,
        name: data.name ?? '',
        email: data.email ?? '',
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update profile',
    };
  }
}

/**
 * Updates user preferences (currency, language, timezone, notifications)
 */
export async function updateUserPreferencesAction(
  userId: string,
  updates: UserPreferencesUpdate
): Promise<ServiceResult<UserPreferences>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Not authenticated' };
    }

    const permissionError = assertSelfOrDenied(currentUser as unknown as User, userId);
    if (permissionError) {
      return { data: null, error: permissionError };
    }

    if (!userId || userId.trim() === '') {
      return {
        data: null,
        error: 'User ID is required',
      };
    }

    if (!updates || Object.keys(updates).length === 0) {
      return {
        data: null,
        error: 'At least one field must be provided',
      };
    }

    const data = await updateUserPreferencesUseCase(
      userId,
      updates as Parameters<typeof updateUserPreferencesUseCase>[1]
    );

    return {
      data: data as unknown as UserPreferences,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update preferences',
    };
  }
}

/**
 * Sends a group invitation email
 */
export async function sendGroupInvitationAction(
  groupId: string,
  invitedByUserId: string,
  email: string
): Promise<ServiceResult<GroupInvitation>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Not authenticated' };
    }

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
    if (!isAdmin) {
      return { data: null, error: 'Permission denied' };
    }

    if (currentUser.id !== invitedByUserId) {
      return { data: null, error: 'Permission denied' };
    }

    if (!groupId || groupId.trim() === '') {
      return {
        data: null,
        error: 'Group ID is required',
      };
    }

    if (currentUser.group_id !== groupId) {
      return { data: null, error: 'Permission denied' };
    }

    if (!email || email.trim() === '') {
      return {
        data: null,
        error: 'Email is required',
      };
    }

    const data = await createGroupInvitationUseCase({
      groupId,
      invitedByUserId,
      email: email.trim(),
    });

    return {
      data: data as unknown as GroupInvitation,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to send invitation',
    };
  }
}

/**
 * Updates group name (admin only)
 */
export async function updateGroupAction(
  groupId: string,
  name: string
): Promise<ServiceResult<{ id: string; name: string }>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Not authenticated' };
    }

    const isAdmin = currentUser.role === 'admin' || currentUser.role === 'superadmin';
    if (!isAdmin) {
      return { data: null, error: 'Permission denied' };
    }

    if (!groupId || groupId.trim() === '') {
      return { data: null, error: 'Group ID is required' };
    }

    if (currentUser.group_id !== groupId) {
      return { data: null, error: 'Permission denied' };
    }

    if (!name || name.trim() === '') {
      return { data: null, error: 'Group name is required' };
    }

    const data = await updateGroupUseCase(groupId, { name: name.trim() });

    return {
      data: {
        id: data.id,
        name: data.name ?? '',
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update group',
    };
  }
}
