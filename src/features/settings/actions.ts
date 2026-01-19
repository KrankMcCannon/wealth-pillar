'use server';

import { clerkClient } from '@clerk/nextjs/server';
import {
  UserService,
  UserPreferencesService,
  GroupInvitationService,
} from '@/server/services';
import type { UserPreferences } from '@/server/services';
import type { UserPreferencesUpdate } from '@/lib/types';
import type { GroupInvitation } from '@/server/services';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

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
    await UserService.deleteUser(userId);

    // Delete Clerk user
    try {
      await (await clerkClient()).users.deleteUser(clerkId);
    } catch (clerkError) {
      console.error('Failed to delete Clerk user:', clerkError);
      // Don't return error here - database deletion succeeded
      // Clerk deletion is best-effort
    }

    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to delete user',
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
  updates: { name?: string; email?: string }
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

    // Update user profile via service
    const data = await UserService.updateProfile(userId, updates);

    // Return minimal user data (avoid sending sensitive fields)
    return {
      data: {
        id: data.id,
        name: data.name,
        email: data.email,
      },
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update profile',
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

    // Get preferences via service (with lazy initialization)
    const data = await UserPreferencesService.getUserPreferences(userId);

    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to get preferences',
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

    // Update preferences via service
    const data = await UserPreferencesService.updatePreferences(
      userId,
      updates
    );

    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update preferences',
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

    // Create invitation via service
    const data = await GroupInvitationService.createInvitation({
      groupId,
      invitedByUserId,
      email: email.trim(),
    });

    // TODO: Send actual email notification via Resend/SendGrid
    // For now, just return the created invitation
    // Example:
    // await sendInvitationEmail(email, data.invitation_token);

    return {
      data,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to send invitation',
    };
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
      error:
        error instanceof Error
          ? error.message
          : 'Failed to update subscription',
    };
  }
}
