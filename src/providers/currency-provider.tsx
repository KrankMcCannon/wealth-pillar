'use client';
import { createContext, useContext, useMemo, useState } from 'react';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import { useTranslations } from 'next-intl';
import type { Currency, CurrencySnapshot } from '@/lib/currency/types';

const defaults = { currency: 'EUR' as Currency, rates: {} };
const CurrencyContext = createContext<
  CurrencySnapshot & { locale: string; setCurrency: (currency: Currency) => void }
>({ ...defaults, locale: 'it-IT', setCurrency: (_currency: Currency) => {} });
export function CurrencyProvider({
  children,
  snapshot,
  locale,
}: {
  children: React.ReactNode;
  snapshot: CurrencySnapshot;
  locale: string;
}) {
  const [selection, setSelection] = useState<{ initial: Currency; currency: Currency } | null>(
    null
  );
  const currency =
    selection?.initial === snapshot.currency ? selection.currency : snapshot.currency;
  const value = useMemo(
    () => ({
      ...snapshot,
      currency,
      locale,
      setCurrency: (next: Currency) => setSelection({ initial: snapshot.currency, currency: next }),
    }),
    [snapshot, currency, locale]
  );
  return (
    <CurrencyContext.Provider value={value}>
      {currency !== 'EUR' && !snapshot.rates[currency] ? <CurrencyFallbackNotice /> : null}
      {children}
    </CurrencyContext.Provider>
  );
}
export function useCurrency() {
  const state = useContext(CurrencyContext);
  const quote = state.rates[state.currency];
  const available = state.currency === 'EUR' || Boolean(quote);
  const currency = available ? state.currency : 'EUR';
  const rate = currency === 'EUR' ? 1 : quote!.rate;
  return useMemo(
    () => ({
      ...state,
      currency,
      requestedCurrency: state.currency,
      available,
      rate,
      date: quote?.date ?? null,
      symbol:
        new Intl.NumberFormat(state.locale, { style: 'currency', currency })
          .formatToParts(0)
          .find((p) => p.type === 'currency')?.value ?? currency,
      toDisplay: (amount: number) => amount * rate,
      toBase: (amount: number) => Math.round((amount / rate + Number.EPSILON) * 100) / 100,
      format: (amount: number, locale = state.locale, options?: Intl.NumberFormatOptions) =>
        formatCurrencyLocale(amount * rate, locale, { ...options, currency }),
    }),
    [state, currency, quote, available, rate]
  );
}

function CurrencyFallbackNotice() {
  const t = useTranslations('Currency');
  return (
    <p role="status" className="bg-muted px-4 py-2 text-sm text-foreground">
      {t('unavailable')}
    </p>
  );
}
