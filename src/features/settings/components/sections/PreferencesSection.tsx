import { SectionHeader } from '@/components/layout';
import { ListContainer, PageSection, SettingsItem } from '@/components/ui/layout';
import { usePreferenceOptions } from '../preference-select-modal';
import { CreditCard, Globe, Settings } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { UserPreferences } from '@/server/services';
import { getLanguagePreferenceForLocale } from '@/features/settings/utils/language-preference';

interface PreferencesSectionProps {
  preferences: UserPreferences | null;
  isLoadingPreferences: boolean;
  onOpenCurrency: () => void;
  onOpenLanguage: () => void;
  onOpenTimezone: () => void;
}

export function PreferencesSection({
  preferences,
  isLoadingPreferences,
  onOpenCurrency,
  onOpenLanguage,
  onOpenTimezone,
}: Readonly<PreferencesSectionProps>) {
  const t = useTranslations('SettingsSections.Preferences');
  const locale = useLocale();
  const { currencyOptions, languageOptions, timezoneOptions } = usePreferenceOptions();
  const currentLanguage = getLanguagePreferenceForLocale(locale, preferences?.language);

  return (
    <PageSection>
      <SectionHeader title={t('title')} icon={Settings} iconClassName="text-primary" />
      <PageSection variant="card" padding="sm">
        <ListContainer divided className="divide-primary/20 space-y-0">
          <SettingsItem
            icon={<CreditCard className="h-4 w-4 text-primary" />}
            label={t('currencyLabel')}
            value={
              preferences?.currency
                ? currencyOptions.find((opt) => opt.value === preferences.currency)?.label ||
                  preferences.currency
                : t('currencyFallback')
            }
            actionType="button"
            buttonLabel={t('changeButton')}
            onPress={onOpenCurrency}
            disabled={isLoadingPreferences}
          />

          <SettingsItem
            icon={<Globe className="h-4 w-4 text-primary" />}
            label={t('languageLabel')}
            value={(() => {
              if (!currentLanguage) return t('languageFallback');

              const option = languageOptions.find((opt) => opt.value === currentLanguage);
              if (!option) return currentLanguage;

              return (
                <div className="flex items-center gap-2">
                  {option.icon && (
                    <div className="w-5 h-5 rounded-full overflow-hidden border border-border">
                      {option.icon}
                    </div>
                  )}
                  <span>{option.label}</span>
                </div>
              );
            })()}
            actionType="button"
            buttonLabel={t('changeButton')}
            onPress={onOpenLanguage}
            disabled={isLoadingPreferences}
          />

          <SettingsItem
            icon={<Globe className="h-4 w-4 text-primary" />}
            label={t('timezoneLabel')}
            value={
              preferences?.timezone
                ? timezoneOptions.find((opt) => opt.value === preferences.timezone)?.label ||
                  preferences.timezone
                : t('timezoneFallback')
            }
            actionType="button"
            buttonLabel={t('changeButton')}
            onPress={onOpenTimezone}
            disabled={isLoadingPreferences}
          />
        </ListContainer>
      </PageSection>
    </PageSection>
  );
}
