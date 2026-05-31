'use server';

import { updateUserProfileUseCase } from '@/server/use-cases/users/user.use-cases';
import {
  getUserPreferencesUseCase,
  updateUserPreferencesUseCase,
} from '@/server/use-cases/users/get-user-preferences.use-case';
import { createGroupInvitationUseCase } from '@/server/use-cases/groups/group-invitations.use-cases';
import type { UserPreferences, GroupInvitation } from '@/lib/types';
import type { UserPreferencesUpdate } from '@/lib/types';
import type { ServiceResult } from '@/lib/types/service-result';

/**
 * Updates user profile (name and/or email)
 * Server action for EditProfileModal
 *
 * @param userId - User ID
 * @param updates - Profile updates
 * @returns Updated user or error
 */
export async function updateUserProfileAction(
  userId: string,
  updates: { name?: string | undefined; email?: string | undefined }
): Promise<ServiceResult<{ id: string; name: string; email: string }>> {
  try {
    // Input validation
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

    // Update user profile via use case
    const data = await updateUserProfileUseCase(userId, updates);

    // Return minimal user data (avoid sending sensitive fields)
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
 * Gets user preferences
 * Server action for settings page initialization
 *
 * @param userId - User ID
 * @returns User preferences or error
 */
export async function getUserPreferencesAction(
  userId: string
): Promise<ServiceResult<UserPreferences>> {
  try {
    // Input validation
    if (!userId || userId.trim() === '') {
      return {
        data: null,
        error: 'User ID is required',
      };
    }

    // Get preferences via use case (with lazy initialization)
    const data = await getUserPreferencesUseCase(userId);

    return {
      data: data as unknown as UserPreferences,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get preferences',
    };
  }
}

/**
 * Updates user preferences (currency, language, timezone, notifications)
 * Server action for PreferenceSelectModal and notification toggles
 *
 * @param userId - User ID
 * @param updates - Preference updates
 * @returns Updated preferences or error
 */
export async function updateUserPreferencesAction(
  userId: string,
  updates: UserPreferencesUpdate
): Promise<ServiceResult<UserPreferences>> {
  try {
    // Input validation
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

    // Update preferences via use case
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
 * Server action for InviteMemberModal
 *
 * @param groupId - Group ID
 * @param invitedByUserId - User ID of the inviter
 * @param email - Email address to invite
 * @returns Created invitation or error
 */
export async function sendGroupInvitationAction(
  groupId: string,
  invitedByUserId: string,
  email: string
): Promise<ServiceResult<GroupInvitation>> {
  try {
    // Input validation
    if (!groupId || groupId.trim() === '') {
      return {
        data: null,
        error: 'Group ID is required',
      };
    }

    if (!invitedByUserId || invitedByUserId.trim() === '') {
      return {
        data: null,
        error: 'Inviter user ID is required',
      };
    }

    if (!email || email.trim() === '') {
      return {
        data: null,
        error: 'Email is required',
      };
    }

    // Create invitation via use case
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
