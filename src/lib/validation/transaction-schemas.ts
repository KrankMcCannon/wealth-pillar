import { z } from 'zod';

const idSchema = z.string().min(1);

export const createTransactionSchema = z.object({
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().min(1),
  date: z.union([z.string(), z.date()]),
  user_id: idSchema.nullable(),
  account_id: idSchema,
  to_account_id: idSchema.nullable().optional(),
  group_id: idSchema,
});

export const updateTransactionSchema = createTransactionSchema.partial();
