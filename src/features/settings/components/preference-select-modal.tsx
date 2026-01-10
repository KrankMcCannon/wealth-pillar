"use client";

import * as React from "react";
import { Check, Loader2 } from "lucide-react";
import { Button, ModalActions, ModalWrapper } from "@/components/ui";
import { toast } from "@/hooks/use-toast";
import { updateUserPreferencesAction } from "@/features/settings/actions";
import type { UserPreferencesUpdate } from "@/lib/services/user-preferences.service";
import { cn } from "@/lib";
import { settingsStyles } from "../theme";

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
      toast({
        title: "Nessuna modifica",
        description: "Il valore selezionato è già quello attuale",
        variant: "info",
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
        toast({
          title: "Errore",
          description: error,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Show success toast
      const selectedOption = options.find((opt) => opt.value === selectedValue);
      toast({
        title: "Preferenza aggiornata",
        description: `${title} impostato su ${selectedOption?.label || selectedValue}`,
        variant: "success",
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
      toast({
        title: "Errore",
        description: "Si è verificato un errore durante l'aggiornamento",
        variant: "destructive",
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
      titleClassName={settingsStyles.modals.title}
      descriptionClassName={settingsStyles.modals.description}
      disableOutsideClose={isSubmitting}
      footer={
        <ModalActions>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className={settingsStyles.modals.actionsButton}
          >
            Annulla
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSubmitting || selectedValue === currentValue}
            className={settingsStyles.modals.actionsButton}
          >
            {isSubmitting ? (
              <>
                <Loader2 className={settingsStyles.modals.loadingIcon} />
                Salvataggio...
              </>
            ) : (
              "Salva"
            )}
          </Button>
        </ModalActions>
      }
    >
      <div className={settingsStyles.modals.preference.list}>
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
                settingsStyles.modals.preference.itemBase,
                isSelected
                  ? settingsStyles.modals.preference.itemActive
                  : settingsStyles.modals.preference.itemIdle
              )}
            >
              {/* Radio indicator */}
              <div
                className={cn(
                  settingsStyles.modals.preference.radioBase,
                  isSelected
                    ? settingsStyles.modals.preference.radioActive
                    : settingsStyles.modals.preference.radioIdle
                )}
              >
                {isSelected && <Check className={settingsStyles.modals.preference.radioIcon} />}
              </div>

              {/* Content */}
              <div className={settingsStyles.modals.preference.content}>
                <div className={settingsStyles.modals.preference.titleRow}>
                  <span
                    className={cn(
                      settingsStyles.modals.preference.title,
                      isSelected ? settingsStyles.modals.preference.titleActive : settingsStyles.modals.preference.titleIdle
                    )}
                  >
                    {option.label}
                  </span>
                  {isCurrent && (
                    <span className={settingsStyles.modals.preference.currentBadge}>
                      Attuale
                    </span>
                  )}
                </div>
                <p className={settingsStyles.modals.preference.description}>
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
