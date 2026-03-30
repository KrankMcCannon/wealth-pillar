'use client';

import * as React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ModalBody, ModalFooter, ModalWrapper } from '@/components/ui/modal-wrapper';
import { toast } from '@/hooks/use-toast';
import { updateUserPreferencesAction } from '@/features/settings';
import type { UserPreferencesUpdate } from '@/lib/types';
import { cn } from '@/lib';
import { settingsStyles } from '@/features/settings/theme';
import { ITFlag, USFlag } from '@/components/ui/icons/flags';
import { usePathname, useRouter } from '@/i18n/routing';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface PreferenceOption {
  value: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
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
}: Readonly<PreferenceSelectModalProps>) {
  const t = useTranslations('SettingsModals.PreferenceSelect');
  const radioGroupName = React.useId().replace(/:/g, '');
  const [selectedValue, setSelectedValue] = React.useState(currentValue);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
        title: t('toast.noChangesTitle'),
        description: t('toast.noChangesDescription'),
        variant: 'info',
      });
      onOpenChange(false);
      return;
    }

    try {
      // Call server action with appropriate preference key
      const updates: UserPreferencesUpdate = {
        [preferenceKey]: selectedValue,
      };

      const selectedOption = options.find((opt) => opt.value === selectedValue);

      // Language changes should feel immediate: switch locale first,
      // then persist the preference asynchronously.
      if (preferenceKey === 'language') {
        const routingLocale = selectedValue.toLowerCase().startsWith('en') ? 'en' : 'it';
        const queryString = searchParams.toString();
        const href = queryString ? `${pathname}?${queryString}` : pathname;

        toast({
          title: t('toast.updatedTitle'),
          description: t('toast.updatedDescription', {
            title,
            value: selectedOption?.label || selectedValue,
          }),
          variant: 'success',
        });

        if (onSuccess) {
          onSuccess(selectedValue);
        }

        onOpenChange(false);
        router.replace(href, { locale: routingLocale });

        updateUserPreferencesAction(userId, updates)
          .then(({ error }) => {
            if (error) {
              toast({
                title: t('toast.errorTitle'),
                description: error,
                variant: 'destructive',
              });
            }
          })
          .catch(() => {
            toast({
              title: t('toast.errorTitle'),
              description: t('toast.updateErrorDescription'),
              variant: 'destructive',
            });
          });

        return;
      }

      setIsSubmitting(true);

      const { error } = await updateUserPreferencesAction(userId, updates);

      if (error) {
        toast({
          title: t('toast.errorTitle'),
          description: error,
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Show success toast
      toast({
        title: t('toast.updatedTitle'),
        description: t('toast.updatedDescription', {
          title,
          value: selectedOption?.label || selectedValue,
        }),
        variant: 'success',
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(selectedValue);
      }

      // Close modal
      onOpenChange(false);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error updating preference:', error);
      toast({
        title: t('toast.errorTitle'),
        description: t('toast.updateErrorDescription'),
        variant: 'destructive',
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
    >
      <ModalBody>
        <div role="radiogroup" aria-label={title} className={settingsStyles.modals.preference.list}>
          {options.map((option) => {
            const isSelected = selectedValue === option.value;
            const isCurrent = currentValue === option.value;

            return (
              <label
                key={option.value}
                className={cn(
                  settingsStyles.modals.preference.itemBase,
                  'block cursor-pointer min-w-0',
                  isSelected
                    ? settingsStyles.modals.preference.itemActive
                    : settingsStyles.modals.preference.itemIdle,
                  isSubmitting && 'opacity-50 pointer-events-none cursor-not-allowed'
                )}
              >
                <input
                  type="radio"
                  name={`settings-pref-${preferenceKey}-${radioGroupName}`}
                  value={option.value}
                  checked={isSelected}
                  onChange={() => setSelectedValue(option.value)}
                  disabled={isSubmitting}
                  className="peer sr-only"
                />
                <span className="flex items-start gap-3 w-full min-w-0 rounded-[inherit] peer-focus-visible:ring-2 peer-focus-visible:ring-primary/20 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-background">
                  <div
                    className={cn(
                      settingsStyles.modals.preference.radioBase,
                      isSelected
                        ? settingsStyles.modals.preference.radioActive
                        : settingsStyles.modals.preference.radioIdle
                    )}
                    aria-hidden
                  >
                    {isSelected && <Check className={settingsStyles.modals.preference.radioIcon} />}
                  </div>

                  {option.icon && (
                    <div
                      className="mr-3 w-8 h-8 rounded-full overflow-hidden shrink-0 border border-border"
                      aria-hidden
                    >
                      {option.icon}
                    </div>
                  )}

                  <div className={settingsStyles.modals.preference.content}>
                    <div className={settingsStyles.modals.preference.titleRow}>
                      <span
                        className={cn(
                          settingsStyles.modals.preference.title,
                          isSelected
                            ? settingsStyles.modals.preference.titleActive
                            : settingsStyles.modals.preference.titleIdle
                        )}
                      >
                        {option.label}
                      </span>
                      {isCurrent && (
                        <span className={settingsStyles.modals.preference.currentBadge}>
                          {t('currentBadge')}
                        </span>
                      )}
                    </div>
                    <p className={settingsStyles.modals.preference.description}>
                      {option.description}
                    </p>
                  </div>
                </span>
              </label>
            );
          })}
        </div>
      </ModalBody>
      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isSubmitting}
          className={settingsStyles.modals.actionsButton}
        >
          {t('cancelButton')}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSubmitting || selectedValue === currentValue}
          className={settingsStyles.modals.actionsButton}
        >
          {isSubmitting ? (
            <>
              <Loader2 className={settingsStyles.modals.loadingIcon} />
              {t('savingButton')}
            </>
          ) : (
            t('saveButton')
          )}
        </Button>
      </ModalFooter>
    </ModalWrapper>
  );
}

// ============================================================================
// PREDEFINED OPTIONS
// ============================================================================

interface PreferenceOptions {
  currencyOptions: PreferenceOption[];
  languageOptions: PreferenceOption[];
  timezoneOptions: PreferenceOption[];
}

/**
 * Translation-aware preference options.
 * Keeps labels/descriptions localized without hardcoded user-facing text.
 */
export function usePreferenceOptions(): PreferenceOptions {
  const t = useTranslations('SettingsOptions');

  return React.useMemo(
    () => ({
      currencyOptions: [
        {
          value: 'EUR',
          label: t('currency.EUR.label'),
          description: t('currency.EUR.description'),
        },
        {
          value: 'USD',
          label: t('currency.USD.label'),
          description: t('currency.USD.description'),
        },
        {
          value: 'GBP',
          label: t('currency.GBP.label'),
          description: t('currency.GBP.description'),
        },
        {
          value: 'CHF',
          label: t('currency.CHF.label'),
          description: t('currency.CHF.description'),
        },
      ],
      languageOptions: [
        {
          value: 'it-IT',
          label: t('language.it-IT.label'),
          description: t('language.it-IT.description'),
          icon: <ITFlag className="w-full h-full object-cover" />,
        },
        {
          value: 'en-US',
          label: t('language.en-US.label'),
          description: t('language.en-US.description'),
          icon: <USFlag className="w-full h-full object-cover" />,
        },
      ],
      timezoneOptions: [
        {
          value: 'Europe/Rome',
          label: t('timezone.Europe/Rome.label'),
          description: t('timezone.Europe/Rome.description'),
        },
        {
          value: 'Europe/London',
          label: t('timezone.Europe/London.label'),
          description: t('timezone.Europe/London.description'),
        },
        {
          value: 'Europe/Paris',
          label: t('timezone.Europe/Paris.label'),
          description: t('timezone.Europe/Paris.description'),
        },
        {
          value: 'Europe/Berlin',
          label: t('timezone.Europe/Berlin.label'),
          description: t('timezone.Europe/Berlin.description'),
        },
        {
          value: 'America/New_York',
          label: t('timezone.America/New_York.label'),
          description: t('timezone.America/New_York.description'),
        },
        {
          value: 'America/Los_Angeles',
          label: t('timezone.America/Los_Angeles.label'),
          description: t('timezone.America/Los_Angeles.description'),
        },
        {
          value: 'Asia/Tokyo',
          label: t('timezone.Asia/Tokyo.label'),
          description: t('timezone.Asia/Tokyo.description'),
        },
        {
          value: 'Australia/Sydney',
          label: t('timezone.Australia/Sydney.label'),
          description: t('timezone.Australia/Sydney.description'),
        },
      ],
    }),
    [t]
  );
}
