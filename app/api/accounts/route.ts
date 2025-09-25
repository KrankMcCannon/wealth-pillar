import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, ServerDatabaseError, validateUserContext } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const user = await validateUserContext();
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');
    const groupId = searchParams.get('groupId');

    let query = supabaseServer
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false });

    // Get user's group_id for role-based filtering
    const userResponse = await supabaseServer
      .from('users')
      .select('group_id')
      .eq('id', user.userId)
      .single();

    const userGroupId = userResponse.data?.group_id;

    // Role-based filtering logic
    const isAdmin = user.role === 'admin' || user.role === 'superadmin';

    if (userId) {
      // Specific user filter
      query = query.contains('user_ids', [userId]);
    } else if (groupId) {
      // Specific group filter
      query = query.eq('group_id', groupId);
    } else {
      if (isAdmin && userGroupId) {
        // Admin sees all accounts in their group
        query = query.eq('group_id', userGroupId);
      } else {
        // Members see only their own accounts
        query = query.contains('user_ids', [user.userId]);
      }
    }

    const response = await query;
    if (response.error) throw new ServerDatabaseError('Failed to fetch accounts', 'DB_ERROR');

    return NextResponse.json({ data: response.data ?? [] });
  } catch (error) {
    if (error instanceof ServerDatabaseError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

