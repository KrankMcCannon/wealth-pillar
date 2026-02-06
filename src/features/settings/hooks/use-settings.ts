'use client';

import { useState, useOptimistic, startTransition } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { updateUserPreferencesAction, deleteUserAction } from '../actions';
import type { UserPreferences } from '@/server/services';
import type { User, UserPreferencesUpdate } from '@/lib/types';

export function useSettings(
  currentUser: User,
  initialPreferences: UserPreferences,
  groupUsers: User[]
) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  // Optimistic Preferences
  const [preferences, setOptimisticPreferences] = useOptimistic(
    initialPreferences,
    (state: UserPreferences, newPreferences: Partial<UserPreferences>) => ({
      ...state,
      ...newPreferences,
    })
  );

  const [isLoadingPreferences] = useState(false); // Can be removed or used for transition state

  // Modal States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showTimezoneModal, setShowTimezoneModal] = useState(false);
  const [showInviteMemberModal, setShowInviteMemberModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Derived state
  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : clerkUser?.firstName?.charAt(0) || 'U';

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  // Handlers
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccountClick = () => {
    setShowDeleteModal(true);
    setDeleteError(null);
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteError(null);
  };

  const handleDeleteAccountConfirm = async () => {
    if (!currentUser?.id || !clerkUser?.id) return;

    setIsDeletingAccount(true);
    setDeleteError(null);

    try {
      const result = await deleteUserAction(currentUser.id, clerkUser.id);

      if (result.error) {
        setDeleteError(result.error);
        setIsDeletingAccount(false);
        return;
      }

      await signOut();
      router.push('/');
    } catch (error: unknown) {
      setDeleteError((error as Error).message || 'Si è verificato un errore imprevisto.');
      setIsDeletingAccount(false);
    }
  };

  const handleNotificationToggle = async (key: keyof UserPreferences) => {
    if (!preferences || !currentUser?.id) return;

    const currentValue = preferences[key];
    if (typeof currentValue !== 'boolean') return;

    const newValue = !currentValue;

    startTransition(() => {
      setOptimisticPreferences({ [key]: newValue } as Partial<UserPreferences>);
    });

    try {
      const { error } = await updateUserPreferencesAction(currentUser.id, {
        [key]: newValue,
      });

      if (error) {
        toast({
          title: 'Errore',
          description: 'Impossibile aggiornare le notifiche',
          variant: 'destructive',
        });
      }
    } catch {
      toast({
        title: 'Errore',
        description: 'Si è verificato un errore',
        variant: 'destructive',
      });
    }
  };

  const handlePreferenceUpdate = <K extends keyof UserPreferencesUpdate>(
    key: K,
    value: UserPreferencesUpdate[K]
  ) => {
    if (!preferences) return;

    startTransition(() => {
      setOptimisticPreferences({ [key]: value } as Partial<UserPreferences>);
    });

    if (key === 'currency') setShowCurrencyModal(false);
    if (key === 'language') setShowLanguageModal(false);
    if (key === 'timezone') setShowTimezoneModal(false);
  };

  return {
    // Return props directly or optimistic values
    currentUser,
    groupUsers,
    isAdmin,
    preferences, // This is now optimistic
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
    setShowDeleteModal,

    // Handlers
    handleSignOut,
    handleDeleteAccountClick,
    handleDeleteAccountConfirm,
    handleCloseDeleteModal,
    handleNotificationToggle,
    handlePreferenceUpdate,
  };
}
