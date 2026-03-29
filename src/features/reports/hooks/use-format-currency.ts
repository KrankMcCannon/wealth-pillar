'use client';

import { useLocale } from 'next-intl';
import { useMemo } from 'react';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';

export function useFormatCurrency() {
  const locale = useLocale();

  return useMemo(
    () => ({
      format: (value: number) => formatCurrencyLocale(value, locale),
      formatCompact: (value: number) =>
        formatCurrencyLocale(value, locale, {
          notation: 'compact',
          maximumFractionDigits: 1,
        }),
      locale,
    }),
    [locale]
  );
}
