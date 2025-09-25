import { NextResponse } from 'next/server';
import { supabaseServer, ServerDatabaseError, validateUserContext } from '@/lib/supabase-server';

export async function GET() {
  try {
    const userContext = await validateUserContext();

    let query = supabaseServer
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    const isAdmin = userContext.role === 'admin' || userContext.role === 'superadmin';

    if (userContext.role === 'superadmin') {
      // Superadmin sees all users
      // No additional filtering needed
    } else if (userContext.role === 'admin') {
      // Admin sees users in their group
      const adminUserResponse = await supabaseServer
        .from('users')
        .select('group_id')
        .eq('id', userContext.userId)
        .single();

      const adminGroupId = adminUserResponse.error ? null : (adminUserResponse.data as { group_id: string }).group_id;
      if (adminGroupId) {
        query = query.eq('group_id', adminGroupId);
      } else {
        // Fallback: admin sees only themselves
        query = query.eq('id', userContext.userId);
      }
    } else {
      // Members see only themselves
      query = query.eq('id', userContext.userId);
    }

    const response = await query;
    if (response.error) throw new ServerDatabaseError('Failed to fetch users', 'DB_ERROR');

    return NextResponse.json({ data: response.data ?? [] });
  } catch (error) {
    if (error instanceof ServerDatabaseError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
