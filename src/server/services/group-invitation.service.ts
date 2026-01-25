import 'server-only';
import { CACHE_TAGS } from '@/lib/cache/config';
import { supabase } from '@/server/db/supabase';
import { UserService } from './user.service';
import { randomBytes } from 'crypto';
import { revalidateTag } from 'next/cache';
import { isValidEmail } from '@/lib/utils/validators';
import type { Database } from '@/lib/types/database.types';

export type GroupInvitation = Database['public']['Tables']['group_invitations']['Row'];
type GroupInvitationInsert = Database['public']['Tables']['group_invitations']['Insert'];

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
    if (!isValidEmail(email)) {
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
   * Generates a secure random invitation token
   */
  private static generateInvitationToken(): string {
    return randomBytes(16).toString('hex');
  }
}
