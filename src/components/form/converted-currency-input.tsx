'use client';
import { useState } from 'react';
import { useCurrency } from '@/providers/currency-provider';
import { parseDecimal } from '@/lib/utils/parse-decimal';
import { FormCurrencyInput, type FormCurrencyInputProps } from './form-currency-input';

/** The form retains accounting EUR; only the visible input uses the preferred currency. */
export function ConvertedCurrencyInput(props: FormCurrencyInputProps) {
  const currency = useCurrency();
  const base = String(props.value);
  const number = parseDecimal(base);
  const display = !base || !Number.isFinite(number) ? base : currency.toDisplay(number).toFixed(2);
  const [draft, setDraft] = useState<{ base: string; text: string; currency: string } | null>(null);
  const visible =
    draft?.base === base && draft.currency === currency.currency ? draft.text : display;
  return (
    <FormCurrencyInput
      {...props}
      value={currency.currency === 'EUR' ? props.value : visible}
      onChange={(text) => {
        if (currency.currency === 'EUR') {
          props.onChange(text);
          return;
        }
        const entered = parseDecimal(text);
        // Focusing/blurring an unchanged rounded counterpart must preserve the original cents.
        const next = Number.isFinite(entered)
          ? entered === parseDecimal(visible)
            ? base
            : currency.toBase(entered).toFixed(2)
          : text;
        setDraft({ base: next, text, currency: currency.currency });
        if (next !== base) props.onChange(next);
      }}
    />
  );
}
