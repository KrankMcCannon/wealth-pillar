import type { useTranslations } from 'next-intl';
import { z } from 'zod';

import type { TransactionFrequencyType } from '@/lib/types';

export function createRecurringSchema(t: ReturnType<typeof useTranslations>) {
  return z
    .object({
      description: z.string().min(1, t('validation.descriptionRequired')).trim(),
      amount: z
        .string()
        .min(1, t('validation.amountRequired'))
        .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, {
          message: t('validation.amountGreaterThanZero'),
        }),
      type: z.enum(['income', 'expense']),
      category: z.string().min(1, t('validation.categoryRequired')),
      frequency: z.enum(['once', 'weekly', 'biweekly', 'monthly', 'yearly']),
      user_ids: z.array(z.string()).min(1, t('validation.userIdsRequired')),
      account_id: z.string().min(1, t('validation.accountRequired')),
      start_date: z.string().min(1, t('validation.startDateRequired')),
      end_date: z.string().optional(),
      due_day: z
        .string()
        .min(1, t('validation.dueDayRequired'))
        .refine(
          (val) => {
            const num = Number.parseInt(val, 10);
            return !Number.isNaN(num) && num >= 1 && num <= 31;
          },
          {
            message: t('validation.dueDayRange'),
          }
        ),
    })
    .refine(
      (data) => {
        if (data.end_date && data.start_date) {
          return new Date(data.end_date) > new Date(data.start_date);
        }
        return true;
      },
      {
        message: t('validation.endDateAfterStart'),
        path: ['end_date'],
      }
    );
}

export type RecurringFormData = z.infer<ReturnType<typeof createRecurringSchema>>;

export interface RecurringTransactionSeriesData {
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category: string;
  frequency: TransactionFrequencyType;
  account_id: string;
  start_date: string;
  end_date: string | null;
  due_day: number;
  user_ids: string[];
  group_id: string;
}
