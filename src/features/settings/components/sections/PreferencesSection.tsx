'use client';

import { CreditCard, Globe, Moon, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { stitchHome, stitchSettings as s } from '@/styles/home-design-foundation';
import { useMounted } from '@/hooks';
import { usePreferenceOptions } from '@/features/settings/utils/preference-options';
import { getLanguagePreferenceForLocale } from '@/features/settings/utils/language-preference';
import type { UserPreferences } from '@/lib/types';
import { cn } from '@/lib/utils';
import { SettingsRow } from './settings-row';

interface PreferencesSectionProps {
  preferences: UserPreferences | null;
  onOpenCurrency: () => void;
  onOpenLanguage: () => void;
  onOpenTimezone: () => void;
}

function resolveOptionLabel(
  value: string | undefined,
  options: { value: string; label: string }[],
  fallback: string
): string {
  if (!value) return fallback;
  return options.find((opt) => opt.value === value)?.label ?? value;
}

export function PreferencesSection({
  preferences,
  onOpenCurrency,
  onOpenLanguage,
  onOpenTimezone,
}: Readonly<PreferencesSectionProps>) {
  const t = useTranslations('SettingsSections.Preferences');
  const locale = useLocale();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const mounted = useMounted();
  const { currencyOptions, languageOptions, timezoneOptions } = usePreferenceOptions();
  const currentLanguage = getLanguagePreferenceForLocale(locale, preferences?.language);

  const isDark = mounted && (resolvedTheme ?? theme) === 'dark';

  const currencyLabel = resolveOptionLabel(
    preferences?.currency,
    currencyOptions,
    preferences?.currency ?? t('currencyFallback')
  );

  const languageLabel = resolveOptionLabel(currentLanguage, languageOptions, t('languageFallback'));

  const timezoneLabel = resolveOptionLabel(
    preferences?.timezone,
    timezoneOptions,
    preferences?.timezone ?? t('timezoneFallback')
  );

  return (
    <section className={stitchHome.scanSection}>
      <h3 className={s.sectionEyebrow}>{t('title')}</h3>
      <div className={s.sectionCard}>
        <SettingsRow
          icon={<CreditCard className={s.rowIcon} aria-hidden />}
          label={t('currencyLabel')}
          value={currencyLabel}
          onClick={onOpenCurrency}
        />
        <SettingsRow
          icon={<Languages className={s.rowIcon} aria-hidden />}
          label={t('languageLabel')}
          value={languageLabel}
          onClick={onOpenLanguage}
        />
        <SettingsRow
          icon={<Globe className={s.rowIcon} aria-hidden />}
          label={t('timezoneLabel')}
          value={timezoneLabel}
          onClick={onOpenTimezone}
        />
        <SettingsRow
          icon={<Moon className={s.rowIcon} aria-hidden />}
          label={t('darkModeLabel')}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          showChevron={false}
          divider={false}
          pressed={isDark}
          trailing={
            <div className={cn(s.darkModeTrack, isDark && s.darkModeTrackOn)} aria-hidden>
              <div className={cn(s.darkModeKnob, isDark && s.darkModeKnobOn)} />
            </div>
          }
        />
      </div>
    </section>
  );
}
