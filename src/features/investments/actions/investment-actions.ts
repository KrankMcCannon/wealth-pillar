'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { InvestmentService, UserService } from '@/server/services';
import { Prisma } from '@prisma/client';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

export async function createInvestmentAction(
  input: Omit<Prisma.investmentsCreateInput, 'users' | 'id' | 'created_at' | 'updated_at'> & { created_at?: Date | string }
): Promise<ServiceResult<any>> {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return { data: null, error: 'Non autenticato' };

    const currentUser = await UserService.getLoggedUserInfo(clerkId);
    if (!currentUser) return { data: null, error: 'Utente non trovato' };

    // Basic permission check - assuming user can add for self
    // In a real scenario, check if input.users.connect.id matches currentUser or if admin

    // Transform input to Prisma format
    const investmentData: Prisma.investmentsCreateInput = {
      name: input.name,
      symbol: input.symbol,
      amount: input.amount,
      shares_acquired: input.shares_acquired,
      currency: input.currency,
      currency_rate: input.currency_rate || 1.0,
      tax_paid: input.tax_paid || 0,
      net_earn: input.net_earn || 0,
      created_at: input.created_at ? new Date(input.created_at) : new Date(),
      users: {
        connect: {
          id: currentUser.id // Force connect to current user for now, or use input.user_id if passed
        }
      }
    };

    const data = await InvestmentService.addInvestment(investmentData);

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
