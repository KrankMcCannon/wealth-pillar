import { useCallback, useMemo } from 'react';
import { Person } from '../../types';
import { useFinance } from '../core/useFinance';

/**
 * Interface per definire il risultato del filtro persona
 * Principio ISP: Interface Segregation - definisce solo ciò che serve
 */
interface PersonFilterResult {
  selectedPersonId: string;
  isAllView: boolean;
  selectedPerson: Person | null;
  people: Person[];
  getPersonName: (personId: string) => string;
  getPersonById: (personId: string) => Person | undefined;
  isPersonSelected: (personId: string) => boolean;
  getPersonDisplayName: (person: Person) => string;
  canEditPerson: (personId: string) => boolean;
}

/**
 * Hook ottimizzato per gestire il filtro delle persone
 * Principio SRP: Single Responsibility - gestisce solo la logica di filtro e utilità persone
 * Principio DRY: Don't Repeat Yourself - centralizza tutta la logica relativa alle persone
 * Principio OCP: Open/Closed - estendibile per nuove funzionalità persona
 * Principio DIP: Dependency Inversion - può essere testato indipendentemente
 */
export const usePersonFilter = (): PersonFilterResult => {
  const { selectedPersonId, people, getPersonById } = useFinance();
  
  // Memoizzazione dello stato della vista
  const isAllView = useMemo(() => selectedPersonId === 'all', [selectedPersonId]);
  
  // Memoizzazione della persona selezionata con validazione
  const selectedPerson = useMemo(() => {
    if (isAllView) return null;
    
    const person = people.find(p => p.id === selectedPersonId);
    if (!person) {
      console.warn(`Person with ID ${selectedPersonId} not found`);
      return null;
    }
    
    return person;
  }, [isAllView, people, selectedPersonId]);

  /**
   * Ottiene il nome di una persona con fallback sicuro
   * Principio SRP: Single Responsibility - solo ottenimento nome
   */
  const getPersonName = useCallback((personId: string): string => {
    if (personId === 'all') return 'Tutte le persone';
    
    const person = getPersonById(personId);
    return person?.name || 'Sconosciuto';
  }, [getPersonById]);

  /**
   * Verifica se una persona specifica è selezionata
   * Principio SRP: Single Responsibility - solo verifica selezione
   */
  const isPersonSelected = useCallback((personId: string): boolean => {
    return selectedPersonId === personId;
  }, [selectedPersonId]);

  /**
   * Ottiene il nome di visualizzazione completo di una persona
   * Principio SRP: Single Responsibility - solo formattazione nome
   */
  const getPersonDisplayName = useCallback((person: Person): string => {
    if (!person.name) return 'Nome non disponibile';
    
    // Può essere esteso per includere altri dati (es. cognome, email, etc.)
    return person.name;
  }, []);

  /**
   * Verifica se una persona può essere modificata
   * Principio SRP: Single Responsibility - solo logica di permessi
   * Principio OCP: Open/Closed - facilmente estendibile per regole complesse
   */
  const canEditPerson = useCallback((personId: string): boolean => {
    if (personId === 'all') return false;
    
    const person = getPersonById(personId);
    if (!person) return false;
    
    // Logica estendibile per permessi specifici
    // Es: return person.canEdit !== false && userHasPermission(person.id);
    return true;
  }, [getPersonById]);

  // Memoizzazione del risultato completo per performance
  const result = useMemo<PersonFilterResult>(() => ({
    selectedPersonId,
    isAllView,
    selectedPerson,
    people,
    getPersonName,
    getPersonById,
    isPersonSelected,
    getPersonDisplayName,
    canEditPerson,
  }), [
    selectedPersonId,
    isAllView,
    selectedPerson,
    people,
    getPersonName,
    getPersonById,
    isPersonSelected,
    getPersonDisplayName,
    canEditPerson,
  ]);

  return result;
};

/**
 * Hook specializzato per validazione persone
 * Principio SRP: Single Responsibility - solo validazione
 * Principio DRY: Don't Repeat Yourself - riusa logica di base
 */
export const usePersonValidation = () => {
  const { people, getPersonById } = usePersonFilter();

  const validatePersonExists = useCallback((personId: string): boolean => {
    if (personId === 'all') return true;
    return !!getPersonById(personId);
  }, [getPersonById]);

  const validatePersonName = useCallback((name: string): string | null => {
    if (!name || name.trim().length === 0) {
      return 'Il nome è obbligatorio';
    }
    
    if (name.trim().length < 2) {
      return 'Il nome deve contenere almeno 2 caratteri';
    }
    
    const existingPerson = people.find(p => 
      p.name.toLowerCase().trim() === name.toLowerCase().trim()
    );
    
    if (existingPerson) {
      return 'Una persona con questo nome esiste già';
    }
    
    return null;
  }, [people]);

  const validatePersonId = useCallback((personId: string): string | null => {
    if (!personId) return 'ID persona è obbligatorio';
    if (personId === 'all') return null; // ID speciale valido
    
    if (!validatePersonExists(personId)) {
      return 'Persona non trovata';
    }
    
    return null;
  }, [validatePersonExists]);

  return {
    validatePersonExists,
    validatePersonName,
    validatePersonId,
  };
};

/**
 * Hook per statistiche persone
 * Principio SRP: Single Responsibility - solo calcolo statistiche
 * Principio DRY: Don't Repeat Yourself - centralizza calcoli comuni
 */
export const usePersonStats = () => {
  const { people, selectedPersonId, isAllView } = usePersonFilter();

  const stats = useMemo(() => {
    const totalPeople = people.length;
    
    return {
      totalPeople,
      hasMultiplePeople: totalPeople > 1,
      isViewingAll: isAllView,
      selectedPersonIndex: isAllView ? -1 : people.findIndex(p => p.id === selectedPersonId),
    };
  }, [people, selectedPersonId, isAllView]);

  return stats;
};
