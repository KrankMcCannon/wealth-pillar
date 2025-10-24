import { APIError, ErrorCode, withErrorHandler } from '@/src/lib';
import { supabaseServer, validateUserContext } from '@/src/lib/database/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

async function getAccounts(request: NextRequest) {
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

    if (userResponse.error) {
      throw new APIError(
        ErrorCode.USER_NOT_FOUND,
        'Utente non trovato nel sistema.',
        userResponse.error
      );
    }

    const userGroupId = (userResponse.data as { group_id: string }).group_id;

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
    if (response.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante il recupero degli account.',
        response.error
      );
    }

    return NextResponse.json({ data: response.data ?? [] });
}

export const GET = withErrorHandler(getAccounts);

