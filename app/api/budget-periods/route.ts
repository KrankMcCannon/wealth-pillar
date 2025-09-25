import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, ServerDatabaseError, validateUserContext } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    await validateUserContext();
    const params = request.nextUrl.searchParams;
    const userId = params.get('userId');
    const active = params.get('active') === 'true';

    // Budget periods are stored in users.budget_periods (jsonb)
    let userQuery = supabaseServer
      .from('users')
      .select('id, budget_periods');

    if (userId) userQuery = userQuery.eq('id', userId);

    const userResp = await userQuery;
    if (userResp.error) throw new ServerDatabaseError('Failed to fetch users for budget periods', 'DB_ERROR');

    type Period = {
      id: string;
      user_id: string;
      start_date: string;
      end_date: string | null;
      is_active: boolean;
      created_at?: string;
      updated_at?: string;
      total_saved?: number;
      total_spent?: number;
      category_spending?: Record<string, number>;
    };

    const periods: Period[] = (userResp.data ?? []).flatMap((u: { id: string; budget_periods?: Period[] }) =>
      Array.isArray(u.budget_periods)
        ? (u.budget_periods as Period[]).map((p) => ({ ...p, user_id: u.id }))
        : []
    );

    const filtered = active ? periods.filter((p) => p.is_active) : periods;
    // Sort by created_at desc if present, otherwise by start_date desc
    filtered.sort((a, b) =>
      new Date((b.created_at ?? b.start_date)).getTime() - new Date((a.created_at ?? a.start_date)).getTime()
    );

    return NextResponse.json({ data: filtered });
  } catch (error) {
    if (error instanceof ServerDatabaseError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
