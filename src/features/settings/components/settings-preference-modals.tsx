'use client';

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
} from '@/features/settings/components/preference-select-modal';

function usePreferenceModalSave(preferenceKey: keyof UserPreferencesUpdate) {
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

      if (preferenceKey === 'language') {
        setIsSaving(true);
        const routingLocale = selectedValue.toLowerCase().startsWith('en') ? 'en' : 'it';

        toast({
          title: t('toast.updatedTitle'),
          description: t('toast.updatedDescription', {
            title,
            value: selectedOption?.label || selectedValue,
          }),
          variant: 'success',
        });

        onPreferenceUpdate('language', selectedValue);
        closeModal();
        router.replace(pathname, { locale: routingLocale });

        updateUserPreferencesAction(currentUser.id, updates)
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
          })
          .finally(() => setIsSaving(false));

        return;
      }

      setIsSaving(true);
      try {
        const { error } = await updateUserPreferencesAction(currentUser.id, updates);
        if (error) {
          toast({ title: t('toast.errorTitle'), description: error, variant: 'destructive' });
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
        closeModal();
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
    [closeModal, currentUser.id, onPreferenceUpdate, pathname, preferenceKey, router, t]
  );

  return { isSaving, onSave };
}

export function CurrencyPreferenceModal() {
  const t = useTranslations('SettingsContent');
  const { modal, closeModal } = useModalState();
  const { preferences } = useSettingsModalsContext();
  const { currencyOptions } = usePreferenceOptions();
  const { isSaving, onSave } = usePreferenceModalSave('currency');

  if (!preferences) return null;

  return (
    <SelectionModal
      isOpen={modal === 'settings:currency'}
      onClose={closeModal}
      title={t('currencyModalTitle')}
      description={t('currencyModalDescription')}
      value={preferences.currency}
      options={currencyOptions}
      isSaving={isSaving}
      onSave={(value) =>
        onSave(value, preferences.currency, t('currencyModalTitle'), currencyOptions)
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
      description={t('languageModalDescription')}
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
      description={t('timezoneModalDescription')}
      value={preferences.timezone}
      options={timezoneOptions}
      isSaving={isSaving}
      onSave={(value) =>
        onSave(value, preferences.timezone, t('timezoneModalTitle'), timezoneOptions)
      }
    />
  );
}
