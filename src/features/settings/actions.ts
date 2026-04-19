'use server';

import { clerkClient } from '@clerk/nextjs/server';
import {
  deleteUserUseCase,
  getUsersByGroupUseCase,
  updateUserProfileUseCase,
} from '@/server/use-cases/users/user.use-cases';
import {
  getUserPreferencesUseCase,
  updateUserPreferencesUseCase,
} from '@/server/use-cases/users/get-user-preferences.use-case';
import { createGroupInvitationUseCase } from '@/server/use-cases/groups/group-invitations.use-cases';
import type { UserPreferences, GroupInvitation } from '@/lib/types';
import type { UserPreferencesUpdate, User } from '@/lib/types';
import type { ServiceResult } from '@/lib/types/service-result';

/**
 * Deletes a user and all related data (accounts, transactions, budgets)
 * This also deletes the Clerk user account
 *
 * This is a destructive operation that cannot be undone
 */
export async function deleteUserAction(
  userId: string,
  clerkId: string
): Promise<ServiceResult<boolean>> {
  try {
    // Input validation
    if (!userId || userId.trim() === '') {
      return {
        data: null,
        error: 'User ID is required',
      };
    }

    if (!clerkId || clerkId.trim() === '') {
      return {
        data: null,
        error: 'Clerk ID is required',
      };
    }

    // Delete user and all related data from database
    await deleteUserUseCase(userId);

    // Delete Clerk user
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkId);
    } catch (clerkError) {
      console.error('Failed to delete Clerk user:', clerkError);
      // Don't return error here - database deletion succeeded
      // Clerk deletion is best-effort
    }

    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete user',
    };
  }
}

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

/**
 * Gets all users in a specific group
 * Server action for Group Management Section
 *
 * @param groupId - Group ID
 * @returns List of users or error
 */
export async function getGroupUsersAction(groupId: string): Promise<User[] | null> {
  try {
    if (!groupId || groupId.trim() === '') {
      return null;
    }

    const users = await getUsersByGroupUseCase(groupId);
    return users as unknown as User[];
  } catch (error) {
    console.error('Failed to get group users:', error);
    return null;
  }
}

/**
 * Manages subscription (placeholder for Stripe integration)
 * Server action for SubscriptionModal
 *
 * @param groupId - Group ID
 * @param action - Subscription action ('upgrade' | 'cancel')
 * @returns Success status or error
 */
export async function updateSubscriptionAction(
  groupId: string,
  action: 'upgrade' | 'cancel'
): Promise<ServiceResult<{ message: string }>> {
  try {
    // Input validation
    if (!groupId || groupId.trim() === '') {
      return {
        data: null,
        error: 'Group ID is required',
      };
    }

    // TODO: Implement Stripe subscription management
    // This is a placeholder for future Stripe integration

    if (action === 'upgrade') {
      // TODO: Create Stripe checkout session
      // const session = await stripe.checkout.sessions.create({...});
      // return { data: { checkoutUrl: session.url }, error: null };

      return {
        data: { message: 'Stripe integration coming soon' },
        error: null,
      };
    }

    if (action === 'cancel') {
      // TODO: Cancel Stripe subscription
      // await stripe.subscriptions.cancel(subscriptionId);

      return {
        data: { message: 'Subscription cancellation coming soon' },
        error: null,
      };
    }

    return {
      data: null,
      error: 'Invalid action',
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update subscription',
    };
  }
}
