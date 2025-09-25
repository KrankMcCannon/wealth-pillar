'use client';

import { User } from '@/lib/types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from './useAuth';
// Removed useUserManagementPermissions - using simple role-based logic
import { userService } from '@/lib/api-client';

// Manteniamo localStorage solo per le preferenze UI (non per sicurezza)
const UI_PREFERENCES_KEY = 'ui_preferences';

interface UIPreferences {
  selectedViewUserId: string; // ID dell'utente di cui visualizzare i dati (solo per admin)
  lastViewedUserId?: string; // Solo per UX, non per sicurezza
}

export const useUserSelection = () => {
  const { user: authUser, isAuthenticated, isLoading: authLoading } = useAuth();

  // Stato locale - separato tra autenticazione e visualizzazione
  const [selectedViewUserId, setSelectedViewUserId] = useState<string>('all');
  const [uiPreferences, setUiPreferences] = useState<UIPreferences>({ selectedViewUserId: 'all' });

  // Query utenti basata sui ruoli - semplificata
  const { data: allUsers = [], isLoading: usersLoading } = useQuery({
    queryKey: ['users', authUser?.id, authUser?.role],
    queryFn: async () => {
      if (!isAuthenticated || !authUser) return [];

      // Superadmin può vedere tutti
      if (authUser.role === 'superadmin') {
        return await userService.getAll();
      }

      // Admin può vedere il gruppo
      if (authUser.role === 'admin') {
        const allUsers = await userService.getAll();
        return allUsers.filter(user =>
          user.group_id === authUser.group_id || user.id === authUser.id
        );
      }

      // Member vede solo se stesso
      return [authUser].filter(Boolean) as User[];
    },
    enabled: isAuthenticated && !!authUser,
    staleTime: 5 * 60 * 1000,
  });

  // Utente attualmente selezionato (sempre l'utente autenticato per sicurezza)
  const currentUser = useMemo(() => {
    if (!authUser || !allUsers.length) return null;

    // Trova l'utente autenticato nella lista
    const authenticatedUser = allUsers.find(user =>
      user.clerk_id === authUser.clerk_id || user.id === authUser.id
    );

    return authenticatedUser || null;
  }, [authUser, allUsers]);

  // Utenti visualizzabili dall'admin - i member non hanno questa funzionalità
  const viewableUsers = useMemo((): User[] => {
    if (!allUsers.length) return [];

    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

    // Solo admin/superadmin possono visualizzare dati di altri utenti
    if (!isAdmin) {
      return []; // I member non vedono altri utenti
    }

    return allUsers; // Admin vedono tutti gli utenti del gruppo
  }, [allUsers, currentUser]);

  // L'utente di cui visualizzare i dati (solo per admin)
  const viewingUser = useMemo((): User | null => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';

    // I member visualizzano sempre i propri dati
    if (!isAdmin) {
      return currentUser;
    }

    // Se è selezionato "all", l'admin non sta visualizzando un utente specifico
    if (selectedViewUserId === 'all') {
      return null; // Vista aggregata
    }

    // Trova l'utente specifico che l'admin vuole visualizzare
    return allUsers.find(user => user.id === selectedViewUserId) || null;
  }, [selectedViewUserId, allUsers, currentUser]);

  // Carica preferenze UI da localStorage
  useEffect(() => {
    const savedPreferences = localStorage.getItem(UI_PREFERENCES_KEY);
    if (savedPreferences) {
      try {
        const prefs = JSON.parse(savedPreferences) as UIPreferences;
        setUiPreferences(prefs);
        setSelectedViewUserId(prefs.selectedViewUserId || 'all');
      } catch (error) {
        console.warn('Errore caricamento preferenze UI:', error);
      }
    }
  }, []);

  // Salva preferenze UI
  const saveUIPreferences = useCallback((prefs: Partial<UIPreferences>) => {
    const newPrefs = { ...uiPreferences, ...prefs };
    setUiPreferences(newPrefs);
    localStorage.setItem(UI_PREFERENCES_KEY, JSON.stringify(newPrefs));
  }, [uiPreferences]);

  // Aggiorna visualizzazione utente (solo per admin/superadmin)
  const updateViewUserId = useCallback((userId: string) => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    if (isAdmin) {
      setSelectedViewUserId(userId);
      saveUIPreferences({ selectedViewUserId: userId });
    }
  }, [saveUIPreferences, currentUser]);

  // Ottieni ID dell'utente da visualizzare
  const getViewingUserId = useCallback(() => {
    return viewingUser?.id || null;
  }, [viewingUser]);

  // ID utente effettivo per le query (sempre l'utente autenticato)
  const getEffectiveUserId = useCallback(() => {
    return currentUser?.id || '';
  }, [currentUser]);

  // Ottieni lista gruppi disponibili (solo per admin/superadmin)
  const availableGroups = useMemo(() => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    if (!isAdmin) return [];

    const groups = allUsers.reduce((acc, user) => {
      if (user.group_id && !acc.find(g => g.id === user.group_id)) {
        acc.push({
          id: user.group_id,
          name: `Gruppo ${user.group_id.slice(-6)}`, // Nome semplificato
        });
      }
      return acc;
    }, [] as Array<{ id: string; name: string }>);

    return groups;
  }, [allUsers, currentUser]);

  // Funzioni di utilità per controlli di permesso - semplificato
  const canViewUser = useCallback((userId: string) => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    if (!isAdmin) return false;
    return viewableUsers.some(user => user.id === userId);
  }, [currentUser, viewableUsers]);

  // Statistiche utente
  const userStats = useMemo(() => {
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
    return {
      totalUsers: allUsers.length,
      viewableUsers: viewableUsers.length,
      hasMultipleUsers: viewableUsers.length > 1,
      canSwitchUsers: isAdmin && viewableUsers.length > 1,
    };
  }, [allUsers.length, viewableUsers.length, currentUser]);

  // Pulizia al logout
  const clearSelection = useCallback(() => {
    setSelectedViewUserId('all');
    setUiPreferences({ selectedViewUserId: 'all' });
    localStorage.removeItem(UI_PREFERENCES_KEY);
  }, []);

  // Stato di caricamento combinato
  const isLoading = authLoading || usersLoading;

  // Controlli di autorizzazione
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'superadmin';
  const isSuperAdmin = currentUser?.role === 'superadmin';

  return {
    // Utente autenticato (l'identità reale)
    currentUser,

    // Utente di cui visualizzare i dati (solo per admin)
    viewingUser,

    // Liste utenti
    users: allUsers, // Tutti gli utenti accessibili
    viewableUsers, // Utenti di cui l'admin può visualizzare i dati

    // Filtri di visualizzazione (solo per admin)
    selectedViewUserId,
    availableGroups,

    // Stato
    isLoading,
    isAuthenticated,
    authUser,

    // Statistiche
    userStats,

    // Controlli ruoli
    isAdmin,
    isSuperAdmin,
    canViewUser,

    // Azioni
    updateViewUserId,
    clearSelection,

    // Utilità
    getEffectiveUserId, // Sempre l'utente autenticato
    getViewingUserId,   // L'utente di cui stiamo visualizzando i dati

    // UI Preferences (non critiche per sicurezza)
    uiPreferences,
  };
};

export default useUserSelection;
