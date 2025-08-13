/**
 * useGroups Hook - Simplified
 * Gestisce la logica di business per i gruppi seguendo i principi SOLID
 * Single Responsibility: Solo gestione state e operazioni gruppi
 * Dependency Inversion: Dipende da GroupsService abstraction
 */

import { useUser } from '@clerk/clerk-react';
import { useCallback, useEffect, useState } from 'react';
import { useClerkSupabaseClient } from '../../../lib/supabase/client';
import type {
    CreateGroupData,
    Group,
    GroupWithMemberCount,
    Person
} from '../../../lib/supabase/services/groups.service';
import { GroupsService } from '../../../lib/supabase/services/groups.service';

interface UseGroupsResult {
  // State
  groups: GroupWithMemberCount[];
  currentGroup: GroupWithMemberCount | null;
  members: Person[];
  isLoading: boolean;
  error: string | null;

  // Actions
  createGroup: (data: CreateGroupData) => Promise<Group | null>;
  updateGroup: (groupId: string, updates: Partial<Group>) => Promise<boolean>;
  deleteGroup: (groupId: string) => Promise<boolean>;
  removeMember: (personId: string) => Promise<boolean>;
  updateMemberRole: (personId: string, role: 'owner' | 'admin' | 'member') => Promise<boolean>;

  // Utilities
  hasActiveGroup: () => Promise<boolean>;
  canManageGroup: () => boolean;
  refresh: () => Promise<void>;
  setCurrentGroup: (group: GroupWithMemberCount | null) => void;
}

export const useGroups = (): UseGroupsResult => {
  const { user } = useUser();
  const supabaseClient = useClerkSupabaseClient();
  const [groups, setGroups] = useState<GroupWithMemberCount[]>([]);
  const [currentGroup, setCurrentGroup] = useState<GroupWithMemberCount | null>(null);
  const [members, setMembers] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lazy initialization del service per performance
  const getGroupsService = useCallback(() => {
    if (!supabaseClient || !user?.id) {
      throw new Error('Supabase client or user not available');
    }
    return new GroupsService(supabaseClient, user.id);
  }, [supabaseClient, user?.id]);

  /**
   * Gestione errori centralizzata seguendo DRY principle
   */
  const handleError = useCallback((error: any, context: string) => {
    console.error(`Error in ${context}:`, error);
    setError(error.message || 'An unexpected error occurred');
    setIsLoading(false);
  }, []);

  /**
   * Reset dello stato degli errori
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Carica tutti i gruppi dell'utente corrente
   * Riutilizza logica di loading state esistente
   */
  const loadGroups = useCallback(async () => {
    if (!user?.id) {
      console.error('User ID not available, skipping groups loading');
      return;
    }

    if (!supabaseClient) {
      console.error('Supabase client not available yet, skipping groups loading');
      return;
    }

    try {
      setIsLoading(true);
      clearError();
      
      const service = getGroupsService();
      let userGroups = await service.getUserGroups();
      
      // Se non ci sono gruppi, prova a inizializzarne uno automaticamente
      if (userGroups.length === 0) {
        const initializedGroup = await service.initializeUserGroup();
        if (initializedGroup) {
          userGroups = [initializedGroup];
        }
      }
      
      setGroups(userGroups);
      
      // Se non c'è un gruppo corrente ma ci sono gruppi, seleziona il primo
      if (!currentGroup && userGroups.length > 0) {
        setCurrentGroup(userGroups[0]);
      }
    } catch (error) {
      // Gestione specifica degli errori di autenticazione
      if (error.message?.includes('not authenticated')) {
        console.error('Authentication error, will retry when session is ready');
        setError(null); // Non mostrare errore all'utente per problemi temporanei di auth
      } else {
        handleError(error, 'loadGroups');
      }
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, supabaseClient, currentGroup, getGroupsService, handleError, clearError]);

  /**
   * Carica i membri del gruppo corrente
   */
  const loadGroupMembers = useCallback(async (groupId: string) => {
    try {
      setIsLoading(true);
      clearError();
      
      const service = getGroupsService();
      const groupMembers = await service.getGroupMembers(groupId);
      
      setMembers(groupMembers);
    } catch (error) {
      handleError(error, 'loadGroupMembers');
    } finally {
      setIsLoading(false);
    }
  }, [getGroupsService, handleError, clearError]);

  /**
   * Crea un nuovo gruppo
   */
  const createGroup = useCallback(async (data: CreateGroupData): Promise<Group | null> => {
    try {
      setIsLoading(true);
      clearError();
      
      const service = getGroupsService();
      const newGroup = await service.createGroup(data);
      
      // Refresh dei gruppi dopo la creazione
      await loadGroups();
      
      return newGroup;
    } catch (error) {
      handleError(error, 'createGroup');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getGroupsService, handleError, clearError, loadGroups]);

  /**
   * Aggiorna un gruppo esistente
   */
  const updateGroup = useCallback(async (groupId: string, updates: Partial<Group>): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError();
      
      const service = getGroupsService();
      await service.updateGroup(groupId, updates);
      
      // Refresh dei gruppi dopo l'aggiornamento
      await loadGroups();
      
      return true;
    } catch (error) {
      handleError(error, 'updateGroup');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [getGroupsService, handleError, clearError, loadGroups]);

  /**
   * Elimina un gruppo
   */
  const deleteGroup = useCallback(async (groupId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError();
      
      const service = getGroupsService();
      await service.deleteGroup(groupId);
      
      // Reset del gruppo corrente se era quello eliminato
      if (currentGroup?.id === groupId) {
        setCurrentGroup(null);
        setMembers([]);
      }
      
      // Refresh dei gruppi dopo l'eliminazione
      await loadGroups();
      
      return true;
    } catch (error) {
      handleError(error, 'deleteGroup');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup?.id, getGroupsService, handleError, clearError, loadGroups]);

  /**
   * Rimuove un membro dal gruppo
   */
  const removeMember = useCallback(async (personId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError();
      
      const service = getGroupsService();
      await service.removeMemberFromGroup(personId);
      
      // Refresh dei membri dopo la rimozione
      if (currentGroup) {
        await loadGroupMembers(currentGroup.id);
      }
      
      return true;
    } catch (error) {
      handleError(error, 'removeMember');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup, getGroupsService, handleError, clearError, loadGroupMembers]);

  /**
   * Aggiorna il ruolo di un membro
   */
  const updateMemberRole = useCallback(async (personId: string, role: 'owner' | 'admin' | 'member'): Promise<boolean> => {
    try {
      setIsLoading(true);
      clearError();
      
      const service = getGroupsService();
      await service.updateMemberRole(personId, role);
      
      // Refresh dei membri dopo l'aggiornamento
      if (currentGroup) {
        await loadGroupMembers(currentGroup.id);
      }
      
      return true;
    } catch (error) {
      handleError(error, 'updateMemberRole');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [currentGroup, getGroupsService, handleError, clearError, loadGroupMembers]);

  /**
   * Controlla se l'utente ha un gruppo attivo
   */
  const hasActiveGroup = useCallback(async (): Promise<boolean> => {
    try {
      const service = getGroupsService();
      return await service.hasActiveGroup();
    } catch (error) {
      console.error('Error checking active group:', error);
      return false;
    }
  }, [getGroupsService]);

  /**
   * Controlla se l'utente può gestire il gruppo corrente
   * Logica di business: solo il proprietario può gestire
   */
  const canManageGroup = useCallback((): boolean => {
    if (!currentGroup || !user?.id) return false;
    return currentGroup.user_id === user.id;
  }, [currentGroup, user?.id]);

  /**
   * Refresh completo dei dati
   */
  const refresh = useCallback(async () => {
    await loadGroups();
    if (currentGroup) {
      await loadGroupMembers(currentGroup.id);
    }
  }, [loadGroups, loadGroupMembers, currentGroup]);

  /**
   * Setter per il gruppo corrente con caricamento membri
   */
  const setCurrentGroupWithMembers = useCallback((group: GroupWithMemberCount | null) => {
    setCurrentGroup(group);
    if (group) {
      loadGroupMembers(group.id);
    } else {
      setMembers([]);
    }
  }, [loadGroupMembers]);

  // Effect per caricare i gruppi quando l'utente è disponibile
  useEffect(() => {
    // Carica i gruppi quando sia l'utente che il client Supabase sono disponibili
    if (user?.id && supabaseClient) {
      loadGroups();
    }
  }, [user?.id, supabaseClient, loadGroups]);

  return {
    // State
    groups,
    currentGroup,
    members,
    isLoading,
    error,

    // Actions
    createGroup,
    updateGroup,
    deleteGroup,
    removeMember,
    updateMemberRole,

    // Utilities
    hasActiveGroup,
    canManageGroup,
    refresh,
    setCurrentGroup: setCurrentGroupWithMembers
  };
};
