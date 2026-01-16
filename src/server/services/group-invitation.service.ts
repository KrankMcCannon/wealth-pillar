import 'server-only';
import { CACHE_TAGS, cached, cacheOptions, groupInvitationCacheKeys } from '@/lib/cache';
import { GroupInvitationRepository, UserRepository } from '@/server/dal';
import type { ServiceResult } from './user.service';
import { randomBytes } from 'crypto';
import { revalidateTag } from 'next/cache';
import type { group_invitations } from '@prisma/client';
import type { Prisma } from '@prisma/client';

/**
 * Group Invitation type (alias for Prisma type)
 */
export type GroupInvitation = group_invitations;

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
 * All methods return ServiceResult for consistent error handling
 */
export class GroupInvitationService {
  /**
   * Creates a new group invitation
   * Validates email, checks for duplicates, generates secure token
   */
  static async createInvitation(
    input: CreateInvitationInput
  ): Promise<ServiceResult<GroupInvitation>> {
    try {
      const { groupId, invitedByUserId, email } = input;

      // Input validation
      if (!groupId || groupId.trim() === '') {
        return { data: null, error: 'Group ID is required' };
      }

      if (!invitedByUserId || invitedByUserId.trim() === '') {
        return { data: null, error: 'Invited by user ID is required' };
      }

      if (!email || email.trim() === '') {
        return { data: null, error: 'Email is required' };
      }

      // Validate email format
      const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
      if (!emailRegex.test(email)) {
        return { data: null, error: 'Invalid email format' };
      }

      const emailLower = email.toLowerCase();

      // Check for existing pending invitation
      const existingInvitation = await GroupInvitationRepository.getPendingByEmailAndGroup(emailLower, groupId);

      if (existingInvitation) {
        return {
          data: null,
          error: 'An invitation has already been sent to this email',
        };
      }

      // Check if user is already in the group
      // Using UserRepository to find user by email and check group
      const existingUser = await UserRepository.getByEmail(emailLower);

      if (existingUser && existingUser.group_id === groupId) {
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
      const createData: Prisma.group_invitationsCreateInput = {
        groups: { connect: { id: groupId } },
        users: { connect: { id: invitedByUserId } },
        email: emailLower,
        invitation_token: invitationToken,
        expires_at: expiresAt,
        status: 'pending',
      };

      const newInvitation = await GroupInvitationRepository.create(createData);

      if (!newInvitation) {
        return {
          data: null,
          error: 'Failed to create invitation',
        };
      }

      // Invalidate cache
      revalidateTag(CACHE_TAGS.GROUP_INVITATIONS, 'max');
      revalidateTag(CACHE_TAGS.GROUP_INVITATIONS_BY_GROUP(groupId), 'max');

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
   */
  static async getGroupInvitations(
    groupId: string
  ): Promise<ServiceResult<GroupInvitation[]>> {
    try {
      if (!groupId || groupId.trim() === '') {
        return { data: null, error: 'Group ID is required' };
      }

      // Create cached query function
      const getCachedInvitations = cached(
        async () => {
          const invitations = await GroupInvitationRepository.getByGroup(groupId);
          return invitations;
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
   */
  static async cancelInvitation(
    invitationId: string
  ): Promise<ServiceResult<boolean>> {
    try {
      if (!invitationId || invitationId.trim() === '') {
        return { data: null, error: 'Invitation ID is required' };
      }

      // Get invitation to verify it exists and get group ID
      const invitation = await GroupInvitationRepository.getById(invitationId);

      if (!invitation) {
        return { data: null, error: 'Invitation not found' };
      }

      if (invitation.status !== 'pending') {
        return {
          data: null,
          error: `Cannot cancel invitation with status: ${invitation.status}`,
        };
      }

      // Update status to cancelled
      await GroupInvitationRepository.update(invitationId, {
        status: 'cancelled',
        updated_at: new Date(),
      });

      // Invalidate cache
      revalidateTag(CACHE_TAGS.GROUP_INVITATIONS, 'max');
      revalidateTag(CACHE_TAGS.GROUP_INVITATIONS_BY_GROUP(invitation.group_id), 'max');
      revalidateTag(CACHE_TAGS.GROUP_INVITATION(invitationId), 'max');

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
   */
  static async getInvitationByToken(
    token: string
  ): Promise<ServiceResult<GroupInvitation>> {
    try {
      if (!token || token.trim() === '') {
        return { data: null, error: 'Invitation token is required' };
      }

      const invitation = await GroupInvitationRepository.getByToken(token);

      if (!invitation) {
        return { data: null, error: 'Invitation not found' };
      }

      // Check if invitation is expired
      const now = new Date();
      const expiresAt = new Date(invitation.expires_at);

      if (now > expiresAt && invitation.status === 'pending') {
        // Auto-expire the invitation
        await GroupInvitationRepository.update(invitation.id, {
          status: 'expired',
          updated_at: new Date()
        });

        return {
          data: null,
          error: 'Invitation has expired',
        };
      }

      return {
        data: invitation as GroupInvitation,
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
   */
  private static generateInvitationToken(): string {
    return randomBytes(16).toString('hex');
  }
}
