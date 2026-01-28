"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import {
  getUserPreferencesAction,
  updateUserPreferencesAction,
  deleteUserAction,
  getGroupUsersAction,
} from "../actions";
import type { UserPreferences } from "@/server/services";
import type { User, UserPreferencesUpdate } from "@/lib/types";

export function useSettings(initialUser: User | null = null) {
  const router = useRouter();
  const { toast } = useToast();
  const { user: clerkUser } = useUser();
  const { signOut } = useClerk();

  // State
  const [currentUser, setCurrentUser] = useState<User | null>(initialUser);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [isLoadingPreferences, setIsLoadingPreferences] = useState(true);
  const [groupUsers, setGroupUsers] = useState<User[]>([]);

  useEffect(() => {
    async function fetchGroupUsers() {
      if (!currentUser?.group_id) return;

      try {
        const users = await getGroupUsersAction(currentUser.group_id);
        if (users) {
          setGroupUsers(users);
        }
      } catch (error) {
        console.error("Error fetching group users:", error);
      }
    }

    if (currentUser?.group_id) {
      fetchGroupUsers();
    }
  }, [currentUser?.group_id]);

  // Update currentUser if initialUser changes
  useEffect(() => {
    if (initialUser) {
      setCurrentUser(initialUser);
    }
  }, [initialUser]);

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
    ? currentUser.name.split(" ").map((n: string) => n[0]).join("").toUpperCase()
    : (clerkUser?.firstName?.charAt(0) || "U");

  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";

  // Fetch Preferences
  useEffect(() => {
    async function fetchPreferences() {
      if (!currentUser?.id) {
        setIsLoadingPreferences(false);
        return;
      }

      try {
        const { data, error } = await getUserPreferencesAction(currentUser.id);
        if (data) {
          setPreferences(data);
        } else if (error) {
          console.error("Failed to load preferences:", error);
        }
      } catch (err) {
        console.error("Error fetching preferences:", err);
      } finally {
        setIsLoadingPreferences(false);
      }
    }

    fetchPreferences();
  }, [currentUser?.id]);

  // Handlers
  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
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
      router.push("/");
    } catch (error: unknown) {
      setDeleteError((error as Error).message || "Si è verificato un errore imprevisto.");
      setIsDeletingAccount(false);
    }
  };

  const handleNotificationToggle = async (key: keyof UserPreferences) => {
    if (!preferences || !currentUser?.id) return;

    // We expect keys like 'notifications_push', 'notifications_email', etc.
    const currentValue = preferences[key];

    // Ensure we are toggling a boolean
    if (typeof currentValue !== 'boolean') return;

    const newValue = !currentValue;

    // Optimistic update
    setPreferences({
      ...preferences,
      [key]: newValue,
    });

    try {
      const { error } = await updateUserPreferencesAction(currentUser.id, {
        [key]: newValue,
      });

      if (error) {
        // Revert on error
        setPreferences({
          ...preferences,
          [key]: currentValue,
        });
        toast({
          title: "Errore",
          description: "Impossibile aggiornare le notifiche",
          variant: "destructive",
        });
      }
    } catch {
      // Revert on error
      setPreferences({
        ...preferences,
        [key]: currentValue,
      });
      toast({
        title: "Errore",
        description: "Si è verificato un errore",
        variant: "destructive",
      });
    }
  };

  const handlePreferenceUpdate = async <K extends keyof UserPreferencesUpdate>(
    key: K,
    value: UserPreferencesUpdate[K]
  ) => {
    if (!currentUser?.id || !preferences) return;

    // Optimistic update
    setPreferences({
      ...preferences,
      [key]: value,
    });

    try {
      const { error } = await updateUserPreferencesAction(currentUser.id, {
        [key]: value
      });

      if (error) {
        toast({
          title: "Errore",
          description: error,
          variant: "destructive",
        });
        // We might want to refresh preferences here to revert
      } else {
        toast({
          title: "Successo",
          description: "Preferenze aggiornate",
          variant: "success",
        });

        // Close modals
        if (key === 'currency') setShowCurrencyModal(false);
        if (key === 'language') setShowLanguageModal(false);
        if (key === 'timezone') setShowTimezoneModal(false);
      }
    } catch {
      toast({
        title: "Errore",
        description: "Si è verificato un errore",
        variant: "destructive",
      });
    }
  };

  return {
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
    showEditProfileModal, setShowEditProfileModal,
    showCurrencyModal, setShowCurrencyModal,
    showLanguageModal, setShowLanguageModal,
    showTimezoneModal, setShowTimezoneModal,
    showInviteMemberModal, setShowInviteMemberModal,
    showSubscriptionModal, setShowSubscriptionModal,
    showDeleteModal, setShowDeleteModal,

    // Handlers
    handleSignOut,
    handleDeleteAccountClick,
    handleDeleteAccountConfirm,
    handleCloseDeleteModal,
    handleNotificationToggle,
    handlePreferenceUpdate,
  };
}
