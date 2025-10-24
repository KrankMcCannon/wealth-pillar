import { supabase } from "../database";

// Use the shared singleton client for browser operations to avoid multiple auth-js instances
function getSupabase() {
  // If env is not configured, return null (dev-only graceful path)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) return null;
  return supabase;
}

// Authentication types and interfaces
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  role: 'superadmin' | 'admin' | 'member';
  group_id?: string;
  clerk_id: string;
  created_at: string;
  updated_at: string;
}

export interface AuthSession {
  user: AuthUser | null;
  isLoading: boolean;
  error: string | null;
}

// Get user data from Supabase using Clerk ID or email (client-side)
export async function getUserByClerkId(clerkId: string, email?: string): Promise<AuthUser | null> {
  try {
    // Prefer server API to avoid extra auth-js clients and to work without RPC helpers
    const res = await fetch('/api/users', { cache: 'no-store' });
    if (res.ok) {
      const payload = await res.json() as { data?: Array<Record<string, unknown>> };
      const list = Array.isArray(payload.data) ? payload.data : [];
      const byClerk = list.find((u) => (u as { clerk_id?: string }).clerk_id === clerkId);
      const byEmail = email ? list.find((u) => (u as { email?: string }).email === email) : undefined;
      const user = (byClerk || byEmail) as {
        id: string; email: string; name: string; avatar?: string; role: 'superadmin'|'admin'|'member'; group_id?: string; clerk_id: string; created_at: string; updated_at: string;
      } | undefined;
      if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || '',
      role: user.role,
      group_id: user.group_id,
      clerk_id: user.clerk_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
    }

    // Fallback: try direct Supabase only if configured
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase not configured: skipping direct getUserByClerkId');
      return null;
    }

    // Use direct table query instead of RPC functions
    let { data } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_id', clerkId)
      .single();

    if (!data && email) {
      // Try by email if clerk_id lookup fails
      const { data: emailData, error: emailError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (!emailError && emailData) {
        // Update clerk_id for this user
        const { data: updatedData } = await supabase
          .from('users')
          .update({ clerk_id: clerkId })
          .eq('email', email)
          .select('*')
          .single();

        if (updatedData) {
          data = updatedData;
        } else {
          data = emailData;
        }
      }
    }

    if (!data) return null;
    const user = data;
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar || '',
      role: user.role,
      group_id: user.group_id,
      clerk_id: user.clerk_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  } catch (error) {
    console.error('Error getting user by clerk ID:', error);
    return null;
  }
}

// Create user in Supabase database (client-side)
export async function createUserInDatabase(userData: {
  clerk_id: string;
  email: string;
  name: string;
  avatar?: string;
}): Promise<AuthUser | null> {
  try {
    const supabase = getSupabase();
    if (!supabase) {
      console.warn('Supabase not configured: skipping createUserInDatabase');
      return null;
    }

    // Use direct table insert instead of RPC function
    const { data, error } = await supabase
      .from('users')
      .upsert({
        clerk_id: userData.clerk_id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar || '',
        role: 'member',
        theme_color: '#7578EC',
        budget_start_date: 1,
        group_id: crypto.randomUUID(), // Generate a new group for the user
      }, {
        onConflict: 'clerk_id',
        ignoreDuplicates: false
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating user in database:', error);
      return null;
    }

    if (!data || data.length === 0) {
      console.error('No user data returned from upsert function');
      return null;
    }

    const user = Array.isArray(data) ? data[0] : data;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
      group_id: user.group_id,
      clerk_id: user.clerk_id,
      created_at: user.created_at,
      updated_at: user.updated_at,
    };
  } catch (error) {
    console.error('Error creating user in database:', error);
    return null;
  }
}
