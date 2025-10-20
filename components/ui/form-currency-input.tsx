"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Euro } from "lucide-react";

/**
 * Form Currency Input Component
 *
 * Specialized input for EUR currency with formatting and validation.
 * Handles decimal precision and numeric-only input.
 *
 * @example
 * ```tsx
 * <FormCurrencyInput
 *   value={formData.amount}
 *   onChange={(value) => handleChange('amount', value)}
 *   placeholder="0.00"
 * />
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface FormCurrencyInputProps {
  /** Current value (string or number) */
  value: string | number;
  /** Callback when value changes (returns string) */
  onChange: (value: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Show currency symbol */
  showSymbol?: boolean;
  /** Minimum allowed value */
  min?: number;
  /** Maximum allowed value */
  max?: number;
  /** Decimal places (default: 2) */
  decimals?: number;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function FormCurrencyInput({
  value,
  onChange,
  placeholder = "0.00",
  disabled = false,
  className,
  showSymbol = true,
  min,
  max,
  decimals = 2,
}: FormCurrencyInputProps) {
  // Convert value to string for input
  const stringValue = typeof value === "number" ? value.toString() : value;

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    // Allow empty string
    if (inputValue === "") {
      onChange("");
      return;
    }

    // Allow only numbers and decimal point
    const cleanedValue = inputValue.replace(/[^\d.,]/g, "");

    // Replace comma with dot for decimal
    const normalizedValue = cleanedValue.replace(",", ".");

    // Validate decimal places
    const parts = normalizedValue.split(".");
    if (parts.length > 2) return; // Multiple decimal points

    if (parts[1] && parts[1].length > decimals) {
      return; // Too many decimal places
    }

    // Validate min/max
    if (normalizedValue !== "" && normalizedValue !== ".") {
      const numValue = parseFloat(normalizedValue);
      if (!isNaN(numValue)) {
        if (min !== undefined && numValue < min) return;
        if (max !== undefined && numValue > max) return;
      }
    }

    onChange(normalizedValue);
  };

  // Handle blur - format the value
  const handleBlur = () => {
    if (stringValue === "" || stringValue === ".") {
      onChange("");
      return;
    }

    const numValue = parseFloat(stringValue);
    if (!isNaN(numValue)) {
      // Format to fixed decimal places
      const formatted = numValue.toFixed(decimals);
      onChange(formatted);
    } else {
      onChange("");
    }
  };

  return (
    <div className="relative">
      {showSymbol && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Euro className="h-4 w-4 text-primary/60" />
        </div>
      )}
      <Input
        type="text"
        inputMode="decimal"
        value={stringValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={cn(
          "bg-card border-primary/20 focus:ring-2 focus:ring-primary/20 text-primary",
          showSymbol && "pl-10",
          "text-right font-mono",
          className
        )}
      />
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Formats number to EUR currency string
 */
export function formatCurrency(
  amount: number | string,
  options?: {
    showSymbol?: boolean;
    decimals?: number;
    locale?: string;
  }
): string {
  const {
    showSymbol = true,
    decimals = 2,
    locale = "it-IT",
  } = options || {};

  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) return showSymbol ? "€ 0.00" : "0.00";

  const formatted = new Intl.NumberFormat(locale, {
    style: showSymbol ? "currency" : "decimal",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numAmount);

  return formatted;
}

/**
 * Parses currency string to number
 */
export function parseCurrency(value: string): number {
  if (!value) return 0;
  // Remove currency symbols, spaces, and replace comma with dot
  const cleaned = value.replace(/[€$\s]/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validates if string is valid currency amount
 */
export function isValidCurrency(
  value: string,
  options?: { min?: number; max?: number; decimals?: number }
): boolean {
  const { min, max, decimals = 2 } = options || {};

  if (!value) return false;

  const num = parseCurrency(value);
  if (isNaN(num)) return false;

  if (min !== undefined && num < min) return false;
  if (max !== undefined && num > max) return false;

  // Check decimal places
  const parts = value.split(/[.,]/);
  if (parts[1] && parts[1].length > decimals) return false;

  return true;
}

/**
 * Rounds currency to specified decimal places
 */
export function roundCurrency(amount: number, decimals: number = 2): number {
  return Math.round(amount * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * Converts form input to numeric amount
 */
export function getNumericAmount(amount: string | number): number {
  if (typeof amount === "number") return amount;
  return parseCurrency(amount);
}

// Export types
// Note: avoid re-exporting the same type name to prevent TS duplicate export conflicts.
