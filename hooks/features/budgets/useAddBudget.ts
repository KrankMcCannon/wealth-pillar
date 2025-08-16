import React, { useCallback, useMemo } from 'react';
import { useFinance, useModalForm } from '../../';
import { validateBudgetForm } from '../../utils/validators';

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
    } = useModalForm({
        initialData: initialFormData,
        resetOnClose: true,
        resetOnOpen: true,
    });

    const expenseCategories = useMemo(() =>
        categories.filter(cat =>
            !['stipendio', 'investimenti', 'entrata', 'trasferimento'].includes(cat.id)
        )
        , [categories]);

    const categoryOptions = useMemo(() =>
        expenseCategories.map(category => ({
            id: category.id,
            label: category.label || category.name,
            checked: data.selectedCategories.includes(category.id),
        }))
        , [expenseCategories, data.selectedCategories]);

    const validateForm = useCallback((): boolean => {
        clearAllErrors();
        const errorsObj = validateBudgetForm({
            description: data.description,
            amount: data.amount,
            selectedCategories: data.selectedCategories,
        });
        Object.entries(errorsObj).forEach(([field, message]) => {
            setError(field as any, message as string);
        });
        return Object.keys(errorsObj).length === 0;
    }, [data, clearAllErrors, setError]);

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

    const handleReset = useCallback(() => {
        resetForm();
    }, [resetForm]);

    const canSubmit = useMemo(() => {
        return Object.keys(validateBudgetForm({
            description: data.description,
            amount: data.amount,
            selectedCategories: data.selectedCategories,
        })).length === 0;
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
