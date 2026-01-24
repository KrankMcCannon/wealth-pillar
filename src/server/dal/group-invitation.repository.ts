import { supabase } from '@/server/db/supabase';
import { cache } from 'react';
import type { Database } from '@/lib/types/database.types';

type GroupInvitationInsert = Database['public']['Tables']['group_invitations']['Insert'];
type GroupInvitationUpdate = Database['public']['Tables']['group_invitations']['Update'];

/**
 * Group Invitation Repository
 * Handles all database operations for group invitations using Supabase.
 */
export class GroupInvitationRepository {
  /**
   * Get invitation by ID
   */
  static getById = cache(async (id: string) => {
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as any;
  });

  /**
   * Get invitation by Token
   */
  static getByToken = cache(async (token: string) => {
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('invitation_token', token)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as any;
  });

  /**
   * Get invitations by Group ID
   */
  static getByGroup = cache(async (groupId: string) => {
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data as any;
  });

  /**
   * Get pending invitation by Email and Group ID
   */
  static async getPendingByEmailAndGroup(email: string, groupId: string) {
    const { data, error } = await supabase
      .from('group_invitations')
      .select('*')
      .eq('email', email)
      .eq('group_id', groupId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle(); // maybeSingle returns null instead of error if not found

    if (error) throw new Error(error.message);
    return data as any;
  }

  /**
   * Create a new invitation
   */
  static async create(data: GroupInvitationInsert) {
    const { data: created, error } = await supabase
      .from('group_invitations')
      .insert(data as any as never)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return created as any;
  }

  /**
   * Update an invitation
   */
  static async update(id: string, data: GroupInvitationUpdate) {
    const { data: updated, error } = await supabase
      .from('group_invitations')
      .update(data as any as never)
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return updated as any;
  }

  /**
   * Delete an invitation
   */
  static async delete(id: string) {
    const { data, error } = await supabase
      .from('group_invitations')
      .delete()
      .eq('id', id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as any;
  }
}
