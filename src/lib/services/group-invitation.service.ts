import { CACHE_TAGS, cached, cacheOptions, groupInvitationCacheKeys } from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import { nowISO } from '@/lib/utils/date-utils';
import type { ServiceResult } from './user.service';
import { randomBytes } from 'crypto';

/**
 * Helper to revalidate cache tags (dynamically imported to avoid client-side issues)
 */
async function revalidateCacheTags(tags: string[]) {
  if (globalThis.window === undefined) {
    const { revalidateTag } = await import('next/cache');
    for (const tag of tags) {
      revalidateTag(tag, 'max');
    }
  }
}

/**
 * Group Invitation type
 */
export interface GroupInvitation {
  id: string;
  group_id: string;
  invited_by_user_id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invitation_token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Invitation creation input
 */
export interface CreateInvitationInput {
  groupId: string;
  invitedByUserId: string;
  email: string;
}

/**
 * Group Invitation Service
 * Handles all group invitation-related business logic
 *
 * Features:
 * - Email validation
 * - Duplicate invitation checking
 * - Secure token generation
 * - 7-day expiration
 * - Automatic caching
 *
 * All methods return ServiceResult for consistent error handling
 */
export class GroupInvitationService {
  /**
   * Creates a new group invitation
   * Validates email, checks for duplicates, generates secure token
   *
   * @param input - Invitation creation data
   * @returns Created invitation or error
   *
   * @example
   * const { data, error } = await GroupInvitationService.createInvitation({
   *   groupId: 'group-123',
   *   invitedByUserId: 'user-456',
   *   email: 'newuser@example.com'
   * });
   */
  static async createInvitation(
    input: CreateInvitationInput
  ): Promise<ServiceResult<GroupInvitation>> {
    try {
      const { groupId, invitedByUserId, email } = input;

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
          error: 'Invited by user ID is required',
        };
      }

      if (!email || email.trim() === '') {
        return {
          data: null,
          error: 'Email is required',
        };
      }

      // Validate email format
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        return {
          data: null,
          error: 'Invalid email format',
        };
      }

      // Check for existing pending invitation
      const { data: existingInvitations } = await supabaseServer
        .from('group_invitations')
        .select('*')
        .eq('group_id', groupId)
        .eq('email', email.toLowerCase())
        .eq('status', 'pending');

      if (existingInvitations && existingInvitations.length > 0) {
        return {
          data: null,
          error: 'An invitation has already been sent to this email',
        };
      }

      // Check if user is already in the group
      const { data: existingUser } = await supabaseServer
        .from('users')
        .select('id')
        .eq('email', email.toLowerCase())
        .eq('group_id', groupId)
        .single();

      if (existingUser) {
        return {
          data: null,
          error: 'This user is already a member of the group',
        };
      }

      // Generate secure invitation token
      const invitationToken = this.generateInvitationToken();

      // Calculate expiration date (7 days from now)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      // Create invitation
      const { data: newInvitation, error: createError } = await supabaseServer
        .from('group_invitations')
        .insert({
          group_id: groupId,
          invited_by_user_id: invitedByUserId,
          email: email.toLowerCase(),
          invitation_token: invitationToken,
          expires_at: expiresAt.toISOString(),
          status: 'pending',
        })
        .select()
        .single();

      if (createError) {
        throw new Error(createError.message);
      }

      if (!newInvitation) {
        return {
          data: null,
          error: 'Failed to create invitation',
        };
      }

      // Invalidate cache
      await revalidateCacheTags([
        CACHE_TAGS.GROUP_INVITATIONS,
        CACHE_TAGS.GROUP_INVITATIONS_BY_GROUP(groupId),
      ]);

      return {
        data: newInvitation as GroupInvitation,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to create invitation',
      };
    }
  }

  /**
   * Gets all invitations for a group
   * Cached for performance
   *
   * @param groupId - Group ID
   * @returns Array of invitations or error
   *
   * @example
   * const { data: invitations, error } = await GroupInvitationService.getGroupInvitations(groupId);
   */
  static async getGroupInvitations(
    groupId: string
  ): Promise<ServiceResult<GroupInvitation[]>> {
    try {
      // Input validation
      if (!groupId || groupId.trim() === '') {
        return {
          data: null,
          error: 'Group ID is required',
        };
      }

      // Create cached query function
      const getCachedInvitations = cached(
        async () => {
          const { data, error } = await supabaseServer
            .from('group_invitations')
            .select('*')
            .eq('group_id', groupId)
            .order('created_at', { ascending: false });

          if (error) {
            throw new Error(error.message);
          }

          return data;
        },
        groupInvitationCacheKeys.byGroup(groupId),
        cacheOptions.groupInvitations(groupId)
      );

      const invitations = await getCachedInvitations();

      return {
        data: (invitations || []) as GroupInvitation[],
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve invitations',
      };
    }
  }

  /**
   * Cancels a pending invitation
   * Updates status to 'cancelled'
   *
   * @param invitationId - Invitation ID
   * @returns Success status or error
   *
   * @example
   * const { data, error } = await GroupInvitationService.cancelInvitation(invitationId);
   */
  static async cancelInvitation(
    invitationId: string
  ): Promise<ServiceResult<boolean>> {
    try {
      // Input validation
      if (!invitationId || invitationId.trim() === '') {
        return {
          data: null,
          error: 'Invitation ID is required',
        };
      }

      // Get invitation to verify it exists and get group ID
      const { data: invitation, error: getError } = await supabaseServer
        .from('group_invitations')
        .select('group_id, status')
        .eq('id', invitationId)
        .single();

      if (getError || !invitation) {
        return {
          data: null,
          error: 'Invitation not found',
        };
      }

      // Type assertion for partial selection
      const typedInvitation = invitation as { group_id: string; status: string };

      if (typedInvitation.status !== 'pending') {
        return {
          data: null,
          error: `Cannot cancel invitation with status: ${typedInvitation.status}`,
        };
      }

      // Update status to cancelled
      const { error: updateError } = await supabaseServer
        .from('group_invitations')
        .update({
          status: 'cancelled',
          updated_at: nowISO(),
        })
        .eq('id', invitationId);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Invalidate cache
      await revalidateCacheTags([
        CACHE_TAGS.GROUP_INVITATIONS,
        CACHE_TAGS.GROUP_INVITATIONS_BY_GROUP(typedInvitation.group_id),
        CACHE_TAGS.GROUP_INVITATION(invitationId),
      ]);

      return {
        data: true,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to cancel invitation',
      };
    }
  }

  /**
   * Gets an invitation by token
   * Used for accepting invitations
   *
   * @param token - Invitation token
   * @returns Invitation or error
   *
   * @example
   * const { data: invitation, error } = await GroupInvitationService.getInvitationByToken(token);
   */
  static async getInvitationByToken(
    token: string
  ): Promise<ServiceResult<GroupInvitation>> {
    try {
      // Input validation
      if (!token || token.trim() === '') {
        return {
          data: null,
          error: 'Invitation token is required',
        };
      }

      const { data: invitation, error } = await supabaseServer
        .from('group_invitations')
        .select('*')
        .eq('invitation_token', token)
        .single();

      if (error || !invitation) {
        return {
          data: null,
          error: 'Invitation not found',
        };
      }

      // Type assertion for full selection
      const typedInvitation = invitation as GroupInvitation;

      // Check if invitation is expired
      const now = new Date();
      const expiresAt = new Date(typedInvitation.expires_at);

      if (now > expiresAt && typedInvitation.status === 'pending') {
        // Auto-expire the invitation
        await supabaseServer
          .from('group_invitations')
          .update({
            status: 'expired',
            updated_at: nowISO(),
          })
          .eq('id', typedInvitation.id);

        return {
          data: null,
          error: 'Invitation has expired',
        };
      }

      return {
        data: typedInvitation,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to retrieve invitation',
      };
    }
  }

  /**
   * Generates a secure random invitation token
   * Private method used internally
   *
   * @returns 32-character hex string
   */
  private static generateInvitationToken(): string {
    return randomBytes(16).toString('hex');
  }
}
