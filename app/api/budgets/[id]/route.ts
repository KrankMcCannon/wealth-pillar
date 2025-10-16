/**
 * Server-side API Routes for Single Budget (by ID)
 */
import {
  APIError,
  ErrorCode,
  createValidationError,
  withErrorHandler,
} from '@/lib/api-errors';
import type { Database } from '@/lib/database.types';
import {
  handleServerResponse,
  supabaseServer,
  validateResourceAccess,
  validateUserContext,
} from '@/lib/supabase-server';
import type { SupabaseUpdateBuilder } from '@/lib/supabase-types';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/budgets/:id
 * Fetch a single budget (optional but handy for clients that request it)
 */
async function getBudget(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userContext = await validateUserContext();

  const hasAccess = await validateResourceAccess(userContext.userId, 'budget', id);
  if (!hasAccess) {
    throw new APIError(ErrorCode.PERMISSION_DENIED);
  }

  const response = await supabaseServer
    .from('budgets')
    .select('*')
    .eq('id', id)
    .single();

  const budget = handleServerResponse(response);
  return NextResponse.json({ data: budget });
}

/**
 * PUT /api/budgets/:id
 * Update an existing budget
 */
async function updateBudget(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userContext = await validateUserContext();

  const hasAccess = await validateResourceAccess(userContext.userId, 'budget', id);
  if (!hasAccess) {
    throw new APIError(ErrorCode.PERMISSION_DENIED);
  }

  const body = await request.json();

  // Validate fields when present
  if (body.amount !== undefined && parseFloat(body.amount) <= 0) {
    throw createValidationError('amount', body.amount);
  }
  if (body.type && !['monthly', 'annually'].includes(body.type)) {
    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      'Il tipo di budget deve essere "monthly" o "annually".',
      { type: body.type }
    );
  }
  if (body.categories && (!Array.isArray(body.categories) || body.categories.length === 0)) {
    throw new APIError(
      ErrorCode.VALIDATION_ERROR,
      'Le categorie devono essere un array non vuoto.',
      { categories: body.categories }
    );
  }

  const updateData: Database['public']['Tables']['budgets']['Update'] = {
    description: body.description,
    amount: body.amount !== undefined ? parseFloat(body.amount) : undefined,
    type: body.type,
    icon: body.icon,
    categories: body.categories,
    user_id: body.user_id, // optional reassignment (validated by access check)
    updated_at: new Date().toISOString(),
  };

  const response = await (supabaseServer
    .from('budgets') as unknown as SupabaseUpdateBuilder<
      Database['public']['Tables']['budgets']['Update'],
      Database['public']['Tables']['budgets']['Row']
    >)
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  const budget = handleServerResponse(response);
  return NextResponse.json({ data: budget });
}

/**
 * DELETE /api/budgets/:id
 * Delete a budget
 */
async function deleteBudget(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const userContext = await validateUserContext();

  const hasAccess = await validateResourceAccess(userContext.userId, 'budget', id);
  if (!hasAccess) {
    throw new APIError(ErrorCode.PERMISSION_DENIED);
  }

  const { error } = await supabaseServer
    .from('budgets')
    .delete()
    .eq('id', id);

  if (error) {
    throw new APIError(ErrorCode.INTERNAL_ERROR, 'Errore nella cancellazione del budget', error);
  }

  return NextResponse.json({ data: { id } });
}

export const GET = withErrorHandler(getBudget);
export const PUT = withErrorHandler(updateBudget);
export const DELETE = withErrorHandler(deleteBudget);
