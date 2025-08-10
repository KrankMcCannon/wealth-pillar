import React, { memo, useCallback, useMemo, useEffect } from 'react';
import { useFinance, useModalForm } from '../../hooks';
import { BaseModal, FormField, Input, Select, ModalActions } from '../ui';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AddInvestmentFormData {
  name: string;
  symbol: string;
  quantity: string;
  purchasePrice: string;
  currentPrice: string;
  purchaseDate: string;
  personId: string;
}

export const AddInvestmentModal = memo<AddInvestmentModalProps>(({ isOpen, onClose }) => {
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
    if (isOpen) {
      const newPersonId = isAllView ? (people[0]?.id || '') : selectedPersonId;
      updateField('personId', newPersonId);
    }
  }, [isOpen, isAllView, people, selectedPersonId, updateField]);

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
      });
      onClose();
    } catch (err) {
      setError('submit', err instanceof Error ? err.message : 'Errore durante l\'aggiunta dell\'investimento');
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

  const handlePersonChange = useCallback((value: string) => {
    updateField('personId', value);
  }, [updateField]);

  const submitError = errors.submit;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Aggiungi Nuovo Investimento"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Person selection */}
        {isAllView && (
          <FormField
            label="Persona"
            error={errors.personId}
            required
          >
            <Select
              value={data.personId}
              onValueChange={handlePersonChange}
              options={peopleOptions}
              placeholder="Seleziona una persona"
              error={!!errors.personId}
              disabled={isSubmitting}
            />
          </FormField>
        )}

        {/* Investment name */}
        <FormField
          label="Nome investimento"
          error={errors.name}
          required
        >
          <Input
            value={data.name}
            onChange={handleNameChange}
            placeholder="es: Azioni Apple"
            error={!!errors.name}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Symbol */}
        <FormField
          label="Simbolo"
          error={errors.symbol}
          required
        >
          <Input
            value={data.symbol}
            onChange={handleSymbolChange}
            placeholder="es: AAPL"
            error={!!errors.symbol}
            disabled={isSubmitting}
            style={{ textTransform: 'uppercase' }}
          />
        </FormField>

        {/* Quantity */}
        <FormField
          label="Quantità"
          error={errors.quantity}
          required
        >
          <Input
            type="number"
            value={data.quantity}
            onChange={handleQuantityChange}
            placeholder="0"
            min="0"
            step="0.01"
            error={!!errors.quantity}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Purchase price */}
        <FormField
          label="Prezzo di acquisto (€)"
          error={errors.purchasePrice}
          required
        >
          <Input
            type="number"
            value={data.purchasePrice}
            onChange={handlePurchasePriceChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            error={!!errors.purchasePrice}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Current price */}
        <FormField
          label="Prezzo corrente (€)"
          error={errors.currentPrice}
          required
        >
          <Input
            type="number"
            value={data.currentPrice}
            onChange={handleCurrentPriceChange}
            placeholder="0.00"
            min="0"
            step="0.01"
            error={!!errors.currentPrice}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Purchase date */}
        <FormField
          label="Data di acquisto"
          error={errors.purchaseDate}
          required
        >
          <Input
            type="date"
            value={data.purchaseDate}
            onChange={handlePurchaseDateChange}
            error={!!errors.purchaseDate}
            disabled={isSubmitting}
          />
        </FormField>

        {/* Submit error */}
        {submitError && (
          <div className="text-red-600 text-sm">{submitError}</div>
        )}

        {/* Modal actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitLabel="Aggiungi Investimento"
          cancelLabel="Annulla"
          isSubmitting={isSubmitting}
        />
      </form>
    </BaseModal>
  );
});

AddInvestmentModal.displayName = 'AddInvestmentModal';
