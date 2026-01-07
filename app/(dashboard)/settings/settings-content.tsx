"use client";

import { SectionHeader, BottomNavigation, PageContainer, Header } from "@/src/components/layout";
import { settingsStyles } from "@/src/features/settings/theme";
import {
  deleteUserAction,
  DeleteAccountModal,
  EditProfileModal,
  PreferenceSelectModal,
  CURRENCY_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  InviteMemberModal,
  SubscriptionModal,
} from "@/src/features/settings";
import {
  getUserPreferencesAction,
  updateUserPreferencesAction
} from "@/src/features/settings/actions";
import { usePermissions, useRequiredCurrentUser, useRequiredGroupUsers } from "@/hooks";
import {
  Bell,
  ChevronRight,
  CreditCard,
  Globe,
  Loader2,
  LogOut,
  Mail,
  Phone,
  Plus,
  Settings,
  Shield,
  Trash2,
  User,
  Users,
} from "lucide-react";
import { RoleBadge } from "@/features/permissions";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Button, Card } from "@/components/ui";
import { useToast } from "@/src/components/ui/toast";
import type { Account, Transaction } from "@/lib/types";
import type { UserPreferences } from "@/lib/services/user-preferences.service";

/**
 * Settings Content Props
 */
interface SettingsContentProps {
  accounts: Account[];
  transactions: Transaction[];
}

export default function SettingsContent({ accounts, transactions }: SettingsContentProps) {
  // Read from stores instead of props
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();

  const router = useRouter();
  const { signOut } = useClerk();
  const { showToast } = useToast();

  // Modal visibility state
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // User preferences state
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);

  // Other state
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Permission checks
  const { isAdmin } = usePermissions({ currentUser });

  // Load user preferences on mount
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        const { data, error } = await getUserPreferencesAction(currentUser.id);

        if (error || !data) {
          console.error('Error loading preferences:', error);
          showToast({
            type: 'error',
            title: 'Errore',
            description: 'Impossibile caricare le preferenze',
          });
          setIsLoadingPreferences(false);
          return;
        }

        setPreferences(data);
        setIsLoadingPreferences(false);
      } catch (error) {
        console.error('Error loading preferences:', error);
        setIsLoadingPreferences(false);
      }
    };

    loadPreferences();
  }, [currentUser.id, showToast]);

  const handleSignOut = useCallback(async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
      setIsSigningOut(false);
    }
  }, [signOut, router]);

  const handleDeleteAccountClick = useCallback(() => {
    // Verify clerk_id exists
    if (!currentUser.clerk_id) {
      setDeleteError("Impossibile eliminare l'account: ID Clerk mancante.");
      setShowDeleteModal(true);
      return;
    }

    setDeleteError(null);
    setShowDeleteModal(true);
  }, [currentUser.clerk_id]);

  const handleDeleteAccountConfirm = useCallback(async () => {
    if (!currentUser.clerk_id) {
      setDeleteError("Impossibile eliminare l'account: ID Clerk mancante.");
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const { error } = await deleteUserAction(currentUser.id, currentUser.clerk_id);

      if (error) {
        setDeleteError(error);
        setIsDeletingAccount(false);
        return;
      }

      // Sign out and redirect to sign-in page
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error deleting account:", error);
      setDeleteError("Si è verificato un errore durante l'eliminazione dell'account.");
      setIsDeletingAccount(false);
    }
  }, [currentUser.id, currentUser.clerk_id, signOut, router]);

  const handleCloseDeleteModal = useCallback(() => {
    if (isDeletingAccount) return; // Don't close while deleting
    setShowDeleteModal(false);
    setDeleteError(null);
  }, [isDeletingAccount]);

  // Handle notification toggle
  const handleNotificationToggle = useCallback(async (
    key: 'notifications_push' | 'notifications_email' | 'notifications_budget_alerts',
    currentValue: boolean
  ) => {
    // Optimistic update using functional update to avoid stale state
    setPreferences(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: !currentValue,
      };
    });

    try {
      const { error } = await updateUserPreferencesAction(currentUser.id, {
        [key]: !currentValue,
      });

      if (error) {
        // Revert on error using functional update
        setPreferences(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            [key]: currentValue,
          };
        });
        showToast({
          type: 'error',
          title: 'Errore',
          description: error,
        });
        return;
      }

      showToast({
        type: 'success',
        title: 'Preferenza aggiornata',
        description: 'Le notifiche sono state aggiornate',
      });
    } catch (error) {
      // Revert on error using functional update
      setPreferences(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [key]: currentValue,
        };
      });
      console.error('Error updating notification:', error);
      showToast({
        type: 'error',
        title: 'Errore',
        description: 'Si è verificato un errore durante l\'aggiornamento',
      });
    }
  }, [currentUser.id, showToast]);

  // Handle preference updates (callback for modal success)
  const handlePreferenceUpdate = useCallback((key: keyof UserPreferences, value: string) => {
    setPreferences(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [key]: value,
      };
    });
  }, []);

  // Get user initials for avatar (memoized)
  const userInitials = useMemo(() =>
    currentUser.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase(),
    [currentUser.name]
  );

  // Get actual counts (memoized)
  const accountCount = useMemo(() => accounts.length, [accounts.length]);
  const transactionCount = useMemo(() => transactions.length, [transactions.length]);

  return (
    <PageContainer>
      <div>
        {/* Header */}
        <Header
          title="Impostazioni"
          showBack={true}
          onBack={() => router.push("/dashboard")}
          currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
          showActions={true}
        />

        <main className={settingsStyles.main.container}>
          {/* Profile Section */}
          <section>
            <SectionHeader title="Profilo" icon={User} iconClassName="text-primary" className="mb-4" />

            <Card className={settingsStyles.card.container}>
              {/* User Info Header */}
              <div className={settingsStyles.profile.header}>
                <div className={settingsStyles.profile.container}>
                  <div className={settingsStyles.profile.avatar} style={{ backgroundColor: currentUser.theme_color }}>
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
                  onClick={() => setShowEditProfileModal(true)}
                >
                  Modifica
                </Button>
              </div>

              {/* Profile Details */}
              <div className={settingsStyles.profileDetails.container}>
                <div className={settingsStyles.profileDetails.item}>
                  <div className={settingsStyles.profileDetails.iconContainer}>
                    <Mail className={settingsStyles.profileDetails.icon} />
                  </div>
                  <div className={settingsStyles.profileDetails.content}>
                    <span className={settingsStyles.profileDetails.label}>Email</span>
                    <p className={settingsStyles.profileDetails.value}>{currentUser.email}</p>
                  </div>
                </div>

                <div className={settingsStyles.profileDetails.item}>
                  <div className={settingsStyles.profileDetails.iconContainer}>
                    <Phone className={settingsStyles.profileDetails.icon} />
                  </div>
                  <div className={settingsStyles.profileDetails.content}>
                    <span className={settingsStyles.profileDetails.label}>Telefono</span>
                    <p className={settingsStyles.profileDetails.value}>Non specificato</p>
                  </div>
                </div>

                <div className={settingsStyles.profileDetails.item}>
                  <div className={settingsStyles.profileDetails.iconContainer}>
                    <User className={settingsStyles.profileDetails.icon} />
                  </div>
                  <div className={settingsStyles.profileDetails.content}>
                    <span className={settingsStyles.profileDetails.label}>Ruolo</span>
                    <p className={settingsStyles.profileDetails.value + ' capitalize'}>{currentUser.role}</p>
                  </div>
                </div>
              </div>
            </Card>
          </section>

          {/* Group Management Section - Only visible to admins */}
          {isAdmin && (
            <section>
              <SectionHeader title="Gestione Gruppo" icon={Users} iconClassName="text-primary" />

              {/* Group Members List */}
              <Card className={settingsStyles.card.container + " pb-0 mb-4"}>
                <div className={settingsStyles.groupManagement.header}>
                  <h3 className={settingsStyles.groupManagement.title}>Membri del Gruppo</h3>
                  <p className={settingsStyles.groupManagement.subtitle}>
                    {groupUsers.length} {groupUsers.length === 1 ? "membro visibile" : "membri visibili"}
                  </p>
                </div>
                <div className={settingsStyles.groupManagement.list}>
                  {groupUsers.map((member) => {
                    const memberInitials = member.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase();

                    return (
                      <div key={member.id} className={settingsStyles.groupManagement.item}>
                        <div className={settingsStyles.groupManagement.memberLeft}>
                          <div
                            className={settingsStyles.groupManagement.memberAvatar}
                            style={{ backgroundColor: member.theme_color }}
                          >
                            {memberInitials}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className={settingsStyles.groupManagement.memberName}>{member.name}</h4>
                            <p className={settingsStyles.groupManagement.memberEmail}>{member.email}</p>
                          </div>
                        </div>
                        <div className={settingsStyles.groupManagement.memberRight}>
                          <RoleBadge role={member.role} size="sm" variant="subtle" />
                          <p className={settingsStyles.groupManagement.memberDate}>
                            {new Date(member.created_at).toLocaleDateString("it-IT")}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              {/* Group Actions */}
              <Card className={settingsStyles.card.container}>
                <button
                  className={settingsStyles.actionButton.container}
                  onClick={() => setShowInviteMemberModal(true)}
                >
                  <div className={settingsStyles.actionButton.content}>
                    <div className={settingsStyles.actionButton.iconContainer}>
                      <Plus className={settingsStyles.actionButton.icon} />
                    </div>
                    <div className="flex-1 min-w-0 ml-3">
                      <span className={settingsStyles.actionButton.title}>Invita Membro</span>
                      <p className={settingsStyles.actionButton.subtitle}>Invia invito per unirsi al gruppo</p>
                    </div>
                  </div>
                  <ChevronRight className={settingsStyles.actionButton.chevron} />
                </button>

                <div className={settingsStyles.card.dividerLine}></div>

                <button
                  className={settingsStyles.actionButton.container}
                  onClick={() => setShowSubscriptionModal(true)}
                >
                  <div className={settingsStyles.actionButton.content}>
                    <div className={settingsStyles.actionButton.iconContainer}>
                      <CreditCard className={settingsStyles.actionButton.icon} />
                    </div>
                    <div className="flex-1 min-w-0 ml-3">
                      <span className={settingsStyles.actionButton.title}>Impostazioni Abbonamento</span>
                      <p className={settingsStyles.actionButton.subtitle}>Gestisci fatturazione e abbonamento gruppo</p>
                    </div>
                  </div>
                  <ChevronRight className={settingsStyles.actionButton.chevron} />
                </button>
              </Card>
            </section>
          )}

          {/* Preferences */}
          <section>
            <SectionHeader title="Preferenze" icon={Settings} iconClassName="text-primary" className="mb-4" />
            <Card className={settingsStyles.card.container}>
              <div className={settingsStyles.preference.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <CreditCard className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Valuta</span>
                    <p className={settingsStyles.preference.value}>
                      {preferences?.currency ?
                        CURRENCY_OPTIONS.find(opt => opt.value === preferences.currency)?.label || preferences.currency
                        : 'EUR - Euro'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={settingsStyles.preference.button}
                  onClick={() => setShowCurrencyModal(true)}
                  disabled={isLoadingPreferences}
                >
                  Cambia
                </Button>
              </div>

              <div className={settingsStyles.preference.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <Globe className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Lingua</span>
                    <p className={settingsStyles.preference.value}>
                      {preferences?.language ?
                        LANGUAGE_OPTIONS.find(opt => opt.value === preferences.language)?.label || preferences.language
                        : 'Italiano'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={settingsStyles.preference.button}
                  onClick={() => setShowLanguageModal(true)}
                  disabled={isLoadingPreferences}
                >
                  Cambia
                </Button>
              </div>

              <div className={settingsStyles.preference.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <Globe className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Fuso Orario</span>
                    <p className={settingsStyles.preference.value}>
                      {preferences?.timezone ?
                        TIMEZONE_OPTIONS.find(opt => opt.value === preferences.timezone)?.label || preferences.timezone
                        : 'Roma (GMT+1)'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className={settingsStyles.preference.button}
                  onClick={() => setShowTimezoneModal(true)}
                  disabled={isLoadingPreferences}
                >
                  Cambia
                </Button>
              </div>
            </Card>
          </section>

          {/* Notifications */}
          <section>
            <SectionHeader title="Notifiche" icon={Bell} iconClassName="text-primary" className="mb-4" />
            <Card className={settingsStyles.card.container}>
              <div className={settingsStyles.notification.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <Bell className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Notifiche Push</span>
                    <p className={settingsStyles.preference.value}>Ricevi notifiche sulle transazioni</p>
                  </div>
                </div>
                <label className={settingsStyles.notification.toggle.wrapper}>
                  <input
                    type="checkbox"
                    className={settingsStyles.notification.toggle.input}
                    checked={preferences?.notifications_push ?? true}
                    onChange={() => handleNotificationToggle('notifications_push', preferences?.notifications_push ?? true)}
                    disabled={isLoadingPreferences}
                  />
                  <span className="sr-only">Attiva notifiche push</span>
                  <div className={settingsStyles.notification.toggle.track}></div>
                  <div className={settingsStyles.notification.toggle.thumb}></div>
                </label>
              </div>

              <div className={settingsStyles.notification.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <Mail className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Notifiche Email</span>
                    <p className={settingsStyles.preference.value}>Ricevi rapporti settimanali</p>
                  </div>
                </div>
                <label className={settingsStyles.notification.toggle.wrapper}>
                  <input
                    type="checkbox"
                    className={settingsStyles.notification.toggle.input}
                    checked={preferences?.notifications_email ?? false}
                    onChange={() => handleNotificationToggle('notifications_email', preferences?.notifications_email ?? false)}
                    disabled={isLoadingPreferences}
                  />
                  <span className="sr-only">Attiva notifiche email</span>
                  <div className={settingsStyles.notification.toggle.track}></div>
                  <div className={settingsStyles.notification.toggle.thumb}></div>
                </label>
              </div>

              <div className={settingsStyles.notification.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.preference.iconContainer}>
                    <Bell className={settingsStyles.preference.icon} />
                  </div>
                  <div className={settingsStyles.preference.content}>
                    <span className={settingsStyles.preference.label}>Avvisi Budget</span>
                    <p className={settingsStyles.preference.value}>Avvisa quando superi il budget</p>
                  </div>
                </div>
                <label className={settingsStyles.notification.toggle.wrapper}>
                  <input
                    type="checkbox"
                    className={settingsStyles.notification.toggle.input}
                    checked={preferences?.notifications_budget_alerts ?? true}
                    onChange={() => handleNotificationToggle('notifications_budget_alerts', preferences?.notifications_budget_alerts ?? true)}
                    disabled={isLoadingPreferences}
                  />
                  <span className="sr-only">Attiva avvisi budget</span>
                  <div className={settingsStyles.notification.toggle.track}></div>
                  <div className={settingsStyles.notification.toggle.thumb}></div>
                </label>
              </div>
            </Card>
          </section>

          {/* Security */}
          <section>
            <SectionHeader title="Sicurezza" icon={Shield} iconClassName="text-primary" className="mb-4" />
            <Card className={settingsStyles.card.container}>
              <button className={settingsStyles.security.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.security.iconContainer}>
                    <Shield className={settingsStyles.security.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={settingsStyles.security.title}>Autenticazione a Due Fattori</span>
                    <p className={settingsStyles.security.subtitle}>Aggiungi sicurezza extra</p>
                  </div>
                </div>
                <ChevronRight className={settingsStyles.security.chevron} />
              </button>

              <div className={settingsStyles.card.dividerLine}></div>

              <button onClick={handleSignOut} disabled={isSigningOut} className={settingsStyles.security.container}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.security.iconContainer}>
                    {isSigningOut ? (
                      <Loader2 className={`${settingsStyles.security.icon} animate-spin`} />
                    ) : (
                      <LogOut className={settingsStyles.security.icon} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={settingsStyles.security.title}>
                      {isSigningOut ? "Disconnessione in corso..." : "Esci dall'Account"}
                    </span>
                    <p className={settingsStyles.security.subtitle}>
                      {isSigningOut ? "Attendere prego" : "Disconnetti dal tuo account"}
                    </p>
                  </div>
                </div>
                {!isSigningOut && <ChevronRight className={settingsStyles.security.chevron} />}
              </button>
            </Card>
          </section>

          {/* Account Actions */}
          <section>
            <SectionHeader title="Account" icon={User} iconClassName="text-red-600" className="mb-4" />
            <Card className={settingsStyles.accountActions.container}>
              <button onClick={handleDeleteAccountClick} className={settingsStyles.accountActions.button}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={settingsStyles.accountActions.iconContainer}>
                    <Trash2 className={settingsStyles.accountActions.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className={settingsStyles.accountActions.title}>Elimina Account</span>
                    <p className={settingsStyles.accountActions.subtitle}>Elimina permanentemente il tuo account</p>
                  </div>
                </div>
                <ChevronRight className={settingsStyles.accountActions.chevron} />
              </button>
            </Card>
          </section>
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
          groupId={currentUser.group_id}
          currentUserId={currentUser.id}
        />
      )}

      {/* Subscription Modal */}
      {isAdmin && (
        <SubscriptionModal
          isOpen={showSubscriptionModal}
          onOpenChange={setShowSubscriptionModal}
          groupId={currentUser.group_id}
          currentPlan="free"
        />
      )}
    </PageContainer>
  );
}
