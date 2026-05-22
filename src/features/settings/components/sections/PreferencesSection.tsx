'use client';

import { ChevronRight, CreditCard, Globe, Moon, Languages } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { stitchSettings as s } from '@/styles/home-design-foundation';
import { useMounted } from '@/hooks';
import { usePreferenceOptions } from '@/features/settings/utils/preference-options';
import { getLanguagePreferenceForLocale } from '@/features/settings/utils/language-preference';
import type { UserPreferences } from '@/lib/types';
import { cn } from '@/lib/utils';

interface PreferencesSectionProps {
  preferences: UserPreferences | null;
  onOpenCurrency: () => void;
  onOpenLanguage: () => void;
  onOpenTimezone: () => void;
}

function PreferenceRow({
  icon,
  label,
  value,
  onClick,
  divider = true,
}: Readonly<{
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
  onClick: () => void;
  divider?: boolean;
}>) {
  return (
    <button type="button" className={cn(s.row, divider && s.rowDivider)} onClick={onClick}>
      <div className={s.rowLeft}>
        <div className={s.rowIconWrap}>{icon}</div>
        <span className={s.rowLabel}>{label}</span>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {value ? <span className={s.rowValue}>{value}</span> : null}
        <ChevronRight className={s.rowChevron} aria-hidden />
      </div>
    </button>
  );
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

  const currencyLabel =
    preferences?.currency &&
    currencyOptions.find((opt) => opt.value === preferences.currency)?.label
      ? currencyOptions.find((opt) => opt.value === preferences.currency)?.label
      : (preferences?.currency ?? t('currencyFallback'));

  const languageLabel =
    currentLanguage && languageOptions.find((opt) => opt.value === currentLanguage)?.label
      ? languageOptions.find((opt) => opt.value === currentLanguage)?.label
      : t('languageFallback');

  const timezoneLabel =
    preferences?.timezone &&
    timezoneOptions.find((opt) => opt.value === preferences.timezone)?.label
      ? timezoneOptions.find((opt) => opt.value === preferences.timezone)?.label
      : t('timezoneFallback');

  return (
    <section className="space-y-2">
      <h3 className={s.sectionEyebrow}>{t('title')}</h3>
      <div className={s.sectionCard}>
        <PreferenceRow
          icon={<CreditCard className={s.rowIcon} aria-hidden />}
          label={t('currencyLabel')}
          value={currencyLabel}
          onClick={onOpenCurrency}
        />
        <PreferenceRow
          icon={<Languages className={s.rowIcon} aria-hidden />}
          label={t('languageLabel')}
          value={languageLabel}
          onClick={onOpenLanguage}
        />
        <PreferenceRow
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
