'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { ITFlag, USFlag } from '@/components/ui/icons/flags';

export interface PreferenceOption {
  value: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
}

interface PreferenceOptions {
  currencyOptions: PreferenceOption[];
  languageOptions: PreferenceOption[];
  timezoneOptions: PreferenceOption[];
}

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
          icon: <ITFlag className="h-full w-full object-cover" />,
        },
        {
          value: 'en-US',
          label: t('language.en-US.label'),
          description: t('language.en-US.description'),
          icon: <USFlag className="h-full w-full object-cover" />,
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
