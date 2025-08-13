import { useCallback, useState } from 'react';

/**
 * Hook per gestire lo stato dei modali degli investimenti
 * Principio SRP: Single Responsibility - gestisce solo lo stato dei modali
 * Principio DRY: Don't Repeat Yourself - riutilizzabile per altri modali
 */
export const useInvestmentModals = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const openModal = useCallback(() => setIsModalOpen(true), []);
  const closeModal = useCallback(() => setIsModalOpen(false), []);

  return {
    isModalOpen,
    openModal,
    closeModal,
  };
};
