import 'server-only';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { groupInvitationCacheKeys } from '@/lib/cache/keys';
import { GroupInvitationRepository, UserRepository } from '@/server/dal';
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
 * All methods throw standard errors instead of returning ServiceResult objects
 */
export class GroupInvitationService {
  /**
   * Creates a new group invitation
   * Validates email, checks for duplicates, generates secure token
   */
  static async createInvitation(
    input: CreateInvitationInput
  ): Promise<GroupInvitation> {
    const { groupId, invitedByUserId, email } = input;

    // Input validation
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
    }

    if (!invitedByUserId || invitedByUserId.trim() === '') {
      throw new Error('Invited by user ID is required');
    }

    if (!email || email.trim() === '') {
      throw new Error('Email is required');
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const emailLower = email.toLowerCase();

    // Check for existing pending invitation
    const existingInvitation = await GroupInvitationRepository.getPendingByEmailAndGroup(
      emailLower,
      groupId
    );

    if (existingInvitation) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Check if user is already in the group
    // Using UserRepository to find user by email and check group
    const existingUser = await UserRepository.getByEmail(emailLower);

    if (existingUser && existingUser.group_id === groupId) {
      throw new Error('This user is already a member of the group');
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
      throw new Error('Failed to create invitation');
    }

    // Invalidate cache
    revalidateTag(CACHE_TAGS.GROUP_INVITATIONS, 'max');
    revalidateTag(CACHE_TAGS.GROUP_INVITATIONS_BY_GROUP(groupId), 'max');

    return newInvitation as GroupInvitation;
  }

  /**
   * Gets all invitations for a group
   * Cached for performance
   */
  static async getGroupInvitations(
    groupId: string
  ): Promise<GroupInvitation[]> {
    if (!groupId || groupId.trim() === '') {
      throw new Error('Group ID is required');
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

    return (invitations || []) as GroupInvitation[];
  }

  /**
   * Cancels a pending invitation
   * Updates status to 'cancelled'
   */
  static async cancelInvitation(invitationId: string): Promise<boolean> {
    if (!invitationId || invitationId.trim() === '') {
      throw new Error('Invitation ID is required');
    }

    // Get invitation to verify it exists and get group ID
    const invitation = await GroupInvitationRepository.getById(invitationId);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error(
        `Cannot cancel invitation with status: ${invitation.status}`
      );
    }

    // Update status to cancelled
    await GroupInvitationRepository.update(invitationId, {
      status: 'cancelled',
      updated_at: new Date(),
    });

    // Invalidate cache
    revalidateTag(CACHE_TAGS.GROUP_INVITATIONS, 'max');
    revalidateTag(
      CACHE_TAGS.GROUP_INVITATIONS_BY_GROUP(invitation.group_id),
      'max'
    );
    revalidateTag(CACHE_TAGS.GROUP_INVITATION(invitationId), 'max');

    return true;
  }

  /**
   * Gets an invitation by token
   * Used for accepting invitations
   */
  static async getInvitationByToken(token: string): Promise<GroupInvitation> {
    if (!token || token.trim() === '') {
      throw new Error('Invitation token is required');
    }

    const invitation = await GroupInvitationRepository.getByToken(token);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt && invitation.status === 'pending') {
      // Auto-expire the invitation
      await GroupInvitationRepository.update(invitation.id, {
        status: 'expired',
        updated_at: new Date(),
      });

      throw new Error('Invitation has expired');
    }

    return invitation as GroupInvitation;
  }

  /**
   * Generates a secure random invitation token
   */
  private static generateInvitationToken(): string {
    return randomBytes(16).toString('hex');
  }
}
