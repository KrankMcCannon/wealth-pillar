"use client";

import * as React from "react";
import { cn } from "@/lib";
import { settingsStyles } from "@/features/settings/theme";

export type SettingsModalFormProps = React.FormHTMLAttributes<HTMLFormElement>;

export function SettingsModalForm({ className, ...props }: SettingsModalFormProps) {
  return (
    <form
      className={cn(settingsStyles.modals.form, className)}
      {...props}
    />
  );
}

export interface SettingsModalFieldProps {
  id: string;
  label: string;
  error?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export function SettingsModalField({
  id,
  label,
  error,
  inputProps,
}: SettingsModalFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={settingsStyles.modals.field.label}>
        {label}
      </label>
      <input
        id={id}
        className={cn(
          settingsStyles.modals.field.input,
          error && settingsStyles.modals.field.inputError
        )}
        {...inputProps}
      />
      {error && (
        <p className={settingsStyles.modals.field.errorText}>{error}</p>
      )}
    </div>
  );
}
