'use client';

import { useTranslations } from 'next-intl';
import { usePageHeader } from '@/hooks/use-page-header';
import { useRouter } from '@/i18n/routing';
import { HomeDashboardMain } from '@/components/layout';
import { stitchSettings } from '@/styles/home-design-foundation';
import {
  useSettings,
  ProfileSection,
  GroupSection,
  CategoriesSection,
  PreferencesSection,
  SupportSection,
  DataSection,
} from '@/features/settings';
import { SettingsModalsProvider } from '@/features/settings/context/settings-modals-context';
import SettingsModalRenderer from '@/features/settings/components/settings-modal-renderer';
import type { User, UserPreferences } from '@/lib/types';

interface SettingsContentProps {
  currentUser: User;
  initialPreferences: UserPreferences;
  initialGroupName?: string;
}

export default function SettingsContent({
  currentUser,
  initialPreferences,
  initialGroupName = '',
}: SettingsContentProps) {
  const t = useTranslations('SettingsContent');

  const {
    displayUser,
    displayGroupName,
    preferences,
    isAdmin,
    userInitials,
    isSigningOut,
    openSettingsModal,
    handleSignOut,
    handlePreferenceUpdate,
    handleProfileUpdate,
    handleGroupUpdate,
  } = useSettings(currentUser, initialPreferences, initialGroupName);

  const router = useRouter();

  usePageHeader({
    title: t('headerTitle'),
    showBack: true,
    onBack: () => router.push('/home'),
  });

  if (!displayUser) return null;

  return (
    <SettingsModalsProvider
      value={{
        currentUser: displayUser,
        preferences: preferences ?? null,
        isAdmin,
        groupName: displayGroupName,
        onPreferenceUpdate: handlePreferenceUpdate,
        onProfileUpdate: handleProfileUpdate,
        onGroupUpdate: handleGroupUpdate,
      }}
    >
      <HomeDashboardMain id="main-settings">
        <div className={stitchSettings.pageMain}>
          <ProfileSection
            currentUser={displayUser}
            userInitials={userInitials}
            onEditProfile={() => openSettingsModal('profile')}
          />

          <GroupSection
            isAdmin={isAdmin}
            groupName={displayGroupName}
            onInviteMember={() => openSettingsModal('invite')}
            onManageGroup={() => openSettingsModal('group')}
          />

          <CategoriesSection onManageCategories={() => openSettingsModal('categories')} />

          <DataSection />

          <PreferencesSection
            preferences={preferences}
            onOpenCurrency={() => openSettingsModal('currency')}
            onOpenLanguage={() => openSettingsModal('language')}
            onOpenTimezone={() => openSettingsModal('timezone')}
          />

          <SupportSection isSigningOut={isSigningOut} onSignOut={handleSignOut} />
        </div>
      </HomeDashboardMain>
      <SettingsModalRenderer />
    </SettingsModalsProvider>
  );
}
