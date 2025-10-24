/**
 * Server-side API Routes for Individual Recurring Transactions (Series)
 */

import { APIError, createValidationError, Database, ErrorCode, handleServerResponse, supabaseServer, validateResourceAccess, validateUserContext, withErrorHandler } from '@/lib';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext<T = Record<string, string>> = {
  params: Promise<T>;
};

const validateSeriesAccess = async (userId: string, seriesId: string) => {
  const hasAccess = await validateResourceAccess(userId, 'recurring_series', seriesId);
  if (!hasAccess) {
    throw new APIError(ErrorCode.PERMISSION_DENIED);
  }
};

type SeriesUpdate = Database['public']['Tables']['recurring_transactions']['Update'];

const buildUpdateData = (body: Record<string, unknown>): SeriesUpdate => {
  const updateData: SeriesUpdate = {
    updated_at: new Date().toISOString(),
  };

  if (body.description !== undefined) updateData.description = body.description as string;
  if (body.amount !== undefined) updateData.amount = parseFloat(String(body.amount));
  if (body.category !== undefined) updateData.category = body.category as string;
  if (body.frequency !== undefined) updateData.frequency = body.frequency as SeriesUpdate['frequency'];
  if (body.user_id !== undefined) updateData.user_id = body.user_id as string;
  if (body.account_id !== undefined) updateData.account_id = body.account_id as string;
  if (body.start_date !== undefined) updateData.start_date = body.start_date as string;
  if (body.end_date !== undefined) updateData.end_date = (body.end_date as string) || null;
  if (body.due_date !== undefined) updateData.due_date = body.due_date as string;
  if (body.is_active !== undefined) updateData.is_active = Boolean(body.is_active);
  if (body.total_executions !== undefined) updateData.total_executions = Number(body.total_executions);

  return updateData;
};

/**
 * GET /api/recurring-transactions/[id]
 */
async function getSeries(_request: NextRequest, { params }: RouteContext<{ id: string }>) {
  const userContext = await validateUserContext();
  const { id: seriesId } = await params;

  await validateSeriesAccess(userContext.userId, seriesId);

  const response = await supabaseServer
    .from('recurring_transactions')
    .select('*')
    .eq('id', seriesId)
    .single();

  const series = handleServerResponse(response);

  return NextResponse.json({ data: series });
}

export const GET = withErrorHandler(getSeries);

/**
 * PUT /api/recurring-transactions/[id]
 */
async function updateSeries(request: NextRequest, { params }: RouteContext<{ id: string }>) {
  const userContext = await validateUserContext();
  const { id: seriesId } = await params;
  const body = await request.json();

  await validateSeriesAccess(userContext.userId, seriesId);

  const updateData = buildUpdateData(body);

  // Basic validation
  const validations = [
    {
      condition: updateData.amount !== undefined && Number(updateData.amount) <= 0,
      error: () => createValidationError('amount', updateData.amount),
    },
  ];

  const failed = validations.find(v => v.condition);
  if (failed) throw failed.error();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (supabaseServer.from('recurring_transactions') as any)
    .update(updateData)
    .eq('id', seriesId)
    .select('*')
    .single();

  const series = handleServerResponse(response);

  return NextResponse.json({ data: series });
}

export const PUT = withErrorHandler(updateSeries);

/**
 * PATCH /api/recurring-transactions/[id]
 */
async function patchSeries(request: NextRequest, ctx: RouteContext<{ id: string }>) {
  return updateSeries(request, ctx);
}

export const PATCH = withErrorHandler(patchSeries);

/**
 * DELETE /api/recurring-transactions/[id]
 */
async function deleteSeries(_request: NextRequest, { params }: RouteContext<{ id: string }>) {
  const userContext = await validateUserContext();
  const { id: seriesId } = await params;

  await validateSeriesAccess(userContext.userId, seriesId);

  await supabaseServer
    .from('recurring_transactions')
    .delete()
    .eq('id', seriesId);

  return NextResponse.json({ success: true });
}

export const DELETE = withErrorHandler(deleteSeries);

