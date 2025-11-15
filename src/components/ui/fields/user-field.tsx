/**
 * UserField - Reusable user selector field
 */

"use client";

import { FormField } from "../form-field";
import { FormSelect } from "../form-select";

interface UserFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
}

export function UserField({ value, onChange, error, required = true, label = "Utente" }: UserFieldProps) {
  return (
    <FormField label={label} required={required} error={error}>
      <FormSelect value={value} onValueChange={onChange} options={[]} placeholder="Seleziona utente" />
    </FormField>
  );
}
