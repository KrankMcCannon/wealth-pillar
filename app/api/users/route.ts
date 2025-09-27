import { NextResponse } from 'next/server';
import { supabaseServer, validateUserContext } from '@/lib/supabase-server';
import { withErrorHandler, APIError, ErrorCode } from '@/lib/api-errors';

async function getUsers() {
    const userContext = await validateUserContext();

    let query = supabaseServer
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });


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
    if (response.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante il recupero degli utenti.',
        response.error
      );
    }

    return NextResponse.json({ data: response.data ?? [] });
}

export const GET = withErrorHandler(getUsers);
