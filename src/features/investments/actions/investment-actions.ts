'use server';

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { InvestmentService } from '@/server/services';
import type { Database } from '@/lib/types/database.types';

type InvestmentInsert = Database['public']['Tables']['investments']['Insert'];

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export async function createInvestmentAction(
  input: Omit<InvestmentInsert, 'user_id' | 'id' | 'created_at' | 'updated_at'> & { created_at?: Date | string }
): Promise<ServiceResult<any>> {
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
      currency_rate: input.currency_rate || 1.0,
      tax_paid: input.tax_paid || 0,
      net_earn: input.net_earn || 0,
      created_at: input.created_at ? new Date(input.created_at).toISOString() : new Date().toISOString(),
      user_id: currentUser.id, // Force connect to current user for now
      group_id: currentUser.group_id // Ensure group_id is set if required by DB constraint
    };

    const data = await InvestmentService.addInvestment(investmentData as InvestmentInsert);

    revalidatePath('/investments');

    return { data, error: null };
  } catch (error) {
    console.error('Error creating investment:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create investment',
    };
  }
}
