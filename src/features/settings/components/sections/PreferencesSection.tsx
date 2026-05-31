'use client';

import { CreditCard, Globe, Moon, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { stitchSettings as s } from '@/styles/home-design-foundation';
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
    <section className="flex flex-col gap-2">
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
        <button
          type="button"
          className={cn(s.row, 'cursor-default hover:bg-transparent')}
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-pressed={isDark}
        >
          <div className={s.rowLeft}>
            <div className={s.rowIconWrap}>
              <Moon className={s.rowIcon} aria-hidden />
            </div>
            <span className={s.rowLabel}>{t('darkModeLabel')}</span>
          </div>
          <div className={cn(s.darkModeTrack, isDark && s.darkModeTrackOn)} aria-hidden>
            <div className={cn(s.darkModeKnob, isDark && s.darkModeKnobOn)} />
          </div>
        </button>
      </div>
    </section>
  );
}
