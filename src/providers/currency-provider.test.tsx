import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { NextIntlClientProvider } from 'next-intl';
import { CurrencyProvider, useCurrency } from './currency-provider';
import { Amount } from '@/components/ui/primitives/amount';
import { ConvertedCurrencyInput } from '@/components/form/converted-currency-input';
import { useState } from 'react';
const snapshot = {
  currency: 'USD' as const,
  rates: { USD: { base: 'EUR', quote: 'USD', date: '2026-11-02', rate: 1.2 } },
};
function Readout() {
  const money = useCurrency();
  const [base, setBase] = useState('100');
  return (
    <>
      <Amount>{100}</Amount>
      <span data-testid="base">{base}</span>
      <ConvertedCurrencyInput id="input" value={base} onChange={setBase} bare />
      <button onClick={() => money.setCurrency('EUR')}>EUR</button>
    </>
  );
}
it('converts displays and form inputs while retaining accounting EUR and switching currency immediately', () => {
  render(
    <CurrencyProvider snapshot={snapshot} locale="en-US">
      <Readout />
    </CurrencyProvider>
  );
  expect(screen.getByText('$120.00')).toBeInTheDocument();
  expect(screen.getByRole('textbox')).toHaveValue('120.00');
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '240' } });
  expect(screen.getByTestId('base')).toHaveTextContent('200.00');
  fireEvent.click(screen.getByText('EUR'));
  expect(screen.getByRole('textbox')).toHaveValue('200.00');
  expect(screen.getByText('€100.00')).toBeInTheDocument();
});
it('preserves the original cents after focusing and blurring a rounded counterpart', () => {
  const roundSnapshot = { ...snapshot, rates: { USD: { ...snapshot.rates.USD, rate: 0.83 } } };
  function Field() {
    const [value, setValue] = useState('1.01');
    return (
      <>
        <output data-testid="original">{value}</output>
        <ConvertedCurrencyInput value={value} onChange={setValue} bare />
      </>
    );
  }
  render(
    <CurrencyProvider snapshot={roundSnapshot} locale="en-US">
      <Field />
    </CurrencyProvider>
  );
  fireEvent.blur(screen.getByRole('textbox'));
  fireEvent.blur(screen.getByRole('textbox'));
  expect(screen.getByTestId('original')).toHaveTextContent('1.01');
});
it('falls back explicitly to EUR when a required exchange rate is missing', () => {
  render(
    <NextIntlClientProvider
      locale="en"
      messages={{ Currency: { unavailable: 'Rate unavailable; showing EUR' } }}
    >
      <CurrencyProvider snapshot={{ currency: 'USD', rates: {} }} locale="en-US">
        <Amount>{100}</Amount>
      </CurrencyProvider>
    </NextIntlClientProvider>
  );
  expect(screen.getByRole('status')).toHaveTextContent('Rate unavailable');
  expect(screen.getByText('€100.00')).toBeInTheDocument();
});

it('formats converted compact chart axes without incompatible decimal settings', () => {
  function ChartLabel() {
    const money = useCurrency();
    return (
      <span>{money.format(1000, 'en-US', { notation: 'compact', maximumFractionDigits: 1 })}</span>
    );
  }
  render(
    <CurrencyProvider snapshot={snapshot} locale="en-US">
      <ChartLabel />
    </CurrencyProvider>
  );
  expect(screen.getByText('$1.2K')).toBeInTheDocument();
});
