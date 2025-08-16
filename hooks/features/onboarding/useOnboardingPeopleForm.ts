import { useCallback, useMemo, useState } from 'react';
import { validatePersonForm, ValidationErrors } from '../../utils/validators';
import type { OnboardingPerson } from './useOnboarding';

/**
 * Hook to manage the people creation step of the onboarding flow.
 * Handles multiple people entries, including add/remove operations,
 * field updates, validation and trimmed output. By extracting this
 * logic, the UI component becomes purely presentational.
 */
export const useOnboardingPeopleForm = (initialPeople: OnboardingPerson[] = []) => {
    // Use at least one blank person entry by default
    const [people, setPeople] = useState<OnboardingPerson[]>(
        initialPeople.length > 0
            ? initialPeople
            : [
                {
                    name: '',
                    avatar: '',
                    themeColor: '#3b82f6',
                    budgetStartDate: '1',
                },
            ]
    );
    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    // Predefined color palette. Exposed for UI rendering.
    const availableColors = [
        '#3b82f6',
        '#ef4444',
        '#10b981',
        '#f59e0b',
        '#8b5cf6',
        '#06b6d4',
        '#f97316',
        '#84cc16',
        '#ec4899',
        '#6b7280',
    ];

    /**
     * Add a new person with default values. Cycles through colors in a round
     * robin fashion based on the number of people already added.
     */
    const addPerson = useCallback(() => {
        setPeople(prev => {
            const newColorIndex = prev.length % availableColors.length;
            return [
                ...prev,
                {
                    name: '',
                    avatar: '',
                    themeColor: availableColors[newColorIndex],
                    budgetStartDate: '1',
                },
            ];
        });
    }, [availableColors.length]);

    /**
     * Remove a person by index. At least one person must remain. Also
     * removes associated validation errors.
     */
    const removePerson = useCallback((index: number) => {
        setPeople(prev => prev.filter((_, i) => i !== index));
        setValidationErrors(prev => {
            const newErrors = { ...prev };
            // Remove all errors related to this person (name field only)
            delete newErrors[`person_${index}_name`];
            return newErrors;
        });
    }, []);

    /**
     * Update a person's field and clear any associated validation error for that
     * field. Accepts the index, field name and value to update.
     */
    const handlePersonChange = useCallback(
        (index: number, field: keyof OnboardingPerson, value: string) => {
            setPeople(prev => prev.map((person, i) => (i === index ? { ...person, [field]: value } : person)));
            const errorKey = `person_${index}_${field}`;
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
     * Validate the people form. Ensures each name is non-empty, at least 2
     * characters long and unique. Updates validationErrors and returns true
     * if the form is valid.
     */
    const validateForm = useCallback((): boolean => {
        const errors: ValidationErrors = {};
        people.forEach((person, index) => {
            const trimmedName = person.name.trim();
            const nameErrors = validatePersonForm({ name: trimmedName });
            if (nameErrors.name) {
                errors[`person_${index}_name`] = nameErrors.name;
            }
            // Check for duplicates
            const duplicateIndex = people.findIndex(
                (p, i) => i !== index && p.name.trim() === trimmedName && trimmedName !== ''
            );
            if (duplicateIndex !== -1) {
                errors[`person_${index}_name`] = 'Questo nome è già stato utilizzato';
            }
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [people]);

    /**
     * Derived boolean to determine if form can be submitted. At least one
     * person must have a non-empty name.
     */
    const canSubmit = useMemo(() => {
        return people.some(person => person.name.trim().length > 0);
    }, [people]);

    /**
    * Transform people array into trimmed values and exclude entries without
    * a name. Useful before passing data to the next onboarding hook.
    */
    const validPeople = useMemo(() => {
        return people
            .filter(person => person.name.trim().length > 0)
            .map(person => ({ ...person, name: person.name.trim() }));
    }, [people]);

    return {
        people,
        setPeople,
        validationErrors,
        availableColors,
        addPerson,
        removePerson,
        handlePersonChange,
        validateForm,
        canSubmit,
        validPeople,
    };
};