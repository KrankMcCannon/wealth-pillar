/**
 * Server-side API Routes for Individual Transactions
 */

import { APIError, createValidationError, ErrorCode, withErrorHandler } from '@/src/lib/api';
import type { Database } from '@/src/lib/database';
import { handleServerResponse, supabaseServer, validateResourceAccess, validateUserContext } from '@/src/lib/database/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

type RouteContext<T = Record<string, string>> = {
  params: Promise<T>;
};

const validateTransactionAccess = async (userId: string, transactionId: string) => {
  const hasAccess = await validateResourceAccess(userId, 'transaction', transactionId);
  if (!hasAccess) {
    throw new APIError(ErrorCode.PERMISSION_DENIED);
  }
};

// Typed wrapper for Supabase update to handle type issues
const updateTransactionInDB = async (
  transactionId: string,
  updateData: TransactionUpdate
) => {
  // Use type assertion as last resort for Supabase type compatibility
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (supabaseServer.from('transactions') as any)
    .update(updateData)
    .eq('id', transactionId)
    .select('*')
    .single();
};

type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

const buildUpdateData = (body: Record<string, unknown>): TransactionUpdate => {
  const updateData: TransactionUpdate = {
    updated_at: new Date().toISOString(),
  };

  // Type-safe conditional assignment
  if (body.description !== undefined) updateData.description = body.description as string;
  if (body.amount !== undefined) updateData.amount = parseFloat(String(body.amount));
  if (body.type !== undefined) updateData.type = body.type as TransactionUpdate['type'];
  if (body.category !== undefined) updateData.category = body.category as string;
  if (body.date !== undefined) updateData.date = body.date as string;
  if (body.user_id !== undefined) updateData.user_id = body.user_id as string;
  if (body.account_id !== undefined) updateData.account_id = body.account_id as string;
  if (body.to_account_id !== undefined) updateData.to_account_id = (body.to_account_id as string) || null;
  if (body.frequency !== undefined) updateData.frequency = body.frequency as TransactionUpdate['frequency'];

  return updateData;
};

/**
 * GET /api/transactions/[id]
 * Retrieve a specific transaction by ID
 */
async function getTransaction(_request: NextRequest, { params }: RouteContext<{ id: string }>) {
  const userContext = await validateUserContext();
  const { id: transactionId } = await params;

  await validateTransactionAccess(userContext.userId, transactionId);

  const response = await supabaseServer
    .from('transactions')
    .select('*')
    .eq('id', transactionId)
    .single();

  const transaction = handleServerResponse(response);

  return NextResponse.json({ data: transaction });
}

export const GET = withErrorHandler(getTransaction);

/**
 * PUT /api/transactions/[id]
 * Update a specific transaction
 */
async function updateTransaction(request: NextRequest, { params }: RouteContext<{ id: string }>) {
  const userContext = await validateUserContext();
  const { id: transactionId } = await params;
  const body = await request.json();

  await validateTransactionAccess(userContext.userId, transactionId);

  const updateData = buildUpdateData(body);

  // Validate using modern TypeScript patterns
  const validations = [
    {
      condition: updateData.amount !== undefined && updateData.amount <= 0,
      error: () => createValidationError('amount', updateData.amount),
    },
    {
      condition: updateData.type === 'transfer' && !updateData.to_account_id,
      error: () => new APIError(
        ErrorCode.VALIDATION_ERROR,
        'Le transazioni di trasferimento richiedono un conto di destinazione.',
        { type: updateData.type, to_account_id: updateData.to_account_id }
      ),
    },
  ];

  const failedValidation = validations.find(({ condition }) => condition);
  if (failedValidation) {
    throw failedValidation.error();
  }

  const response = await updateTransactionInDB(transactionId, updateData);

  const transaction = handleServerResponse(response);

  return NextResponse.json({ data: transaction });
}

export const PUT = withErrorHandler(updateTransaction);

/**
 * DELETE /api/transactions/[id]
 * Delete a specific transaction
 */
async function deleteTransaction(_request: NextRequest, { params }: RouteContext<{ id: string }>) {
  const userContext = await validateUserContext();
  const { id: transactionId } = await params;

  await validateTransactionAccess(userContext.userId, transactionId);

  await supabaseServer
    .from('transactions')
    .delete()
    .eq('id', transactionId);

  return NextResponse.json({ success: true });
}

export const DELETE = withErrorHandler(deleteTransaction);
