import { SectionHeader } from '@/components/layout';
import { ListContainer, PageSection, SettingsItem } from '@/components/ui/layout';
import { Loader2, LogOut, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SecuritySectionProps {
  isSigningOut: boolean;
  onSignOut: () => void;
  onNavigateTo2FA: () => void;
}

export function SecuritySection({
  isSigningOut,
  onSignOut,
  onNavigateTo2FA,
}: Readonly<SecuritySectionProps>) {
  const t = useTranslations('SettingsSections.Security');

  return (
    <PageSection>
      <SectionHeader title={t('title')} icon={Shield} iconClassName="text-primary" />
      <PageSection variant="card" padding="sm">
        <ListContainer divided className="space-y-0">
          <SettingsItem
            icon={<Shield className="h-4 w-4 text-primary" />}
            label={t('twoFactorLabel')}
            description={t('twoFactorDescription')}
            actionType="navigation"
            onPress={onNavigateTo2FA}
          />

          <SettingsItem
            icon={
              isSigningOut ? (
                <Loader2 className="h-4 w-4 text-primary animate-spin" />
              ) : (
                <LogOut className="h-4 w-4 text-primary" />
              )
            }
            label={isSigningOut ? t('signingOutLabel') : t('signOutLabel')}
            description={isSigningOut ? t('signingOutDescription') : t('signOutDescription')}
            actionType={isSigningOut ? 'custom' : 'navigation'}
            onPress={onSignOut}
            disabled={isSigningOut}
          />
        </ListContainer>
      </PageSection>
    </PageSection>
  );
}
