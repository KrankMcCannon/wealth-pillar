import { z } from 'zod';
import type { useTranslations } from 'next-intl';
import { parseDecimal } from '@/lib/utils/parse-decimal';

export const createTransactionFormSchema = (t: ReturnType<typeof useTranslations>) =>
  z
    .object({
      description: z.string().min(2, t('validation.descriptionMin')).trim(),
      amount: z
        .string()
        .min(1, t('validation.amountRequired'))
        .refine((val) => !Number.isNaN(parseDecimal(val)) && parseDecimal(val) > 0, {
          message: t('validation.amountGreaterThanZero'),
        }),
      type: z.enum(['income', 'expense', 'transfer']),
      category: z.string().min(1, t('validation.categoryRequired')),
      date: z.string().min(1, t('validation.dateRequired')),
      user_id: z.string().min(1, t('validation.userRequired')),
      account_id: z.string().min(1, t('validation.accountRequired')),
      to_account_id: z.string().optional(),
    })
    .refine((data) => data.type !== 'transfer' || Boolean(data.to_account_id), {
      message: t('validation.destinationAccountRequired'),
      path: ['to_account_id'],
    })
    .refine((data) => data.type !== 'transfer' || data.to_account_id !== data.account_id, {
      message: t('validation.destinationAccountInvalid'),
      path: ['to_account_id'],
    });
