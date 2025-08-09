import { useMemo } from 'react';
import { useFinance } from './useFinance';

/**
 * Hook per gestire il filtro delle persone e determinare la vista
 * Principio SRP: Single Responsibility - gestisce solo la logica di filtro delle persone
 */
export const usePersonFilter = () => {
  const { selectedPersonId, people, getPersonById } = useFinance();
  
  const isAllView = selectedPersonId === 'all';
  const selectedPerson = useMemo(() => 
    !isAllView ? people.find(p => p.id === selectedPersonId) : null
  , [isAllView, people, selectedPersonId]);

  const getPersonName = useMemo(() => (personId: string) => {
    return getPersonById(personId)?.name || 'Sconosciuto';
  }, [getPersonById]);

  return {
    selectedPersonId,
    isAllView,
    selectedPerson,
    people,
    getPersonName,
  };
};
