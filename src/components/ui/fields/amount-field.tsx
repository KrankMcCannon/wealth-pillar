/**
 * AmountField - Reusable currency input field
 */

"use client";

import { FormCurrencyInput } from "../form-currency-input";
import { FormField } from "../form-field";



interface AmountFieldProps {
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  min?: number;
}

export function AmountField({
  value,
  onChange,
  error,
  required = true,
  label = "Importo",
  min = 0
}: AmountFieldProps) {
  return (
    <FormField label={label} required={required} error={error}>
      <FormCurrencyInput
        value={value}
        onChange={onChange}
        min={min}
      />
    </FormField>
  );
}
