import { SectionHeader } from '@/components/layout';
import { PageSection, SettingsItem } from '@/components/ui/layout';
import { Trash2, User as UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AccountSectionProps {
  onDeleteAccount: () => void;
}

export function AccountSection({ onDeleteAccount }: Readonly<AccountSectionProps>) {
  const t = useTranslations('SettingsSections.Account');

  return (
    <PageSection>
      <SectionHeader title={t('title')} icon={UserIcon} iconClassName="text-destructive" />
      <PageSection variant="card" padding="sm">
        <SettingsItem
          icon={<Trash2 className="h-4 w-4 text-destructive" />}
          label={t('deleteLabel')}
          description={t('deleteDescription')}
          actionType="navigation"
          onPress={onDeleteAccount}
          variant="destructive"
        />
      </PageSection>
    </PageSection>
  );
}
