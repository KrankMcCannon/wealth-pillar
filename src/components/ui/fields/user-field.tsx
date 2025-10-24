/**
 * UserField - Reusable user selector field
 */

"use client";

import { useUsers } from '@/src/lib';
import { useMemo } from "react";
import { FormField } from "../form-field";
import { FormSelect } from "../form-select";

interface UserFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
}

export function UserField({
  value,
  onChange,
  error,
  required = true,
  label = "Utente"
}: UserFieldProps) {
  const { data: users = [] } = useUsers();

  const options = useMemo(() =>
    users.map(u => ({ value: u.id, label: u.name })),
    [users]
  );

  return (
    <FormField label={label} required={required} error={error}>
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder="Seleziona utente"
      />
    </FormField>
  );
}
