'use client';
import { useCurrency } from '@/providers/currency-provider';

import { useCallback } from 'react';
import { useLocale } from 'next-intl';

export function useFormatCurrency() {
  const { format: formatCurrencyLocale } = useCurrency();

  const locale = useLocale();
  const format = useCallback(
    (value: number) => formatCurrencyLocale(value, locale),
    [locale, formatCurrencyLocale]
  );
  return { format };
}
