/**
 * UserField - Reusable user selector field
 */

"use client";

import { FormField, FormSelect } from "@/components/form";
import type { User } from "@/lib/types";

interface UserFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
  users?: User[];
  disabled?: boolean;
  helperText?: string;
}

export function UserField({
  value,
  onChange,
  error,
  required = true,
  label = "Utente",
  placeholder = "Seleziona utente",
  users = [],
  disabled = false,
  helperText,
}: Readonly<UserFieldProps>) {
  const options = users.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  return (
    <FormField label={label} required={required} error={error} helperText={helperText}>
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={placeholder}
        disabled={disabled}
      />
    </FormField>
  );
}
