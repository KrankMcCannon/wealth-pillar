'use server';

import { revalidateInvestmentRelatedPaths } from '@/lib/cache/revalidation-paths';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import * as useCases from '@/server/use-cases';
import type { Database } from '@/lib/types/database.types';
import type { ServiceResult } from '@/lib/types/service-result';

type InvestmentInsert = Database['public']['Tables']['investments']['Insert'];
type InvestmentRow = Database['public']['Tables']['investments']['Row'];

export async function getInvestmentByIdAction(id: string): Promise<ServiceResult<InvestmentRow>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { data: null, error: 'UNAUTHENTICATED' };

    const data = await useCases.getInvestmentByIdForUserUseCase(id, currentUser.id);
    if (!data) return { data: null, error: 'NOT_FOUND' };
    return { data, error: null };
  } catch (error) {
    console.error('Error fetching investment:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch investment',
    };
  }
}

export async function updateInvestmentAction(input: {
  id: string;
  name: string;
  symbol: string;
  amount: number;
  shares_acquired: number;
  currency: string;
  tax_paid: number;
  created_at: Date;
  currency_rate?: number;
  net_earn?: number;
}): Promise<ServiceResult<InvestmentRow>> {
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) return { data: null, error: 'UNAUTHENTICATED' };

    const updated = await useCases.updateInvestmentUseCase(input.id, currentUser.id, {
      name: input.name,
      symbol: input.symbol.toUpperCase(),
      amount: input.amount,
      shares_acquired: input.shares_acquired,
      currency: input.currency,
      currency_rate: input.currency_rate ?? 1,
      tax_paid: input.tax_paid ?? 0,
      net_earn: input.net_earn ?? 0,
      created_at: input.created_at.toISOString(),
    });

    revalidateInvestmentRelatedPaths();
    return { data: updated, error: null };
  } catch (error) {
    console.error('Error updating investment:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update investment',
    };
  }
}

export async function createInvestmentAction(
  input: Omit<InvestmentInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'> & {
    created_at?: Date | string;
  }
): Promise<ServiceResult<Database['public']['Tables']['investments']['Row']>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) return { data: null, error: 'Non autenticato' };

    // Basic permission check - assuming user can add for self
    // In a real scenario, check if input.users.connect.id matches currentUser or if admin

    // Transform input to Prisma format
    const investmentData = {
      name: input.name,
      symbol: input.symbol,
      amount: input.amount,
      shares_acquired: input.shares_acquired,
      currency: input.currency,
      currency_rate: input.currency_rate || 1,
      tax_paid: input.tax_paid || 0,
      net_earn: input.net_earn || 0,
      created_at: input.created_at
        ? new Date(input.created_at).toISOString()
        : new Date().toISOString(),
      user_id: currentUser.id, // Force connect to current user for now
    };

    const data = await useCases.addInvestmentUseCase(investmentData as InvestmentInsert);

    revalidateInvestmentRelatedPaths();

    return { data, error: null };
  } catch (error) {
    console.error('Error creating investment:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create investment',
    };
  }
}
