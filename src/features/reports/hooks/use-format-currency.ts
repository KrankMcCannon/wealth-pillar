'use client';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';

export function useFormatCurrency() {
  const locale = useLocale();
  const format = useCallback((value: number) => formatCurrencyLocale(value, locale), [locale]);
  return { format };
}
