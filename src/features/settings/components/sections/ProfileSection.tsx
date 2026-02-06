import { SectionHeader } from '@/components/layout';
import { ListContainer, PageSection, SettingsItem } from '@/components/ui/layout';
import { settingsStyles } from '../../theme/settings-styles';
import { Mail, Phone, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui';
import { useTranslations } from 'next-intl';
import { User } from '@/lib/types';

interface ProfileSectionProps {
  currentUser: User;
  accountCount: number;
  transactionCount: number;
  userInitials: string;
  onEditProfile: () => void;
}

export function ProfileSection({
  currentUser,
  accountCount,
  transactionCount,
  userInitials,
  onEditProfile,
}: Readonly<ProfileSectionProps>) {
  const t = useTranslations('SettingsSections.Profile');

  const getRoleLabel = (role: string) => {
    if (role === 'superadmin') return t('roles.developer');
    if (role === 'admin') return t('roles.admin');
    return t('roles.member');
  };

  return (
    <PageSection>
      <SectionHeader title={t('title')} icon={UserIcon} iconClassName="text-primary" />

      <PageSection variant="card" padding="sm">
        {/* User Info Header */}
        <div className={settingsStyles.profile.header}>
          <div className={settingsStyles.profile.container}>
            <div
              className={settingsStyles.profile.avatar}
              style={{ backgroundColor: currentUser.theme_color || '#000000' }}
            >
              {userInitials}
            </div>
            <div className={settingsStyles.profile.info}>
              <h3 className={settingsStyles.profile.name}>{currentUser.name}</h3>
              <div className={settingsStyles.profile.badges}>
                <div className={settingsStyles.profile.badge}>
                  {t('accountCount', { count: accountCount })}
                </div>
                <div className={settingsStyles.profile.badge}>
                  {t('transactionCount', { count: transactionCount })}
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className={settingsStyles.profile.editButton}
            onClick={onEditProfile}
          >
            {t('editButton')}
          </Button>
        </div>

        {/* Profile Details */}
        <ListContainer divided className={`${settingsStyles.profileDetails.container} space-y-0`}>
          <SettingsItem
            icon={<Mail className="h-4 w-4 text-primary" />}
            label={t('emailLabel')}
            value={currentUser.email}
          />

          <SettingsItem
            icon={<Phone className="h-4 w-4 text-primary" />}
            label={t('phoneLabel')}
            value={t('phoneNotSpecified')}
          />

          <SettingsItem
            icon={<UserIcon className="h-4 w-4 text-primary" />}
            label={t('roleLabel')}
            value={getRoleLabel(currentUser.role || '')}
          />
        </ListContainer>
      </PageSection>
    </PageSection>
  );
}
