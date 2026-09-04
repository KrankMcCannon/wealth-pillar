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

const importRowBaseSchema = z.object({
  rowId: z.string().min(1),
  account_id: idSchema,
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  type: z.enum(['income', 'expense']),
  import_hash: z.string().min(1),
  causale: z.string().optional(),
});

export const prepareImportSchema = z.object({
  group_id: idSchema,
  rows: z.array(importRowBaseSchema).min(1).max(5000),
});

export const commitImportSchema = z.object({
  group_id: idSchema,
  rows: z
    .array(
      importRowBaseSchema.extend({
        category: z.string().min(1),
        user_id: idSchema,
        recurring_series_id: idSchema.optional(),
      })
    )
    .min(1)
    .max(5000),
});
