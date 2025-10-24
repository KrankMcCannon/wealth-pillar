import { APIError, ErrorCode, supabaseServer, validateUserContext, withErrorHandler } from '@/lib';
import { NextRequest, NextResponse } from 'next/server';

async function getCurrentBudgetPeriod(_: NextRequest, context: { params: Promise<{ id: string }> }) {
    await validateUserContext();
    const { id } = await context.params;

    // Treat :id as user_id; read from users.budget_periods jsonb and find active
    const userResp = await supabaseServer
      .from('users')
      .select('budget_periods')
      .eq('id', id)
      .single();

    if (userResp.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante il recupero del periodo di budget corrente.',
        userResp.error
      );
    }
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
}

export const GET = withErrorHandler(getCurrentBudgetPeriod);
