'use client';

import { withDeadline } from '@/lib/utils/with-deadline';

import { useCurrency } from '@/providers/currency-provider';
import { isCurrency } from '@/lib/currency/types';
import { useCallback, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { SelectionModal } from '@/components/form/selection-modal';
import { toast } from '@/hooks/use-toast';
import { updateUserPreferencesAction } from '@/features/settings/actions';
import { useSettingsModalsContext } from '@/features/settings/context/settings-modals-context';
import { getLanguagePreferenceForLocale } from '@/features/settings/utils/language-preference';
import { useModalState } from '@/lib/navigation/url-state';
import type { UserPreferencesUpdate } from '@/lib/types';
import {
  usePreferenceOptions,
  type PreferenceOption,
} from '@/features/settings/utils/preference-options';

function usePreferenceModalSave(preferenceKey: keyof UserPreferencesUpdate) {
  const currency = useCurrency();
  const t = useTranslations('SettingsModals.PreferenceSelect');
  const { currentUser, onPreferenceUpdate } = useSettingsModalsContext();
  const { closeModal } = useModalState();
  const router = useRouter();
  const pathname = usePathname();
  const [isSaving, setIsSaving] = useState(false);

  const onSave = useCallback(
    async (
      selectedValue: string,
      currentValue: string,
      title: string,
      options: PreferenceOption[]
    ) => {
      if (selectedValue === currentValue) {
        closeModal();
        return;
      }

      const updates: UserPreferencesUpdate = { [preferenceKey]: selectedValue };
      const selectedOption = options.find((opt) => opt.value === selectedValue);

      setIsSaving(true);
      try {
        const { data, error } = await withDeadline(
          updateUserPreferencesAction(currentUser.id, updates)
        );
        if (error || !data) {
          toast({
            title: t('toast.errorTitle'),
            description: error || t('toast.updateErrorDescription'),
            variant: 'destructive',
          });
          return;
        }

        toast({
          title: t('toast.updatedTitle'),
          description: t('toast.updatedDescription', {
            title,
            value: selectedOption?.label || selectedValue,
          }),
          variant: 'success',
        });
        onPreferenceUpdate(preferenceKey, selectedValue);
        if (preferenceKey === 'currency' && isCurrency(selectedValue)) {
          currency.setCurrency(selectedValue);
          router.refresh();
        }
        closeModal();
        if (preferenceKey === 'language') {
          const locale = selectedValue.toLowerCase().startsWith('en') ? 'en' : 'it';
          router.replace(pathname, { locale });
        }
      } catch {
        toast({
          title: t('toast.errorTitle'),
          description: t('toast.updateErrorDescription'),
          variant: 'destructive',
        });
      } finally {
        setIsSaving(false);
      }
    },
    [currency, closeModal, currentUser.id, onPreferenceUpdate, pathname, preferenceKey, router, t]
  );

  return { isSaving, onSave };
}

export function CurrencyPreferenceModal() {
  const t = useTranslations('SettingsContent');
  const { modal, closeModal } = useModalState();
  const { currencyOptions } = usePreferenceOptions();
  const { preferences } = useSettingsModalsContext();
  const { isSaving, onSave } = usePreferenceModalSave('currency');
  return (
    <SelectionModal
      isOpen={modal === 'settings:currency'}
      onClose={closeModal}
      title={t('currencyModalTitle')}
      value={preferences?.currency ?? 'EUR'}
      options={currencyOptions}
      isSaving={isSaving}
      onSave={(value) =>
        onSave(value, preferences?.currency ?? 'EUR', t('currencyModalTitle'), currencyOptions)
      }
    />
  );
}

export function LanguagePreferenceModal() {
  const t = useTranslations('SettingsContent');
  const locale = useLocale();
  const { modal, closeModal } = useModalState();
  const { preferences } = useSettingsModalsContext();
  const { languageOptions } = usePreferenceOptions();
  const { isSaving, onSave } = usePreferenceModalSave('language');

  if (!preferences) return null;

  const currentLanguageValue = getLanguagePreferenceForLocale(locale, preferences.language);

  return (
    <SelectionModal
      isOpen={modal === 'settings:language'}
      onClose={closeModal}
      title={t('languageModalTitle')}
      value={currentLanguageValue}
      options={languageOptions}
      isSaving={isSaving}
      onSave={(value) =>
        onSave(value, currentLanguageValue, t('languageModalTitle'), languageOptions)
      }
    />
  );
}

export function TimezonePreferenceModal() {
  const t = useTranslations('SettingsContent');
  const { modal, closeModal } = useModalState();
  const { preferences } = useSettingsModalsContext();
  const { timezoneOptions } = usePreferenceOptions();
  const { isSaving, onSave } = usePreferenceModalSave('timezone');

  if (!preferences) return null;

  return (
    <SelectionModal
      isOpen={modal === 'settings:timezone'}
      onClose={closeModal}
      title={t('timezoneModalTitle')}
      value={preferences.timezone}
      options={timezoneOptions}
      isSaving={isSaving}
      onSave={(value) =>
        onSave(value, preferences.timezone, t('timezoneModalTitle'), timezoneOptions)
      }
    />
  );
}
