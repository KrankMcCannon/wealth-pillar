"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { ModalWrapper, ModalActions } from "@/src/components/ui/modal-wrapper";
import { Button } from "@/components/ui";
import { useToast } from "@/src/components/ui/toast";
import { updateUserPreferencesAction } from "@/src/features/settings/actions";
import type { UserPreferencesUpdate } from "@/lib/services/user-preferences.service";
import { cn } from "@/src/lib";

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PreferenceOption {
  value: string;
  label: string;
  description: string;
}

export interface PreferenceSelectModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  title: string;
  description: string;
  currentValue: string;
  options: PreferenceOption[];
  preferenceKey: keyof UserPreferencesUpdate;
  onSuccess?: (newValue: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * PreferenceSelectModal Component
 * Reusable modal for selecting user preferences (currency, language, timezone)
 *
 * Features:
 * - Radio button selection UI
 * - Current value highlighted
 * - Description for each option
 * - Only saves if value changed
 * - Toast notifications for success/error
 * - Loading states
 *
 * @example
 * ```tsx
 * <PreferenceSelectModal
 *   isOpen={showModal}
 *   onOpenChange={setShowModal}
 *   userId={userId}
 *   title="Seleziona Valuta"
 *   description="Scegli la valuta predefinita per le tue transazioni"
 *   currentValue="EUR"
 *   options={currencyOptions}
 *   preferenceKey="currency"
 * />
 * ```
 */
export function PreferenceSelectModal({
  isOpen,
  onOpenChange,
  userId,
  title,
  description,
  currentValue,
  options,
  preferenceKey,
  onSuccess,
}: PreferenceSelectModalProps) {
  const { showToast } = useToast();
  const [selectedValue, setSelectedValue] = React.useState(currentValue);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset selected value when modal opens or currentValue changes
  React.useEffect(() => {
    if (isOpen) {
      setSelectedValue(currentValue);
    }
  }, [isOpen, currentValue]);

  const handleSave = async () => {
    // Check if value changed
    if (selectedValue === currentValue) {
      showToast({
        type: "info",
        title: "Nessuna modifica",
        description: "Il valore selezionato è già quello attuale",
      });
      onOpenChange(false);
      return;
    }

    setIsSubmitting(true);

    try {
      // Call server action with appropriate preference key
      const updates: UserPreferencesUpdate = {
        [preferenceKey]: selectedValue,
      };

      const { error } = await updateUserPreferencesAction(userId, updates);

      if (error) {
        showToast({
          type: "error",
          title: "Errore",
          description: error,
        });
        setIsSubmitting(false);
        return;
      }

      // Show success toast
      const selectedOption = options.find((opt) => opt.value === selectedValue);
      showToast({
        type: "success",
        title: "Preferenza aggiornata",
        description: `${title} impostato su ${selectedOption?.label || selectedValue}`,
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(selectedValue);
      }

      // Close modal
      onOpenChange(false);
      setIsSubmitting(false);
    } catch (error) {
      console.error("Error updating preference:", error);
      showToast({
        type: "error",
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento",
      });
      setIsSubmitting(false);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      disableOutsideClose={isSubmitting}
      footer={
        <ModalActions>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || selectedValue === currentValue}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvataggio...
              </>
            ) : (
              "Salva"
            )}
          </Button>
        </ModalActions>
      }
    >
      <div className="space-y-2">
        {options.map((option) => {
          const isSelected = selectedValue === option.value;
          const isCurrent = currentValue === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelectedValue(option.value)}
              disabled={isSubmitting}
              className={cn(
                "w-full text-left px-4 py-3 rounded-lg border-2 transition-all",
                "flex items-start gap-3",
                "hover:border-primary/40 hover:bg-primary/5",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                isSelected
                  ? "border-primary bg-primary/10"
                  : "border-gray-200 bg-white"
              )}
            >
              {/* Radio indicator */}
              <div
                className={cn(
                  "mt-0.5 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all",
                  isSelected
                    ? "border-primary bg-primary"
                    : "border-gray-300 bg-white"
                )}
              >
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "text-sm font-semibold",
                      isSelected ? "text-primary" : "text-gray-900"
                    )}
                  >
                    {option.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                      Attuale
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-0.5">
                  {option.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </ModalWrapper>
  );
}

// ============================================================================
// PREDEFINED OPTIONS
// ============================================================================

/**
 * Currency options for PreferenceSelectModal
 */
export const CURRENCY_OPTIONS: PreferenceOption[] = [
  {
    value: "EUR",
    label: "Euro (€)",
    description: "Valuta ufficiale dell'Unione Europea",
  },
  {
    value: "USD",
    label: "Dollaro Americano ($)",
    description: "Valuta ufficiale degli Stati Uniti",
  },
  {
    value: "GBP",
    label: "Sterlina Britannica (£)",
    description: "Valuta ufficiale del Regno Unito",
  },
  {
    value: "CHF",
    label: "Franco Svizzero (CHF)",
    description: "Valuta ufficiale della Svizzera",
  },
];

/**
 * Language options for PreferenceSelectModal
 */
export const LANGUAGE_OPTIONS: PreferenceOption[] = [
  {
    value: "it-IT",
    label: "Italiano",
    description: "Lingua italiana",
  },
  {
    value: "en-US",
    label: "English (US)",
    description: "American English",
  },
  {
    value: "en-GB",
    label: "English (UK)",
    description: "British English",
  },
  {
    value: "fr-FR",
    label: "Français",
    description: "Langue française",
  },
  {
    value: "de-DE",
    label: "Deutsch",
    description: "Deutsche Sprache",
  },
  {
    value: "es-ES",
    label: "Español",
    description: "Idioma español",
  },
];

/**
 * Timezone options for PreferenceSelectModal
 */
export const TIMEZONE_OPTIONS: PreferenceOption[] = [
  {
    value: "Europe/Rome",
    label: "Roma (GMT+1)",
    description: "Fuso orario dell'Italia centrale",
  },
  {
    value: "Europe/London",
    label: "Londra (GMT+0)",
    description: "Fuso orario del Regno Unito",
  },
  {
    value: "Europe/Paris",
    label: "Parigi (GMT+1)",
    description: "Fuso orario della Francia",
  },
  {
    value: "Europe/Berlin",
    label: "Berlino (GMT+1)",
    description: "Fuso orario della Germania",
  },
  {
    value: "America/New_York",
    label: "New York (GMT-5)",
    description: "Fuso orario della costa est USA",
  },
  {
    value: "America/Los_Angeles",
    label: "Los Angeles (GMT-8)",
    description: "Fuso orario della costa ovest USA",
  },
  {
    value: "Asia/Tokyo",
    label: "Tokyo (GMT+9)",
    description: "Fuso orario del Giappone",
  },
  {
    value: "Australia/Sydney",
    label: "Sydney (GMT+10)",
    description: "Fuso orario dell'Australia orientale",
  },
];
