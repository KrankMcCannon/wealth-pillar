import { useCallback, useMemo, useState } from 'react';
import { useFinance } from '../../core/useFinance';
import { validateBudgetForm, ValidationErrors } from '../../utils/validators';
import type { OnboardingBudget, OnboardingPerson } from './useOnboarding';

/**
 * Hook to manage the budget creation step of the onboarding flow. It
 * initializes a budget for each person, handles updates, category
 * toggling, validation and readiness checks. This isolates the
 * complex form logic from the UI components and promotes reuse.
 */
export const useOnboardingBudgetsForm = (people: OnboardingPerson[]) => {
    const { categories } = useFinance();
    // Create a default budget for each person
    const [budgets, setBudgets] = useState<OnboardingBudget[]>(
        people.map(person => ({
            description: `Budget mensile di ${person.name}`,
            amount: 1000,
            categories: [],
            personId: person.name,
        }))
    );
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    // Filter out transfer categories to only show expense categories
    const expenseCategories = useMemo(() => {
        return categories.filter(cat => cat.name !== 'trasferimento' && cat.name !== 'transfer');
    }, [categories]);

    /**
    * Update a budget field by index. Clears validation error for that
    * specific field if present.
    */
    const updateBudget = useCallback(
        (index: number, field: keyof OnboardingBudget, value: any) => {
            setBudgets(prev =>
                prev.map((budget, i) => (i === index ? { ...budget, [field]: value } : budget))
            );
            const errorKey = `budget_${index}_${field}`;
            setValidationErrors(prev => {
                if (!prev[errorKey]) return prev;
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        },
        []
    );

    /**
    * Toggle category inclusion for a specific budget. Adds or removes the
    * category name based on the checked flag.
    */
    const handleCategoryToggle = useCallback(
        (index: number, categoryName: string, checked: boolean) => {
            const current = budgets[index].categories;
            const newCategories = checked
                ? [...current, categoryName]
                : current.filter(cat => cat !== categoryName);
            updateBudget(index, 'categories', newCategories);
        },
        [budgets, updateBudget]
    );

    /**
    * Validate the budgets form. Ensures each budget has a description, a
    * positive amount and at least one category selected. Sets errors and
    * returns true if valid.
    */
    const validateForm = useCallback((): boolean => {
        const errors: ValidationErrors = {};
        budgets.forEach((budget, index) => {
            const person = people.find(p => p.name === budget.personId);
            if (!person) return;
            const budgetErrors = validateBudgetForm({
                description: budget.description,
                amount: budget.amount.toString(),
                selectedCategories: budget.categories
            });
            Object.keys(budgetErrors).forEach(key => {
                errors[`budget_${index}_${key}`] = budgetErrors[key];
            });
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [budgets, people]);

    /**
    * Determine if the form is ready to submit. Each budget must have
    * description, positive amount and at least one category.
    */
    const canSubmit = useMemo(() => {
        return budgets.every(budget => {
            return (
                budget.description.trim().length > 0 &&
                budget.amount > 0 &&
                budget.categories.length > 0
            );
        });
    }, [budgets]);

    /**
    * Produce trimmed and sanitized budgets, trimming descriptions.
    */
    const validBudgets = useMemo(() => {
        return budgets.map(budget => ({
            ...budget,
            description: budget.description.trim(),
        }));
    }, [budgets]);

    return {
        budgets,
        setBudgets,
        validationErrors,
        expenseCategories,
        updateBudget,
        handleCategoryToggle,
        validateForm,
        canSubmit,
        validBudgets,
    };
};