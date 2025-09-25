import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer, ServerDatabaseError, validateUserContext } from '@/lib/supabase-server';

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    await validateUserContext();
    const { id } = await context.params;

    // Treat :id as user_id; read from users.budget_periods jsonb and find active
    const userResp = await supabaseServer
      .from('users')
      .select('budget_periods')
      .eq('id', id)
      .single();

    if (userResp.error) throw new ServerDatabaseError('Failed to fetch user budget periods', 'DB_ERROR');
    type Period = {
      id: string;
      user_id?: string;
      start_date: string;
      end_date: string | null;
      is_active: boolean;
      created_at?: string;
      updated_at?: string;
      total_saved?: number;
      total_spent?: number;
      category_spending?: Record<string, number>;
    };

    const list: Period[] = Array.isArray((userResp.data as { budget_periods?: unknown })?.budget_periods)
      ? ((userResp.data as { budget_periods?: unknown }).budget_periods as Period[])
      : [];
    const current: Period | null = list.find((p) => p.is_active) || null;
    return NextResponse.json({ data: current });
  } catch (error) {
    if (error instanceof ServerDatabaseError) {
      return NextResponse.json({ error: error.message, code: error.code }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
