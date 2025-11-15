/**
 * AccountField - Reusable account selector field
 */

"use client";

import { FormField } from "../form-field";
import { FormSelect } from "../form-select";

interface AccountFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  userId?: string; // Optional user filter
}

export function AccountField({ value, onChange, error, required = true, label = "Conto" }: AccountFieldProps) {
  return (
    <FormField label={label} required={required} error={error}>
      <FormSelect value={value} onValueChange={onChange} options={[]} placeholder="Seleziona conto" />
    </FormField>
  );
}
