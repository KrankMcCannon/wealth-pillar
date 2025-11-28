/**
 * AmountField - Reusable currency input field
 */

"use client";

import { FormField, FormCurrencyInput } from "@/components/form";

interface AmountFieldProps {
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
  min?: number;
}

export function AmountField({
  value,
  onChange,
  error,
  required = true,
  label = "Importo",
  placeholder,
  min = 0
}: AmountFieldProps) {
  return (
    <FormField label={label} required={required} error={error}>
      <FormCurrencyInput
        value={value}
        onChange={onChange}
        min={min}
        placeholder={placeholder}
      />
    </FormField>
  );
}
