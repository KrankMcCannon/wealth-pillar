import { supabaseServer, validateUserContext } from '@/src/lib/database/supabase-server';
import { APIError, Database, ErrorCode, withErrorHandler } from '@/src/lib';
import { SupabaseUpdateBuilder } from '@/src/lib/types/supabase';
import { NextRequest, NextResponse } from 'next/server';

async function getBudgetPeriods(request: NextRequest) {
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
    if (userResp.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante il recupero dei periodi di budget.',
        userResp.error
      );
    }

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
}

async function createBudgetPeriod(request: NextRequest) {
    const { userId: callerId, role } = await validateUserContext();

    const body = await request.json().catch(() => ({}));
    const targetUserId: string | undefined = body.userId || body.user_id;

    if (!targetUserId) {
      throw new APIError(
        ErrorCode.MISSING_FIELDS,
        'Il campo userId è obbligatorio.',
        { missingFields: ['userId'] }
      );
    }

    // Basic permission: allow self, or admins
    const isSelf = callerId === targetUserId;
    const isAdmin = role === 'admin' || role === 'superadmin';
    if (!isSelf && !isAdmin) {
      throw new APIError(ErrorCode.PERMISSION_DENIED);
    }

    // Load user and budget periods
    const { data: userData, error: userError } = await supabaseServer
      .from('users')
      .select('id, budget_periods')
      .eq('id', targetUserId)
      .single();

    if (userError || !userData) {
      throw new APIError(ErrorCode.USER_NOT_FOUND);
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
    };

    const user = userData as Pick<Database['public']['Tables']['users']['Row'], 'id' | 'budget_periods'>;
    const periods: Period[] = Array.isArray(user.budget_periods) ? (user.budget_periods as Period[]) : [];

    // Check if there's already an active period
    const hasActivePeriod = periods.some(p => p.is_active);
    if (hasActivePeriod) {
      throw new APIError(
        ErrorCode.RESOURCE_CONFLICT,
        'Esiste già un periodo di budget attivo.',
        { hasActivePeriod: true }
      );
    }

    // Calculate start date: day after the most recent period's end date, or today if no previous periods
    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0); // Start of day

    if (periods.length > 0) {
      // Find the most recent period (by end_date or start_date if no end_date)
      const sortedPeriods = periods.sort((a, b) => {
        const aDate = new Date(a.end_date || a.start_date);
        const bDate = new Date(b.end_date || b.start_date);
        return bDate.getTime() - aDate.getTime();
      });

      const mostRecentPeriod = sortedPeriods[0];
      if (mostRecentPeriod.end_date) {
        const lastEndDate = new Date(mostRecentPeriod.end_date);
        startDate = new Date(lastEndDate);
        startDate.setDate(startDate.getDate() + 1); // Next day
        startDate.setHours(0, 0, 0, 0); // Start of day
      }
    }

    // Create new period
    const newPeriod: Period = {
      id: crypto.randomUUID(),
      start_date: startDate.toISOString(),
      end_date: null,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      total_saved: 0,
      total_spent: 0,
    };

    const updatedPeriods = [...periods, newPeriod];

    const updatePayload: Database['public']['Tables']['users']['Update'] = {
      budget_periods: updatedPeriods as unknown,
    };

    const updateResponse = await (supabaseServer
      .from('users') as unknown as SupabaseUpdateBuilder<
        Database['public']['Tables']['users']['Update'],
        Database['public']['Tables']['users']['Row']
      >)
      .update(updatePayload)
      .eq('id', targetUserId)
      .single();

    if (updateResponse.error) {
      throw new APIError(
        ErrorCode.DB_QUERY_ERROR,
        'Errore durante l\'aggiornamento dei periodi di budget.',
        updateResponse.error
      );
    }

    // Return new period with user id
    return NextResponse.json({ data: { ...newPeriod, user_id: targetUserId } });
}

export const GET = withErrorHandler(getBudgetPeriods);
export const POST = withErrorHandler(createBudgetPeriod);
