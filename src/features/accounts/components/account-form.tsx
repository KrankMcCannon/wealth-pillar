"use client";

import { useState, useEffect } from "react";
import { User, Account } from "@/lib/types";
import { CreateAccountInput } from "@/lib/services/account.service";
import { createAccountAction, updateAccountAction } from "@/features/accounts/actions/account-actions";
import { accountStyles } from "@/features/accounts/theme/account-styles";
import { ModalContent, ModalSection, ModalWrapper } from "@/src/components/ui/modal-wrapper";
import { FormActions, FormField, FormSelect } from "@/src/components/form";
import { UserField } from "@/src/components/ui/fields";
import { Input } from "@/src/components/ui/input";
import { usePermissions } from "@/hooks";
import { Label } from "@/components/ui/label";

interface AccountFormProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    account?: Account;
    mode: "create" | "edit";
    currentUser: User;
    groupUsers: User[];
    groupId: string;
    selectedUserId?: string;
    onSuccess?: (account: Account, action: "create" | "update") => void;
}

interface FormData {
    name: string;
    type: Account['type'];
    user_ids: string[];
    isDefault: boolean;
}

interface FormErrors {
    name?: string;
    type?: string;
    user_ids?: string;
    submit?: string;
}

export function AccountForm({
    isOpen,
    onOpenChange,
    account,
    mode,
    currentUser,
    groupUsers,
    groupId,
    selectedUserId,
    onSuccess,
}: Readonly<AccountFormProps>) {
    const title = mode === "edit" ? "Modifica account" : "Nuovo account";
    const description = mode === "edit" ? "Aggiorna i dettagli dell'account" : "Aggiungi un nuovo account bancario o di cassa";

    // Permission checks
    const { shouldDisableUserField, defaultFormUserId } = usePermissions({
        currentUser,
        selectedUserId,
    });

    // Initialize form data
    const [formData, setFormData] = useState<FormData>({
        name: "",
        type: "payroll",
        user_ids: defaultFormUserId ? [defaultFormUserId] : [currentUser.id],
        isDefault: false,
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Determine if default setting is allowed
    const canSetDefault = formData.user_ids.length === 1;

    // Reset form when modal opens/closes or account changes
    useEffect(() => {
        if (isOpen) {
            if (mode === "edit" && account) {
                // Check if this account is the default for the single user (if applicable)
                let isDefault = false;
                if (account.user_ids.length === 1) {
                    const userId = account.user_ids[0];
                    const user = groupUsers.find(u => u.id === userId);
                    if (user?.default_account_id === account.id) {
                        isDefault = true;
                    }
                }

                setFormData({
                    name: account.name,
                    type: account.type,
                    user_ids: account.user_ids,
                    isDefault,
                });
            } else {
                // Reset to defaults for create mode
                setFormData({
                    name: "",
                    type: "payroll",
                    user_ids: defaultFormUserId ? [defaultFormUserId] : [currentUser.id],
                    isDefault: false,
                });
            }
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen, mode, account, currentUser.id, defaultFormUserId, groupUsers]);

    const validate = (): boolean => {
        const newErrors: FormErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = "Il nome è obbligatorio";
        }

        if (formData.user_ids.length === 0) {
            newErrors.user_ids = "Seleziona almeno un utente";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            if (mode === "create") {
                const input: CreateAccountInput = {
                    id: crypto.randomUUID(),
                    name: formData.name.trim(),
                    type: formData.type,
                    user_ids: formData.user_ids,
                    group_id: groupId,
                };

                const result = await createAccountAction(input, formData.isDefault);

                if (result.error || !result.data) {
                    setErrors({ submit: result.error || "Errore durante la creazione" });
                    return;
                }

                onSuccess?.(result.data, "create");
                onOpenChange(false);
            } else {
                if (!account) return;

                const result = await updateAccountAction(
                    account.id,
                    {
                        name: formData.name.trim(),
                        type: formData.type,
                        user_ids: formData.user_ids,
                    },
                    formData.isDefault
                );

                if (result.error || !result.data) {
                    setErrors({ submit: result.error || "Errore durante l'aggiornamento" });
                    return;
                }

                onSuccess?.(result.data, "update");
                onOpenChange(false);
            }
        } catch (error) {
            setErrors({ submit: "Errore imprevisto" });
        } finally {
            setIsSubmitting(false);
        }
    };

    const accountTypes = [
        { value: "payroll", label: "Conto Corrente" },
        { value: "cash", label: "Contanti" },
        { value: "investments", label: "Investimenti" },
        { value: "savings", label: "Risparmio" },
    ];

    return (
        <ModalWrapper
            isOpen={isOpen}
            onOpenChange={onOpenChange}
            title={title}
            description={description}
            maxWidth="md"
            footer={
                <FormActions
                    submitLabel={mode === "edit" ? "Aggiorna" : "Crea"}
                    onSubmit={handleSubmit}
                    onCancel={() => onOpenChange(false)}
                    isSubmitting={isSubmitting}
                />
            }
        >
            <ModalContent className="space-y-4">
                {errors.submit && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive font-medium">
                        {errors.submit}
                    </div>
                )}

                <ModalSection>
                    {/* Account Name */}
                    <FormField label="Nome Account" required error={errors.name}>
                        <Input
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Es. Conto Principale"
                            disabled={isSubmitting}
                        />
                    </FormField>

                    {/* Account Type */}
                    <FormField label="Tipo Account" required error={errors.type}>
                        <FormSelect
                            value={formData.type}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, type: val as Account['type'] }))}
                            options={accountTypes}
                            placeholder="Seleziona tipo"
                        />
                    </FormField>

                    {/* User Selection */}
                    <UserField
                        value={formData.user_ids.length === 1 ? formData.user_ids[0] : ""}
                        onChange={(val) => {
                            // For now assuming single user selection via UserField unless we update UserField to support multi
                            // If UserField only supports single string, we adapt.
                            // If it supports 'all' or logic differently, we need to handle it.
                            // The passed UserField seems to take string.
                            setFormData(prev => ({
                                ...prev,
                                user_ids: [val],
                                // Reset default if user changes or multiple selected (refine logic)
                                isDefault: val !== prev.user_ids[0] ? false : prev.isDefault
                            }));
                        }}
                        users={groupUsers}
                        label="Proprietario"
                        disabled={shouldDisableUserField || isSubmitting}
                    />

                    {/* Default Account Toggle */}
                    {canSetDefault && (
                        <div className="flex items-center space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="isDefault"
                                checked={formData.isDefault}
                                onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                disabled={isSubmitting}
                            />
                            <Label htmlFor="isDefault" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Imposta come conto predefinito
                            </Label>
                        </div>
                    )}
                </ModalSection>
            </ModalContent>
        </ModalWrapper>
    );
}
