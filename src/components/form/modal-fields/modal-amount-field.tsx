'use client';

import { useController, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { FormCurrencyInput } from '@/components/form/form-currency-input';
import { formModalStyles as s } from '@/components/form/form-modal-styles';
import { ModalFormField } from './modal-form-field';

export interface ModalAmountFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: string;
  currency?: string;
  variant?: 'hero' | 'inline';
  disabled?: boolean;
  placeholder?: string;
}

export function ModalAmountField<T extends FieldValues>({
  control,
  name,
  label,
  currency = '€',
  variant = 'hero',
  disabled,
  placeholder,
}: Readonly<ModalAmountFieldProps<T>>) {
  const {
    field,
    fieldState: { error },
  } = useController({ control, name });
  const resolvedLabel = label ?? '';
  const handleChange = field.onChange;

  const input = (
    <FormCurrencyInput
      value={field.value ?? ''}
      onChange={handleChange}
      placeholder={placeholder}
      disabled={disabled}
      className={s.amountInput}
      showSymbol={false}
    />
  );

  if (variant === 'inline') {
    return (
      <ModalFormField
        {...(resolvedLabel ? { label: resolvedLabel } : {})}
        variant="inline"
        {...(error?.message !== undefined ? { error: error.message } : {})}
      >
        {input}
      </ModalFormField>
    );
  }

  return (
    <ModalFormField
      variant="hero"
      {...(error?.message !== undefined ? { error: error.message } : {})}
    >
      <section
        className={`${s.amountSection} group/amount`}
        aria-labelledby={`${String(name)}-label`}
      >
        {resolvedLabel ? (
          <p id={`${String(name)}-label`} className={s.amountEyebrow}>
            {resolvedLabel}
          </p>
        ) : null}
        <div className={s.amountRow}>
          <span className={s.amountCurrency} aria-hidden>
            {currency}
          </span>
          {input}
        </div>
        <div className={s.amountTrack} aria-hidden>
          <div className={s.amountTrackFill} />
        </div>
      </section>
    </ModalFormField>
  );
}
