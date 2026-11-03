'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { FormCurrencyInput } from '@/components/form/form-currency-input';
import { parseDecimal } from '@/lib/utils/parse-decimal';
import { ConvertedCurrencyInput } from '@/components/form/converted-currency-input';
import { useCurrency } from '@/providers/currency-provider';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { ModalFormField } from './modal-form-field';
import { ModalFieldError } from './modal-field-error';

export interface ModalAmountFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  currency?: string;
  /** EUR inputs are never converted; only their read-only counterpart follows preferences. */
  inputCurrency?: 'EUR' | 'preferred';
  variant?: 'hero' | 'inline';
  disabled?: boolean;
  placeholder?: string;
  decimals?: number;
}

export function ModalAmountField<T extends FieldValues>({
  control,
  name,
  label,
  currency,
  inputCurrency = 'preferred',
  variant = 'hero',
  disabled,
  placeholder,
  decimals,
}: Readonly<ModalAmountFieldProps<T>>) {
  const preferred = useCurrency();
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  const accountingInput = inputCurrency === 'EUR';
  const inputCode = accountingInput ? 'EUR' : preferred.currency;
  const resolvedLabel = `${label ?? ''}${accountingInput && preferred.currency !== 'EUR' ? ' (EUR)' : ''}`;
  const Input = accountingInput ? FormCurrencyInput : ConvertedCurrencyInput;
  const amount = parseDecimal(String(field.value ?? ''));
  const counterpart =
    accountingInput && preferred.currency !== 'EUR' && Number.isFinite(amount) ? (
      <p className="px-4 pb-2 text-xs text-muted-foreground" aria-live="polite">
        ≈ {preferred.format(amount)}
      </p>
    ) : null;
  const fieldId = String(name);
  const errorId = `${fieldId}-error`;
  const handleChange = field.onChange;

  const input = (
    <Input
      id={fieldId}
      value={field.value ?? ''}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={variant === 'inline' ? s.field.textInput : s.amountInput}
      showSymbol={false}
      bare
      autoComplete="off"
      aria-invalid={error ? true : undefined}
      aria-describedby={error?.message ? errorId : undefined}
      {...(decimals !== undefined ? { decimals } : {})}
    />
  );

  if (variant === 'inline') {
    return (
      <div>
        <div className={s.field.textShell}>
          {resolvedLabel ? (
            <label htmlFor={fieldId} className={s.field.textLabel}>
              {resolvedLabel}
              {!accountingInput && inputCode !== 'EUR' ? ` (${inputCode})` : ''}
            </label>
          ) : null}
          {input}
        </div>
        {counterpart}
        {error?.message ? <ModalFieldError id={errorId} message={error.message} /> : null}
      </div>
    );
  }

  return (
    <ModalFormField variant="hero">
      <section className={s.amountSection}>
        {resolvedLabel ? (
          <label htmlFor={fieldId} id={`${fieldId}-label`} className={s.amountEyebrow}>
            {resolvedLabel}
          </label>
        ) : null}
        <div className={s.amountRow}>
          <span className={s.amountCurrency} aria-hidden>
            {currency ?? (accountingInput ? '€' : preferred.symbol)}
          </span>
          {input}
        </div>
      </section>
      {counterpart}
      {error?.message ? <ModalFieldError id={errorId} message={error.message} /> : null}
    </ModalFormField>
  );
}
