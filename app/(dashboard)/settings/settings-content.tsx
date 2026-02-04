'use client';

import { useRouter } from 'next/navigation';
import { BottomNavigation, PageContainer, Header } from '@/components/layout';
import {
  DeleteAccountModal,
  EditProfileModal,
  PreferenceSelectModal,
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
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
import type { User } from '@/lib/types';

/**
 * Settings Content Props
 */
interface SettingsContentProps {
  accountCount: number;
  transactionCount: number;
  currentUser: User;
}

export default function SettingsContent({
  accountCount,
  transactionCount,
  currentUser: initialUser,
}: SettingsContentProps) {
  const {
    currentUser,
    groupUsers,
    isAdmin,
    preferences,
    isLoadingPreferences,
    isSigningOut,
    isDeletingAccount,
    deleteError,
    userInitials,

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
  } = useSettings(initialUser);

  const router = useRouter();

  if (!currentUser) return null; // Should not happen given page.tsx protection, but handles type safety

  return (
    <PageContainer className={settingsStyles.page.container}>
      <div>
        {/* Header */}
        <Header
          title="Impostazioni"
          showBack={true}
          onBack={() => router.push('/dashboard')}
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
          title="Seleziona Valuta"
          description="Scegli la valuta predefinita per le tue transazioni"
          currentValue={preferences.currency}
          options={CURRENCY_OPTIONS}
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
          title="Seleziona Lingua"
          description="Scegli la lingua dell'interfaccia"
          currentValue={preferences.language}
          options={LANGUAGE_OPTIONS}
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
          title="Seleziona Fuso Orario"
          description="Scegli il fuso orario per le date e gli orari"
          currentValue={preferences.timezone}
          options={TIMEZONE_OPTIONS}
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
