import { useCallback, useState } from 'react';

/**
 * Hook generico per gestire lo stato dei modali
 * Principio SRP: Single Responsibility - gestisce solo lo stato di apertura/chiusura
 * Principio DRY: Don't Repeat Yourself - riutilizzabile per qualsiasi modale
 * Principio OCP: Open/Closed - facilmente estendibile per nuove funzionalità
 */
export const useModal = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen(prev => !prev), []);

  return {
    isOpen,
    openModal,
    closeModal,
    toggleModal,
    setIsOpen,
  };
};

/**
 * Hook per gestire multiple modali con un singolo hook
 * Principio SRP: Single Responsibility - gestisce lo stato di multiple modali
 * Principio DRY: Don't Repeat Yourself - evita la duplicazione di logica
 */
export const useMultipleModals = <T extends string>(modalNames: T[]) => {
  const [openModals, setOpenModals] = useState<Set<T>>(new Set());

  const openModal = useCallback((modalName: T) => {
    setOpenModals(prev => new Set(prev).add(modalName));
  }, []);

  const closeModal = useCallback((modalName: T) => {
    setOpenModals(prev => {
      const newSet = new Set(prev);
      newSet.delete(modalName);
      return newSet;
    });
  }, []);

  const closeAllModals = useCallback(() => {
    setOpenModals(new Set());
  }, []);

  const isModalOpen = useCallback((modalName: T) => {
    return openModals.has(modalName);
  }, [openModals]);

  const toggleModal = useCallback((modalName: T) => {
    if (openModals.has(modalName)) {
      closeModal(modalName);
    } else {
      openModal(modalName);
    }
  }, [openModals, openModal, closeModal]);

  return {
    openModal,
    closeModal,
    closeAllModals,
    isModalOpen,
    toggleModal,
    openModals: Array.from(openModals),
  };
};

/**
 * Hook per gestire modali con dati associati
 * Principio SRP: Single Responsibility - gestisce modali con stato di editing
 * Principio DRY: Don't Repeat Yourself - pattern comune per modali di editing
 */
export const useModalWithData = <T>(initialData?: T) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<T | undefined>(initialData);

  const openModal = useCallback((modalData?: T) => {
    setData(modalData);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setData(undefined);
  }, []);

  const updateData = useCallback((newData: T) => {
    setData(newData);
  }, []);

  return {
    isOpen,
    data,
    openModal,
    closeModal,
    updateData,
    setData,
  };
};
