'use client';

import { useState, useOptimistic, startTransition, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import { updateUserPreferencesAction, deleteUserAction } from '../actions';
import type { User, UserPreferences, UserPreferencesUpdate } from '@/lib/types';
import { useRouter } from '@/i18n/routing';
import { useModalState, type SettingsModalKind } from '@/lib/navigation/url-state';

export function useSettings(
  currentUser: User,
  initialPreferences: UserPreferences,
  groupUsers: User[]
) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const { openModal, closeModal } = useModalState();

  const [preferences, setOptimisticPreferences] = useOptimistic(
    initialPreferences,
    (state: UserPreferences, newPreferences: Partial<UserPreferences>) => ({
      ...state,
      ...newPreferences,
    })
  );

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : clerkUser?.firstName?.charAt(0) || 'U';

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

  const openSettingsModal = useCallback(
    (kind: SettingsModalKind) => {
      openModal(`settings:${kind}`);
    },
    [openModal]
  );

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
    setDeleteError(null);
    openSettingsModal('delete-account');
  };

  const handleCloseDeleteModal = () => {
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
  };

  return {
    currentUser,
    groupUsers,
    isAdmin,
    preferences,
    isSigningOut,
    isDeletingAccount,
    deleteError,
    userInitials,
    openSettingsModal,
    closeSettingsModal: closeModal,
    handleSignOut,
    handleDeleteAccountClick,
    handleDeleteAccountConfirm,
    handleCloseDeleteModal,
    handleNotificationToggle,
    handlePreferenceUpdate,
  };
}
