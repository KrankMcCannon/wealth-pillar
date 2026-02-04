import { SectionHeader } from '@/components/layout';
import { ListContainer, PageSection, SettingsItem } from '@/components/ui/layout';
import { settingsStyles } from '../../theme/settings-styles';
import { Mail, Phone, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui';
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
  const getRoleLabel = (role: string) => {
    if (role === 'superadmin') return 'Sviluppatore';
    if (role === 'admin') return 'Admin';
    return 'Membro';
  };

  return (
    <PageSection>
      <SectionHeader title="Profilo" icon={UserIcon} iconClassName="text-primary" />

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
                <div className={settingsStyles.profile.badge}>{accountCount} Account</div>
                <div className={settingsStyles.profile.badge}>{transactionCount} Transazioni</div>
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className={settingsStyles.profile.editButton}
            onClick={onEditProfile}
          >
            Modifica
          </Button>
        </div>

        {/* Profile Details */}
        <ListContainer divided className={`${settingsStyles.profileDetails.container} space-y-0`}>
          <SettingsItem
            icon={<Mail className="h-4 w-4 text-primary" />}
            label="Email"
            value={currentUser.email}
          />

          <SettingsItem
            icon={<Phone className="h-4 w-4 text-primary" />}
            label="Telefono"
            value="Non specificato"
          />

          <SettingsItem
            icon={<UserIcon className="h-4 w-4 text-primary" />}
            label="Ruolo"
            value={getRoleLabel(currentUser.role || '')}
          />
        </ListContainer>
      </PageSection>
    </PageSection>
  );
}
