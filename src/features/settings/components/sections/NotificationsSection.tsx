import { SectionHeader } from '@/components/layout';
import { ListContainer, PageSection, SettingsItem } from '@/components/ui/layout';
import { Bell, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserPreferences } from '@/server/services';

interface NotificationsSectionProps {
  preferences: UserPreferences | null;
  isLoadingPreferences: boolean;
  onToggle: (key: keyof UserPreferences) => void;
}

export function NotificationsSection({
  preferences,
  isLoadingPreferences,
  onToggle,
}: Readonly<NotificationsSectionProps>) {
  const t = useTranslations('SettingsSections.Notifications');

  return (
    <PageSection>
      <SectionHeader title={t('title')} icon={Bell} iconClassName="text-primary" />
      <PageSection variant="card" padding="sm">
        <ListContainer divided className="divide-primary/20 space-y-0">
          <SettingsItem
            icon={<Bell className="h-4 w-4 text-primary" />}
            label={t('pushLabel')}
            description={t('pushDescription')}
            actionType="toggle"
            checked={preferences?.notifications_push ?? true}
            onToggle={() => onToggle('notifications_push')}
            disabled={isLoadingPreferences}
          />

          <SettingsItem
            icon={<Mail className="h-4 w-4 text-primary" />}
            label={t('emailLabel')}
            description={t('emailDescription')}
            actionType="toggle"
            checked={preferences?.notifications_email ?? false}
            onToggle={() => onToggle('notifications_email')}
            disabled={isLoadingPreferences}
          />

          <SettingsItem
            icon={<Bell className="h-4 w-4 text-primary" />}
            label={t('budgetAlertsLabel')}
            description={t('budgetAlertsDescription')}
            actionType="toggle"
            checked={preferences?.notifications_budget_alerts ?? true}
            onToggle={() => onToggle('notifications_budget_alerts')}
            disabled={isLoadingPreferences}
          />
        </ListContainer>
      </PageSection>
    </PageSection>
  );
}
