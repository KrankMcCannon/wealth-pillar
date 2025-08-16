import { useCallback, useMemo, useState } from 'react';
import { validateAccountForm, ValidationErrors } from '../../utils/validators';
import type { OnboardingAccount, OnboardingPerson } from './useOnboarding';

/**
 * Hook to manage the accounts creation step of the onboarding flow.
 * It handles one or more accounts per person, validation, addition
 * and removal operations. By extracting these responsibilities into
 * a dedicated hook, the UI component remains declarative and DRY.
 */
export const useOnboardingAccountsForm = (people: OnboardingPerson[]) => {
    // Initialize an empty account for each person by default
    const [accounts, setAccounts] = useState<OnboardingAccount[]>(
        people.map(person => ({
            name: '',
            type: 'stipendio',
            personId: person.name,
        }))
    );

    const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});

    // Define the available account types once
    const accountTypes = [
        { value: 'stipendio', label: 'Stipendio' },
        { value: 'risparmio', label: 'Risparmio' },
        { value: 'contanti', label: 'Contanti' },
        { value: 'investimenti', label: 'Investimenti' },
    ] as const;

    /**
    * Add a new account for a given person. Uses the person's name as a
    * temporary identifier until real IDs are created later.
    */
    const addAccount = useCallback((personName: string) => {
        setAccounts(prev => [
            ...prev,
            {
                name: '',
                type: 'stipendio',
                personId: personName,
            },
        ]);
    }, []);

    /**
     * Remove an account by its index. Does not restrict removal to at least one
     * per person, but validation will flag persons without accounts.
     */
    const removeAccount = useCallback((accountIndex: number) => {
        setAccounts(prev => prev.filter((_, index) => index !== accountIndex));
    }, []);

    /**
    * Update an account's field by index. Clears any existing error on that
    * field. Accepts partial fields using keyof OnboardingAccount.
    */
    const updateAccount = useCallback(
        (accountIndex: number, field: keyof OnboardingAccount, value: string) => {
            setAccounts(prev =>
                prev.map((account, index) => (index === accountIndex ? { ...account, [field]: value } : account))
            );
            // Remove error for this specific field if present
            const account = accounts[accountIndex];
            if (!account) return;
            const errorKey = `account_${account.personId}_${accountIndex}_${field}`;
            setValidationErrors(prev => {
                if (!prev[errorKey]) return prev;
                const newErrors = { ...prev };
                delete newErrors[errorKey];
                return newErrors;
            });
        },
        [accounts]
    );

    /**
     * Validate the accounts form. Ensures each person has at least one
     * account, each account has a name, and there are no duplicates
     * within a person's accounts. Sets validation errors and returns
     * true if the form is valid.
     */
    const validateForm = useCallback((): boolean => {
        let errors: ValidationErrors = {};
        people.forEach(person => {
            const personAccounts = accounts.filter(acc => acc.personId === person.name);
            personAccounts.forEach((account, index) => {
                const accountErrors = validateAccountForm({
                    name: account.name,
                    selectedPersonIds: [account.personId]
                });
                Object.keys(accountErrors).forEach(key => {
                    errors[`account_${person.name}_${index}_${key}`] = accountErrors[key];
                });
            });
            // Must have at least one account
            if (personAccounts.length === 0) {
                errors[`person_${person.name}_accounts`] = `${person.name} deve avere almeno un account`;
            }
            // No duplicate names within the same person
            const names = personAccounts.map(acc => acc.name.trim().toLowerCase()).filter(Boolean);
            const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
            if (duplicates.length > 0) {
                errors[`person_${person.name}_duplicates`] = `${person.name} ha account con nomi duplicati`;
            }
        });
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    }, [people, accounts]);

    /**
     * Derive accounts grouped by person. Adds an index property to each
     * account entry to support editing and removal.
     */
    const accountsByPerson = useMemo(() => {
        return people.map(person => ({
            person,
            accounts: accounts
                .map((account, index) => ({ ...account, index }))
                .filter(account => account.personId === person.name),
        }));
    }, [people, accounts]);

    /**
    * Determine whether the form can be submitted. Every person must
    * have at least one account, and every account must have a non-empty name.
    */
    const canSubmit = useMemo(() => {
        return people.every(person => {
            const personAccounts = accounts.filter(acc => acc.personId === person.name);
            return (
                personAccounts.length > 0 && personAccounts.every(acc => acc.name.trim().length > 0)
            );
        });
    }, [people, accounts]);

    /**
     * Transform accounts to trimmed values and exclude entries without names.
     */
    const validAccounts = useMemo(() => {
        return accounts
            .filter(acc => acc.name.trim().length > 0)
            .map(acc => ({ ...acc, name: acc.name.trim() }));
    }, [accounts]);

    return {
        accounts,
        setAccounts,
        validationErrors,
        accountTypes,
        addAccount,
        removeAccount,
        updateAccount,
        validateForm,
        accountsByPerson,
        canSubmit,
        validAccounts,
    };
};