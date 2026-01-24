import 'server-only';
import { cache } from 'react';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { groupInvitationCacheKeys } from '@/lib/cache/keys';
import { supabase } from '@/server/db/supabase';
import { UserService } from './user.service';
import { randomBytes } from 'crypto';
import { revalidateTag } from 'next/cache';
import type { Database } from '@/lib/types/database.types';

export type GroupInvitation = Database['public']['Tables']['group_invitations']['Row'];
type GroupInvitationInsert = Database['public']['Tables']['group_invitations']['Insert'];
type GroupInvitationUpdate = Database['public']['Tables']['group_invitations']['Update'];

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
 */
export class GroupInvitationService {
  // ================== DATABASE OPERATIONS (inlined from repository) ==================

  private static getByIdDb = cache(async (id: string): Promise<GroupInvitation | null> => {
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as GroupInvitation;
  });

  private static getByTokenDb = cache(async (token: string): Promise<GroupInvitation | null> => {
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as GroupInvitation;
  });

  private static getByGroupDb = cache(async (groupId: string): Promise<GroupInvitation[]> => {
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []) as GroupInvitation[];
  });

  private static async getPendingByEmailAndGroupDb(email: string, groupId: string): Promise<GroupInvitation | null> {
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('email', email)
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return (data as unknown) as GroupInvitation | null;
  }

  private static async createDb(data: GroupInvitationInsert): Promise<GroupInvitation> {
    const { data: created, error } = await supabase
      .from('group_invitations')
      .insert(data as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as GroupInvitation;
  }

  private static async updateDb(id: string, data: GroupInvitationUpdate): Promise<GroupInvitation> {
    const { data: updated, error } = await supabase
      .from('group_invitations')
      .update(data as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as GroupInvitation;
  }

  private static async deleteDb(id: string): Promise<void> {
    const { error } = await supabase
      .from('group_invitations')
      .delete()
      .eq('id', id);

    if (error) throw new Error(error.message);
  }

  // ================== SERVICE LAYER ==================

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
    const existingInvitation = await this.getPendingByEmailAndGroupDb(
      emailLower,
      groupId
    );

    if (existingInvitation) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Check if user is already in the group
    // Using UserService to find user by email and check group
    const existingUser = await UserService.getUserByEmail(emailLower);

    if (existingUser && existingUser.group_id === groupId) {
      throw new Error('This user is already a member of the group');
    }

    // Generate secure invitation token
    const invitationToken = this.generateInvitationToken();

    // Calculate expiration date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Create invitation
    const createData = {
      group_id: groupId,
      invited_by_user_id: invitedByUserId,
      email: emailLower,
      invitation_token: invitationToken,
      expires_at: expiresAt.toISOString(),
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newInvitation = await this.createDb(createData);

    if (!newInvitation) {
      throw new Error('Failed to create invitation');
    }

    // Invalidate cache
    revalidateTag(CACHE_TAGS.GROUP_INVITATIONS, 'max');
    revalidateTag(CACHE_TAGS.GROUP_INVITATIONS_BY_GROUP(groupId), 'max');

    return newInvitation as unknown as GroupInvitation;
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
        const invitations = await this.getByGroupDb(groupId);
        return invitations;
      },
      groupInvitationCacheKeys.byGroup(groupId),
      cacheOptions.groupInvitations(groupId)
    );

    const invitations = await getCachedInvitations();

    return (invitations || []) as unknown as GroupInvitation[];
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
    const invitation = await this.getByIdDb(invitationId);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    if (invitation.status !== 'pending') {
      throw new Error(
        `Cannot cancel invitation with status: ${invitation.status}`
      );
    }

    // Update status to cancelled
    await this.updateDb(invitationId, {
      status: 'cancelled',
      updated_at: new Date().toISOString(),
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

    const invitation = await this.getByTokenDb(token);

    if (!invitation) {
      throw new Error('Invitation not found');
    }

    // Check if invitation is expired
    const now = new Date();
    const expiresAt = new Date(invitation.expires_at);

    if (now > expiresAt && invitation.status === 'pending') {
      // Auto-expire the invitation
      await this.updateDb(invitation.id, {
        status: 'expired',
        updated_at: new Date().toISOString(),
      });

      throw new Error('Invitation has expired');
    }

    return invitation as unknown as GroupInvitation;
  }

  /**
   * Generates a secure random invitation token
   */
  private static generateInvitationToken(): string {
    return randomBytes(16).toString('hex');
  }
}
