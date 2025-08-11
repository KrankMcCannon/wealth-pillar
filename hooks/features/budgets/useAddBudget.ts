import React, { useCallback, useMemo } from 'react';
import { useFinance, useModalForm } from '../../';

interface BudgetFormData {
    description: string;
    amount: string;
    selectedCategories: string[];
}

interface UseAddBudgetProps {
    personId: string;
    onClose: () => void;
}

/**
 * Hook per gestire la logica di aggiunta budget
 * Estrae tutta la business logic dal componente UI
 */
export const useAddBudget = ({ personId, onClose }: UseAddBudgetProps) => {
    const { addBudget, categories } = useFinance();

    const initialFormData: BudgetFormData = useMemo(() => ({
        description: '',
        amount: '',
        selectedCategories: [],
    }), []);

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

    // Filter categories excluding income categories
    const expenseCategories = useMemo(() =>
        categories.filter(cat =>
            !['stipendio', 'investimenti', 'entrata', 'trasferimento'].includes(cat.id)
        )
        , [categories]);

    // Category checkbox options
    const categoryOptions = useMemo(() =>
        expenseCategories.map(category => ({
            id: category.id,
            label: category.label || category.name,
            checked: data.selectedCategories.includes(category.id),
        }))
        , [expenseCategories, data.selectedCategories]);

    // Validation
    const validateForm = useCallback((): boolean => {
        clearAllErrors();

        if (!validateRequired(['description', 'amount'])) {
            return false;
        }

        if (data.description.trim().length === 0) {
            setError('description', 'La descrizione non può essere vuota');
            return false;
        }

        const numericAmount = parseFloat(data.amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            setError('amount', 'Inserisci un importo valido e positivo');
            return false;
        }

        if (data.selectedCategories.length === 0) {
            setError('selectedCategories', 'Seleziona almeno una categoria');
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
            await addBudget({
                description: data.description.trim(),
                amount: parseFloat(data.amount),
                categories: data.selectedCategories,
                period: 'monthly',
                personId,
            });
            onClose();
        } catch (err) {
            setError('general', err instanceof Error ? err.message : 'Errore durante l\'aggiunta del budget');
        } finally {
            setSubmitting(false);
        }
    }, [validateForm, setSubmitting, data, addBudget, personId, onClose, setError]);

    // Field change handlers
    const handleDescriptionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateField('description', e.target.value);
    }, [updateField]);

    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        updateField('amount', e.target.value);
    }, [updateField]);

    const handleCategoryToggle = useCallback((categoryId: string, checked: boolean) => {
        const newSelectedCategories = checked
            ? [...data.selectedCategories, categoryId]
            : data.selectedCategories.filter(id => id !== categoryId);

        updateField('selectedCategories', newSelectedCategories);
    }, [data.selectedCategories, updateField]);

    // Reset form when needed
    const handleReset = useCallback(() => {
        resetForm();
    }, [resetForm]);

    // Check if form can be submitted
    const canSubmit = useMemo(() => {
        return data.description.trim().length > 0 &&
            data.amount.trim().length > 0 &&
            parseFloat(data.amount) > 0 &&
            data.selectedCategories.length > 0;
    }, [data]);

    return {
        // Form state
        data,
        errors,
        isSubmitting,
        canSubmit,

        // Computed values
        categoryOptions,

        // Event handlers
        handleSubmit,
        handleDescriptionChange,
        handleAmountChange,
        handleCategoryToggle,
        handleReset,
    };
};
