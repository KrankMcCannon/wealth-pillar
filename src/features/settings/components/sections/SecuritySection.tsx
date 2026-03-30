import { SectionHeader } from '@/components/layout';
import { ListContainer, PageSection, SettingsItem } from '@/components/ui/layout';
import { Loader2, LogOut, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SecuritySectionProps {
  isSigningOut: boolean;
  onSignOut: () => void;
  /** Se assente, la riga 2FA è informativa (nessuna azione) con copy “in arrivo”. */
  onNavigateTo2FA?: () => void;
}

export function SecuritySection({
  isSigningOut,
  onSignOut,
  onNavigateTo2FA,
}: Readonly<SecuritySectionProps>) {
  const t = useTranslations('SettingsSections.Security');
  const twoFactorReady = typeof onNavigateTo2FA === 'function';

  return (
    <PageSection>
      <SectionHeader title={t('title')} icon={Shield} iconClassName="text-primary" />
      <PageSection variant="card" padding="sm">
        <ListContainer divided className="space-y-0">
          {twoFactorReady ? (
            <SettingsItem
              icon={<Shield className="h-4 w-4 text-primary" />}
              label={t('twoFactorLabel')}
              description={t('twoFactorDescription')}
              actionType="navigation"
              onPress={onNavigateTo2FA}
            />
          ) : (
            <SettingsItem
              icon={<Shield className="h-4 w-4 text-primary" />}
              label={t('twoFactorLabel')}
              description={t('twoFactorUnavailableDescription')}
              actionType="custom"
              action={
                <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary/80">
                  {t('twoFactorBadge')}
                </span>
              }
            />
          )}

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
