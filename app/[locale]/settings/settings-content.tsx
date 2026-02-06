'use client';

import { useLocale, useTranslations } from 'next-intl';
import { BottomNavigation, PageContainer, Header } from '@/components/layout';
import { useRouter } from '@/i18n/routing';
import {
  DeleteAccountModal,
  EditProfileModal,
  PreferenceSelectModal,
  usePreferenceOptions,
  InviteMemberModal,
  SubscriptionModal,
  useSettings,
  settingsStyles,
  ProfileSection,
  GroupSection,
  PreferencesSection,
  NotificationsSection,
  SecuritySection,
  AccountSection,
} from '@/features/settings';
import { getLanguagePreferenceForLocale } from '@/features/settings/utils/language-preference';
import type { User, UserPreferences } from '@/lib/types';

/**
 * Settings Content Props
 */
interface SettingsContentProps {
  accountCount: number;
  transactionCount: number;
  currentUser: User;
  preferences: UserPreferences;
  groupUsers: User[];
}

export default function SettingsContent({
  accountCount,
  transactionCount,
  currentUser,
  preferences: initialPreferences,
  groupUsers,
}: SettingsContentProps) {
  const t = useTranslations('SettingsContent');
  const locale = useLocale();
  const { currencyOptions, languageOptions, timezoneOptions } = usePreferenceOptions();

  const {
    // Optimistic state
    preferences,

    // Derived state
    isAdmin,
    userInitials,
    isLoadingPreferences,
    isSigningOut,
    isDeletingAccount,
    deleteError,

    // Modal controls
    showEditProfileModal,
    setShowEditProfileModal,
    showCurrencyModal,
    setShowCurrencyModal,
    showLanguageModal,
    setShowLanguageModal,
    showTimezoneModal,
    setShowTimezoneModal,
    showInviteMemberModal,
    setShowInviteMemberModal,
    showSubscriptionModal,
    setShowSubscriptionModal,
    showDeleteModal,

    // Handlers
    handleSignOut,
    handleDeleteAccountClick,
    handleDeleteAccountConfirm,
    handleCloseDeleteModal,
    handleNotificationToggle,
    handlePreferenceUpdate,
  } = useSettings(currentUser, initialPreferences, groupUsers);

  const router = useRouter();
  const currentLanguageValue = getLanguagePreferenceForLocale(locale, preferences?.language);

  if (!currentUser) return null; // Should not happen given page.tsx protection, but handles type safety

  return (
    <PageContainer className={settingsStyles.page.container}>
      <div>
        {/* Header */}
        <Header
          title={t('headerTitle')}
          showBack={true}
          onBack={() => router.push('/home')}
          currentUser={{
            name: currentUser.name,
            role:
              currentUser.role === 'superadmin' || currentUser.role === 'admin'
                ? 'admin'
                : ((currentUser.role || 'member') as 'admin' | 'member'),
          }}
          showActions={true}
        />

        <main className={settingsStyles.main.container}>
          <ProfileSection
            currentUser={currentUser}
            accountCount={accountCount}
            transactionCount={transactionCount}
            userInitials={userInitials}
            onEditProfile={() => setShowEditProfileModal(true)}
          />

          <GroupSection
            groupUsers={groupUsers}
            isAdmin={isAdmin}
            onInviteMember={() => setShowInviteMemberModal(true)}
            onManageSubscription={() => setShowSubscriptionModal(true)}
          />

          <PreferencesSection
            preferences={preferences}
            isLoadingPreferences={isLoadingPreferences}
            onOpenCurrency={() => setShowCurrencyModal(true)}
            onOpenLanguage={() => setShowLanguageModal(true)}
            onOpenTimezone={() => setShowTimezoneModal(true)}
          />

          <NotificationsSection
            preferences={preferences}
            isLoadingPreferences={isLoadingPreferences}
            onToggle={handleNotificationToggle}
          />

          <SecuritySection
            isSigningOut={isSigningOut}
            onSignOut={handleSignOut}
            onNavigateTo2FA={() => {
              /* TODO: Navigate to 2FA settings */
            }}
          />

          <AccountSection onDeleteAccount={handleDeleteAccountClick} />
        </main>
      </div>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        isDeleting={isDeletingAccount}
        error={deleteError}
        onClose={handleCloseDeleteModal}
        onConfirm={handleDeleteAccountConfirm}
      />

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditProfileModal}
        onOpenChange={setShowEditProfileModal}
        userId={currentUser.id}
        currentName={currentUser.name}
        currentEmail={currentUser.email}
      />

      {/* Currency Selection Modal */}
      {preferences && (
        <PreferenceSelectModal
          isOpen={showCurrencyModal}
          onOpenChange={setShowCurrencyModal}
          userId={currentUser.id}
          title={t('currencyModalTitle')}
          description={t('currencyModalDescription')}
          currentValue={preferences.currency}
          options={currencyOptions}
          preferenceKey="currency"
          onSuccess={(value) => handlePreferenceUpdate('currency', value)}
        />
      )}

      {/* Language Selection Modal */}
      {preferences && (
        <PreferenceSelectModal
          isOpen={showLanguageModal}
          onOpenChange={setShowLanguageModal}
          userId={currentUser.id}
          title={t('languageModalTitle')}
          description={t('languageModalDescription')}
          currentValue={currentLanguageValue}
          options={languageOptions}
          preferenceKey="language"
          onSuccess={(value) => handlePreferenceUpdate('language', value)}
        />
      )}

      {/* Timezone Selection Modal */}
      {preferences && (
        <PreferenceSelectModal
          isOpen={showTimezoneModal}
          onOpenChange={setShowTimezoneModal}
          userId={currentUser.id}
          title={t('timezoneModalTitle')}
          description={t('timezoneModalDescription')}
          currentValue={preferences.timezone}
          options={timezoneOptions}
          preferenceKey="timezone"
          onSuccess={(value) => handlePreferenceUpdate('timezone', value)}
        />
      )}

      {/* Invite Member Modal */}
      {isAdmin && (
        <InviteMemberModal
          isOpen={showInviteMemberModal}
          onOpenChange={setShowInviteMemberModal}
          groupId={currentUser.group_id || ''}
          currentUserId={currentUser.id}
        />
      )}

      {/* Subscription Modal */}
      {isAdmin && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          groupId={currentUser.group_id || ''}
          currentPlan="free"
        />
      )}
    </PageContainer>
  );
}
