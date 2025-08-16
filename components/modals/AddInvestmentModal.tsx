import { memo } from 'react';
import { BaseModal, FormField, Input, Select, ModalActions } from '../ui';
import { useAddInvestment } from '../../hooks/features/investments/useAddInvestment';

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Componente presentazionale per aggiunta investimenti
 */
export const AddInvestmentModal = memo<AddInvestmentModalProps>(({ isOpen, onClose }) => {
  const {
    data,
    errors,
    isSubmitting,
    canSubmit,
    peopleOptions,
    isAllView,
    handleSubmit,
    handleNameChange,
    handleSymbolChange,
    handleQuantityChange,
    handlePurchasePriceChange,
    handleCurrentPriceChange,
    handlePurchaseDateChange,
    handlePersonChange,
  } = useAddInvestment({ onClose });

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Aggiungi Nuovo Investimento"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Person Selection (only in all view) */}
        {isAllView && (
          <FormField
            id="personId"
            label="Persona"
            error={errors.personId}
            required
          >
            <Select
              value={data.personId}
              onChange={handlePersonChange}
              options={peopleOptions}
              error={!!errors.personId}
              disabled={isSubmitting}
              placeholder="Seleziona persona"
            />
          </FormField>
        )}

        {/* Investment Name */}
        <FormField
          id="name"
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
          id="symbol"
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
          id="quantity"
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

        {/* Purchase Price */}
        <FormField
          id="purchasePrice"
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

        {/* Current Price */}
        <FormField
          id="currentPrice"
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

        {/* Purchase Date */}
        <FormField
          id="purchaseDate"
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
        {errors.general && (
          <div className="text-red-600 text-sm">{errors.general}</div>
        )}

        {/* Modal actions */}
        <ModalActions
          onCancel={onClose}
          onSubmit={handleSubmit}
          submitText="Aggiungi Investimento"
          cancelText="Annulla"
          isSubmitting={isSubmitting}
          submitDisabled={!canSubmit}
        />
      </form>
    </BaseModal>
  );
});

AddInvestmentModal.displayName = 'AddInvestmentModal';
