/**
 * Groups Service - Simplified
 * Gestisce la business logic dei gruppi seguendo i principi SOLID
 * Single Responsibility: Solo operazioni sui gruppi
 * Open/Closed: Estende BaseService per operazioni standard
 * Dependency Inversion: Dipende da Repository pattern
 */

import { SupabaseClient } from '@supabase/supabase-js';
import type { Database, Inserts, Tables, Updates } from '../types/database.types';
import { ServiceError } from './base-service';

// Type definitions
export type Group = Tables<'groups'>;
export type GroupInsert = Inserts<'groups'>;
export type GroupUpdate = Updates<'groups'>;
export type Person = Tables<'people'>;

export interface CreateGroupData {
  name: string;
  description?: string;
}

export interface GroupWithMemberCount extends Group {
  member_count: number;
}

/**
 * Simplified Groups Service
 * Groups collegano persone tramite group_id nella tabella people
 */
export class GroupsService {
  constructor(
    private client: SupabaseClient<Database>,
    private userId: string // User ID fornito da Clerk
  ) {}

  /**
   * Crea un nuovo gruppo
   * Utilizza l'utente autenticato corrente come proprietario
   */
  async createGroup(data: CreateGroupData): Promise<Group> {
    try {
      if (!this.userId) {
        throw new ServiceError('User not authenticated', 'AUTH_REQUIRED');
      }

      const groupData: GroupInsert = {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        user_id: this.userId,
        is_active: true
      };

      const { data: group, error } = await this.client
        .from('groups')
        .insert(groupData)
        .select()
        .single();

      if (error) {
        console.error('Database error creating group:', error);
        throw new ServiceError('Failed to create group', 'CREATE_GROUP_ERROR', error);
      }

      return group;
    } catch (error) {
      this.handleError(error, 'createGroup');
      throw error;
    }
  }

  /**
   * Ottiene tutti i gruppi dell'utente corrente
   * Riutilizza pattern di query esistente
   */
  async getUserGroups(): Promise<GroupWithMemberCount[]> {
    try {
      if (!this.userId) {
        throw new ServiceError('User not authenticated', 'AUTH_REQUIRED');
      }

      // Query con conteggio membri usando pattern esistente
      const { data: groups, error } = await this.client
        .from('groups')
        .select(`
          *,
          people(count)
        `)
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Database error fetching groups:', error);
        throw new ServiceError('Failed to fetch user groups', 'FETCH_GROUPS_ERROR', error);
      }

      // Trasforma i dati per includere member_count
      const transformedGroups = (groups || []).map(group => ({
        ...group,
        member_count: group.people?.[0]?.count || 0
      }));

      return transformedGroups;
    } catch (error) {
      this.handleError(error, 'getUserGroups');
      throw error;
    }
  }

  /**
   * Controlla se l'utente ha almeno un gruppo attivo
   * Metodo leggero per controlli di onboarding
   */
  async hasAnyGroup(): Promise<boolean> {
    try {
      if (!this.userId) {
        return false;
      }

      const { data, error } = await this.client
        .from('groups')
        .select('id')
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        console.error('Error checking for groups:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error in hasAnyGroup:', error);
      return false;
    }
  }

  /**
   * Ottiene il gruppo corrente dell'utente autenticato
   * Metodo di utilità per ottenere l'ID del gruppo per il filtraggio
   */
  async getCurrentUserGroupId(): Promise<string | null> {
    try {
      if (!this.userId) {
        throw new ServiceError('User not authenticated', 'AUTH_REQUIRED');
      }

      // Prima prova a vedere se l'utente ha un gruppo come proprietario
      const { data: ownedGroup, error: ownedError } = await this.client
        .from('groups')
        .select('id')
        .eq('user_id', this.userId)
        .eq('is_active', true)
        .maybeSingle();

      if (ownedError && ownedError.code !== 'PGRST116') {
        throw new ServiceError('Failed to fetch owned group', 'FETCH_GROUP_ERROR', ownedError);
      }

      if (ownedGroup) {
        return ownedGroup.id;
      }

      // Se non è proprietario, cerca se è membro di qualche gruppo
      const { data: person, error: personError } = await this.client
        .from('people')
        .select('group_id')
        .eq('id', this.userId) // Assumendo che person.id = user.id
        .maybeSingle();

      if (personError && personError.code !== 'PGRST116') {
        throw new ServiceError('Failed to fetch user person data', 'FETCH_PERSON_ERROR', personError);
      }

      return person?.group_id || null;
    } catch (error) {
      this.handleError(error, 'getCurrentUserGroupId');
      throw error;
    }
  }

  /**
   * Ottiene un singolo gruppo per ID con validazione proprietario
   */
  async getGroupById(groupId: string): Promise<Group | null> {
    try {
      if (!this.userId) {
        throw new ServiceError('User not authenticated', 'AUTH_REQUIRED');
      }

      const { data: group, error } = await this.client
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .eq('user_id', this.userId) // Assicura che l'utente sia il proprietario
        .eq('is_active', true)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw new ServiceError('Failed to fetch group', 'FETCH_GROUP_ERROR', error);
      }

      return group;
    } catch (error) {
      this.handleError(error, 'getGroupById');
      throw error;
    }
  }

  /**
   * Aggiorna un gruppo
   * Solo il proprietario può aggiornare il gruppo
   */
  async updateGroup(groupId: string, updates: Partial<GroupUpdate>): Promise<Group> {
    try {
      if (!this.userId) {
        throw new ServiceError('User not authenticated', 'AUTH_REQUIRED');
      }

      // Validazione di business: solo il proprietario può aggiornare
      await this.validateOwnership(groupId, this.userId);

      const updateData: GroupUpdate = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      const { data: group, error } = await this.client
        .from('groups')
        .update(updateData)
        .eq('id', groupId)
        .eq('user_id', this.userId)
        .select()
        .single();

      if (error) {
        throw new ServiceError('Failed to update group', 'UPDATE_GROUP_ERROR', error);
      }

      return group;
    } catch (error) {
      this.handleError(error, 'updateGroup');
      throw error;
    }
  }

  /**
   * Elimina un gruppo (soft delete)
   * Solo il proprietario può eliminare il gruppo
   */
  async deleteGroup(groupId: string): Promise<void> {
    try {
      if (!this.userId) {
        throw new ServiceError('User not authenticated', 'AUTH_REQUIRED');
      }

      // Validazione di business: solo il proprietario può eliminare
      await this.validateOwnership(groupId, this.userId);

      // Prima rimuove tutte le persone dal gruppo
      await this.removeAllMembersFromGroup(groupId);

      // Poi soft-delete del gruppo
      const { error } = await this.client
        .from('groups')
        .update({ 
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', groupId)
        .eq('user_id', this.userId);

      if (error) {
        throw new ServiceError('Failed to delete group', 'DELETE_GROUP_ERROR', error);
      }
    } catch (error) {
      this.handleError(error, 'deleteGroup');
      throw error;
    }
  }

  /**
   * Ottiene tutte le persone di un gruppo
   * Riutilizza logica esistente per query persone
   */
  async getGroupMembers(groupId: string): Promise<Person[]> {
    try {
      if (!this.userId) {
        throw new ServiceError('User not authenticated', 'AUTH_REQUIRED');
      }

      // Validazione: solo il proprietario può vedere i membri
      await this.validateOwnership(groupId, this.userId);

      const { data: people, error } = await this.client
        .from('people')
        .select('*')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true });

      if (error) {
        throw new ServiceError('Failed to fetch group members', 'FETCH_MEMBERS_ERROR', error);
      }

      return people || [];
    } catch (error) {
      this.handleError(error, 'getGroupMembers');
      throw error;
    }
  }

  /**
   * Rimuove una persona dal gruppo
   * Riutilizza pattern di aggiornamento esistente
   */
  async removeMemberFromGroup(personId: string): Promise<void> {
    try {
      if (!this.userId) {
        throw new ServiceError('User not authenticated', 'AUTH_REQUIRED');
      }

      // Prima ottieni la persona per validare il gruppo
      const { data: person, error: personError } = await this.client
        .from('people')
        .select('group_id')
        .eq('id', personId)
        .single();

      if (personError || !person?.group_id) {
        throw new ServiceError('Person not found or not in a group', 'PERSON_NOT_FOUND');
      }

      // Validazione: solo il proprietario del gruppo può rimuovere membri
      await this.validateOwnership(person.group_id, this.userId);

      // Rimuove la persona dal gruppo
      const { error } = await this.client
        .from('people')
        .update({ 
          group_id: null,
          role: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', personId);

      if (error) {
        throw new ServiceError('Failed to remove member from group', 'REMOVE_MEMBER_ERROR', error);
      }
    } catch (error) {
      this.handleError(error, 'removeMemberFromGroup');
      throw error;
    }
  }

  /**
   * Aggiorna il ruolo di una persona nel gruppo
   */
  async updateMemberRole(personId: string, role: 'owner' | 'admin' | 'member'): Promise<void> {
    try {
      if (!this.userId) {
        throw new ServiceError('User not authenticated', 'AUTH_REQUIRED');
      }

      // Prima ottieni la persona per validare il gruppo
      const { data: person, error: personError } = await this.client
        .from('people')
        .select('group_id')
        .eq('id', personId)
        .single();

      if (personError || !person?.group_id) {
        throw new ServiceError('Person not found or not in a group', 'PERSON_NOT_FOUND');
      }

      // Validazione: solo il proprietario del gruppo può modificare ruoli
      await this.validateOwnership(person.group_id, this.userId);

      const { error } = await this.client
        .from('people')
        .update({ 
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', personId);

      if (error) {
        throw new ServiceError('Failed to update member role', 'UPDATE_ROLE_ERROR', error);
      }
    } catch (error) {
      this.handleError(error, 'updateMemberRole');
      throw error;
    }
  }

  /**
   * Controlla se l'utente corrente ha un gruppo attivo
   */
  async hasActiveGroup(): Promise<boolean> {
    try {
      if (!this.userId) {
        return false;
      }

      const { count, error } = await this.client
        .from('groups')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', this.userId)
        .eq('is_active', true);

      if (error) {
        console.error('Error checking active group:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error in hasActiveGroup:', error);
      return false;
    }
  }

  /**
   * Ottiene il gruppo corrente dell'utente
   */
  async getCurrentUserGroup(): Promise<GroupWithMemberCount | null> {
    try {
      const groups = await this.getUserGroups();
      return groups.length > 0 ? groups[0] : null;
    } catch (error) {
      console.error('Error getting current user group:', error);
      return null;
    }
  }

  /**
   * Inizializza un gruppo per l'utente se non ne ha uno
   * Controlla se esistono persone senza gruppo e le associa al nuovo gruppo
   */
  async initializeUserGroup(): Promise<GroupWithMemberCount | null> {
    try {
      if (!this.userId) {
        throw new ServiceError('User not authenticated', 'AUTH_REQUIRED');
      }

      // Controlla se l'utente ha già un gruppo
      const existingGroups = await this.getUserGroups();
      if (existingGroups.length > 0) {
        return existingGroups[0];
      }

      // Controlla se ci sono persone senza gruppo associato all'utente
      const { data: orphanedPeople, error: peopleError } = await this.client
        .from('people')
        .select('id, name')
        .is('group_id', null);

      if (peopleError) {
        console.error('Error checking orphaned people:', peopleError);
      }

      // Crea un nuovo gruppo per l'utente
      const groupName = orphanedPeople && orphanedPeople.length > 0 
        ? 'Il mio gruppo familiare' 
        : 'Il mio gruppo';

      const newGroup = await this.createGroup({
        name: groupName,
        description: 'Gruppo creato automaticamente per gestire i dati finanziari'
      });

      // Se ci sono persone "orfane", le associa al nuovo gruppo
      if (orphanedPeople && orphanedPeople.length > 0) {
        const { error: updateError } = await this.client
          .from('people')
          .update({ 
            group_id: newGroup.id,
            role: 'member',
            updated_at: new Date().toISOString()
          })
          .is('group_id', null);

        if (updateError) {
          console.error('Error associating orphaned people to group:', updateError);
        }

        // Imposta il primo come owner se esiste
        if (orphanedPeople.length > 0) {
          const { error: ownerError } = await this.client
            .from('people')
            .update({ 
              role: 'owner',
              updated_at: new Date().toISOString()
            })
            .eq('id', orphanedPeople[0].id);

          if (ownerError) {
            console.error('Error setting owner role:', ownerError);
          }
        }
      }

      // Ritorna il gruppo con il conteggio membri aggiornato
      const updatedGroup = await this.getCurrentUserGroup();

      return updatedGroup;
    } catch (error) {
      console.error('Error in initializeUserGroup:', error);
      this.handleError(error, 'initializeUserGroup');
      throw error;
    }
  }

  // Private helper methods

  /**
   * Valida che l'utente sia il proprietario del gruppo
   */
  private async validateOwnership(groupId: string, userId: string): Promise<void> {
    const { data: group, error } = await this.client
      .from('groups')
      .select('user_id')
      .eq('id', groupId)
      .eq('is_active', true)
      .single();

    if (error || !group) {
      throw new ServiceError('Group not found', 'GROUP_NOT_FOUND');
    }

    if (group.user_id !== userId) {
      throw new ServiceError('Insufficient permissions', 'INSUFFICIENT_PERMISSIONS');
    }
  }

  /**
   * Rimuove tutti i membri da un gruppo prima dell'eliminazione
   */
  private async removeAllMembersFromGroup(groupId: string): Promise<void> {
    const { error } = await this.client
      .from('people')
      .update({ 
        group_id: null,
        role: null,
        updated_at: new Date().toISOString()
      })
      .eq('group_id', groupId);

    if (error) {
      throw new ServiceError('Failed to remove all members from group', 'REMOVE_ALL_MEMBERS_ERROR', error);
    }
  }

  /**
   * Gestione errori centralizzata
   */
  private handleError(error: any, context: string): void {
    if (error instanceof ServiceError) {
      // Rilanciamo gli errori del servizio così come sono
      return;
    }
    
    console.error(`Error in GroupsService.${context}:`, error);
    
    // Convertiamo altri tipi di errore in ServiceError
    if (error?.code?.startsWith('PGRST')) {
      throw new ServiceError(`Database error in ${context}`, error.code, error);
    }
  }
}
