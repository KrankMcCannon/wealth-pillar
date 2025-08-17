import React, { useCallback, useEffect, useMemo } from 'react';
import { useFinance, useModalForm } from '../../';

interface AddInvestmentFormData {
  name: string;
  symbol: string;
  quantity: string;
  purchasePrice: string;
  currentPrice: string;
  purchaseDate: string;
  personId: string;
}

interface UseAddInvestmentProps {
  onClose: () => void;
}

/**
 * Hook per gestire la logica di aggiunta investimenti
 * Estrae tutta la business logic dal componente UI
 */
export const useAddInvestment = ({ onClose }: UseAddInvestmentProps) => {
  const { addInvestment, people, selectedPersonId } = useFinance();

  const isAllView = selectedPersonId === 'all';

  // Initial form data
  const initialFormData: AddInvestmentFormData = useMemo(() => ({
    name: '',
    symbol: '',
    quantity: '',
    purchasePrice: '',
    currentPrice: '',
    purchaseDate: new Date().toISOString().split('T')[0],
    personId: isAllView ? (people[0]?.id || '') : selectedPersonId,
  }), [isAllView, people, selectedPersonId]);

  const {
    data,
    errors,
    isSubmitting,
    updateField,
    setError,
    clearAllErrors,
    setSubmitting,
    resetForm,
    validateRequired,
  } = useModalForm({
    initialData: initialFormData,
    resetOnClose: true,
    resetOnOpen: true,
  });

  // Reset person ID when modal opens or person selection changes
  useEffect(() => {
    const newPersonId = isAllView ? (people[0]?.id || '') : selectedPersonId;
    updateField('personId', newPersonId);
  }, [isAllView, people, selectedPersonId, updateField]);

  // People options for select
  const peopleOptions = useMemo(() => 
    people.map(person => ({
      value: person.id,
      label: person.name,
    }))
  , [people]);

  // Validation rules
  const validateForm = useCallback((): boolean => {
    clearAllErrors();

    if (!validateRequired(['name', 'symbol', 'quantity', 'purchasePrice', 'currentPrice', 'personId', 'purchaseDate'])) {
      return false;
    }

    const numQuantity = parseFloat(data.quantity);
    if (isNaN(numQuantity) || numQuantity <= 0) {
      setError('quantity', 'Inserisci una quantità valida');
      return false;
    }

    const numPurchasePrice = parseFloat(data.purchasePrice);
    if (isNaN(numPurchasePrice) || numPurchasePrice <= 0) {
      setError('purchasePrice', 'Inserisci un prezzo di acquisto valido');
      return false;
    }

    const numCurrentPrice = parseFloat(data.currentPrice);
    if (isNaN(numCurrentPrice) || numCurrentPrice <= 0) {
      setError('currentPrice', 'Inserisci un prezzo corrente valido');
      return false;
    }

    return true;
  }, [data, validateRequired, setError, clearAllErrors]);

  // Submit handler
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const numQuantity = parseFloat(data.quantity);
      const numPurchasePrice = parseFloat(data.purchasePrice);
      const numCurrentPrice = parseFloat(data.currentPrice);

      await addInvestment({
        personId: data.personId,
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        quantity: numQuantity,
        purchasePrice: numPurchasePrice,
        currentPrice: numCurrentPrice,
        purchaseDate: data.purchaseDate,
        groupId: isAllView ? null : selectedPersonId,
      });
      onClose();
    } catch (err) {
      setError('general', err instanceof Error ? err.message : 'Errore durante l\'aggiunta dell\'investimento');
    } finally {
      setSubmitting(false);
    }
  }, [validateForm, setSubmitting, data, addInvestment, onClose, setError]);

  // Field change handlers
  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('name', e.target.value);
  }, [updateField]);

  const handleSymbolChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('symbol', e.target.value.toUpperCase());
  }, [updateField]);

  const handleQuantityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('quantity', e.target.value);
  }, [updateField]);

  const handlePurchasePriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('purchasePrice', e.target.value);
  }, [updateField]);

  const handleCurrentPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('currentPrice', e.target.value);
  }, [updateField]);

  const handlePurchaseDateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    updateField('purchaseDate', e.target.value);
  }, [updateField]);

  const handlePersonChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    updateField('personId', e.target.value);
  }, [updateField]);

  // Check if form can be submitted
  const canSubmit = useMemo(() => {
    return data.name.trim().length > 0 && 
           data.symbol.trim().length > 0 && 
           data.quantity.trim().length > 0 && 
           parseFloat(data.quantity) > 0 &&
           data.purchasePrice.trim().length > 0 && 
           parseFloat(data.purchasePrice) > 0 &&
           data.currentPrice.trim().length > 0 && 
           parseFloat(data.currentPrice) > 0 &&
           data.personId.length > 0;
  }, [data]);

  return {
    // Form state
    data,
    errors,
    isSubmitting,
    canSubmit,
    
    // Computed values
    peopleOptions,
    isAllView,
    
    // Event handlers
    handleSubmit,
    handleNameChange,
    handleSymbolChange,
    handleQuantityChange,
    handlePurchasePriceChange,
    handleCurrentPriceChange,
    handlePurchaseDateChange,
    handlePersonChange,
  };
};
