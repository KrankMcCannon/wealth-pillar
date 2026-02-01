
import { SectionHeader } from "@/components/layout";
import { ListContainer, PageSection, SettingsItem } from "@/components/ui/layout";
import { CURRENCY_OPTIONS, LANGUAGE_OPTIONS, TIMEZONE_OPTIONS } from "@/features/settings";
import { CreditCard, Globe, Settings } from "lucide-react";
import { UserPreferences } from "@/server/services";

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
  return (
    <PageSection>
      <SectionHeader title="Preferenze" icon={Settings} iconClassName="text-primary" />
      <PageSection variant="card" padding="sm">
        <ListContainer divided className="divide-primary/20 space-y-0">
          <SettingsItem
            icon={<CreditCard className="h-4 w-4 text-primary" />}
            label="Valuta"
            value={
              preferences?.currency
                ? CURRENCY_OPTIONS.find((opt) => opt.value === preferences.currency)?.label ||
                preferences.currency
                : "EUR - Euro"
            }
            actionType="button"
            buttonLabel="Cambia"
            onPress={onOpenCurrency}
            disabled={isLoadingPreferences}
          />

          <SettingsItem
            icon={<Globe className="h-4 w-4 text-primary" />}
            label="Lingua"
            value={
              preferences?.language
                ? LANGUAGE_OPTIONS.find((opt) => opt.value === preferences.language)?.label ||
                preferences.language
                : "Italiano"
            }
            actionType="button"
            buttonLabel="Cambia"
            onPress={onOpenLanguage}
            disabled={isLoadingPreferences}
          />

          <SettingsItem
            icon={<Globe className="h-4 w-4 text-primary" />}
            label="Fuso Orario"
            value={
              preferences?.timezone
                ? TIMEZONE_OPTIONS.find((opt) => opt.value === preferences.timezone)?.label ||
                preferences.timezone
                : "Roma (GMT+1)"
            }
            actionType="button"
            buttonLabel="Cambia"
            onPress={onOpenTimezone}
            disabled={isLoadingPreferences}
          />
        </ListContainer>
      </PageSection>
    </PageSection>
  );
}
