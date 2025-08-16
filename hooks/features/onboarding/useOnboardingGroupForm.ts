import React, { useCallback, useMemo, useState } from 'react';
import { validatePersonForm, ValidationErrors } from '../../utils/validators';
import type { OnboardingGroup } from './useOnboarding';

/**
 * Hook to manage the group creation step of the onboarding flow.
 * Encapsulates form state, validation and submission logic to keep
 * the UI component focused solely on rendering. This promotes
 * single responsibility and reusability across different onboarding
 * implementations.
 */
export const useOnboardingGroupForm = (initialData?: Partial<OnboardingGroup>) => {
    const [groupData, setGroupData] = useState<OnboardingGroup>({
        name: initialData?.name ?? '',
        description: initialData?.description ?? '',
    });

    const [validationErrors, setValidationErrors] = useState<ValidationErrors<OnboardingGroup>>({});

    /**
    * Validate the group form. Uses the generic Validators to enforce
    * required and minimum length rules. Updates the validationErrors
    * state and returns true if the form is valid.
    */
    const validateForm = useCallback((): boolean => {
        const errors: ValidationErrors<OnboardingGroup> = {};
        const nameErrors = validatePersonForm({ name: groupData.name });
        if (nameErrors.name) {
            errors.name = nameErrors.name;
        }
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [groupData]);

    /**
     * Handle field changes by updating the local state and clearing
     * validation errors for that field. Returned as a curried function
     * to be used directly in input handlers.
     */
    const handleFieldChange = useCallback(
        (field: keyof OnboardingGroup) => (e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setGroupData(prev => ({ ...prev, [field]: value }));
            if (validationErrors[field]) {
                setValidationErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors[field];
                    return newErrors;
                });
            }
        },
        [validationErrors]
    );

    /**
     * Whether the form has enough data to be submitted. We allow submission
     * only when the name field is not empty. Use useMemo to avoid
     * recalculating on each render.
     */
    const canSubmit = useMemo(() => {
        return groupData.name.trim().length > 0;
    }, [groupData.name]);

    return {
        groupData,
        setGroupData,
        validationErrors,
        validateForm,
        handleFieldChange,
        canSubmit,
    };
};