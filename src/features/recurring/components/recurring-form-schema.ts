import { RECURRING_FREQUENCIES } from '@/lib/recurring/frequencies';
import { parseDecimal } from '@/lib/utils/parse-decimal';
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
        .refine((val) => !Number.isNaN(parseDecimal(val)) && parseDecimal(val) > 0, {
          message: t('validation.amountGreaterThanZero'),
        }),
      type: z
        .enum(['income', 'expense', 'transfer'])
        .refine((type): boolean => type !== 'transfer', t('validation.transfersUnavailable')),
      category: z.string().min(1, t('validation.categoryRequired')),
      frequency: z.enum(RECURRING_FREQUENCIES),
      user_ids: z.array(z.string()).min(1, t('validation.userIdsRequired')),
      account_id: z.string().min(1, t('validation.accountRequired')),
      start_date: z.string().min(1, t('validation.startDateRequired')),
      end_date: z.string().optional(),
      due_day: z
        .string()
        .min(1, t('validation.dueDayRequired'))
        .refine(
          (val) => {
            const num = Number(val);
            return /^\d+$/.test(val) && Number.isInteger(num) && num >= 1 && num <= 31;
          },
          {
            message: t('validation.dueDayRange'),
          }
        ),
    })
    .refine(
      (data) => !['weekly', 'biweekly'].includes(data.frequency) || Number(data.due_day) <= 7,
      {
        message: t('validation.weekdayRange'),
        path: ['due_day'],
      }
    )
    .refine(
      (data) => {
        if (data.end_date && data.start_date) {
          return new Date(data.end_date) >= new Date(data.start_date);
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
  type: 'income' | 'expense' | 'transfer';
  category: string;
  frequency: TransactionFrequencyType;
  account_id: string;
  start_date: string;
  end_date: string | null;
  due_day: number;
  user_ids: string[];
  group_id: string;
}
