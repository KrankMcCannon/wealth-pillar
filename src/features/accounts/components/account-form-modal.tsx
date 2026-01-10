"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Account } from "@/lib/types";
import { getTempId } from "@/lib/utils/temp-id";
import { createAccountAction, updateAccountAction } from "@/features/accounts/actions/account-actions";
import { ModalWrapper, ModalContent, ModalSection } from "@/components/ui/modal-wrapper";
import { FormActions, FormField, FormSelect } from "@/components/form";
import { UserField } from "@/components/ui/fields";
import { Input } from "@/components/ui/input";
import { usePermissions, useRequiredCurrentUser, useRequiredGroupUsers, useRequiredGroupId } from "@/hooks";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui";
import { useAccounts, useReferenceDataStore } from "@/stores/reference-data-store";
import { useUserFilterStore } from "@/stores/user-filter-store";
import { accountStyles } from "../theme/account-styles";

// Zod schema for account validation
const accountSchema = z.object({
  name: z.string()
    .min(1, "Il nome è obbligatorio")
    .trim(),
  type: z.enum(["payroll", "cash", "investments", "savings"]),
  user_id: z.string().min(1, "L'utente è obbligatorio"),
  isDefault: z.boolean().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function AccountFormModal({
  isOpen,
  onClose,
  editId,
}: Readonly<AccountFormModalProps>) {
  // Read from stores instead of props
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const groupId = useRequiredGroupId();
  const selectedUserId = useUserFilterStore(state => state.selectedUserId);

  // Reference data store actions for optimistic updates
  const storeAccounts = useAccounts();
  const addAccount = useReferenceDataStore((state) => state.addAccount);
  const updateAccount = useReferenceDataStore((state) => state.updateAccount);
  const removeAccount = useReferenceDataStore((state) => state.removeAccount);

  const isEditMode = !!editId;
  const title = isEditMode ? "Modifica account" : "Nuovo account";
  const description = isEditMode ? "Aggiorna i dettagli dell'account" : "Aggiungi un nuovo account bancario o di cassa";

  // Permission checks
  const { shouldDisableUserField, defaultFormUserId } = usePermissions({
    currentUser,
    selectedUserId,
  });

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: "",
      type: "payroll",
      user_id: defaultFormUserId || currentUser.id,
      isDefault: false,
    }
  });

  const watchedUserId = useWatch({ control, name: "user_id" });
  const watchedIsDefault = useWatch({ control, name: "isDefault" });
  const watchedType = useWatch({ control, name: "type" });

  // Load account data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      // Find account in store
      const account = storeAccounts.find((acc) => acc.id === editId);

      if (account) {
        // Check if this is the user's default account
        const isDefault = currentUser.default_account_id === account.id;

        reset({
          name: account.name,
          type: account.type,
          user_id: account.user_ids[0] || currentUser.id,
          isDefault,
        });
      }
    } else if (isOpen && !isEditMode) {
      // Reset to defaults for create mode
      reset({
        name: "",
        type: "payroll",
        user_id: defaultFormUserId || currentUser.id,
        isDefault: false,
      });
    }
  }, [isOpen, isEditMode, editId, defaultFormUserId, currentUser, reset, storeAccounts]);

  // Handle form submission with optimistic updates
  const onSubmit = async (data: AccountFormData) => {
    try {
      const accountData = {
        name: data.name.trim(),
        type: data.type,
        user_ids: [data.user_id],
      };

      if (isEditMode && editId) {
        // UPDATE: Optimistic update pattern
        // 1. Store original account for revert
        const originalAccount = storeAccounts.find((acc) => acc.id === editId);
        if (!originalAccount) {
          setError("root", { message: "Account non trovato" });
          return;
        }

        // 2. Update in store immediately (optimistic)
        updateAccount(editId, accountData);

        // 3. Call server action
        const result = await updateAccountAction(
          editId,
          accountData,
          data.isDefault || false
        );

        if (result.error) {
          // 4. Revert on error
          updateAccount(editId, originalAccount);
          setError("root", { message: result.error });
          return;
        }

        // 5. Success - update with real data from server
        if (result.data) {
          updateAccount(editId, result.data);
        }
      } else {
        // CREATE: Optimistic add pattern
        // 1. Create temporary ID
        const tempId = getTempId("temp-account");
        const now = new Date().toISOString();
        const optimisticAccount: Account = {
          id: tempId,
          created_at: now,
          updated_at: now,
          ...accountData,
          group_id: groupId,
        };

        // 2. Add to store immediately (optimistic)
        addAccount(optimisticAccount);

        // 3. Close modal immediately for better UX
        onClose();

        // 4. Call server action in background
        const result = await createAccountAction(
          {
            id: crypto.randomUUID(),
            ...accountData,
            group_id: groupId,
          },
          data.isDefault || false
        );

        if (result.error) {
          // 5. Remove optimistic account on error
          removeAccount(tempId);
          console.error("Failed to create account:", result.error);
          return;
        }

        // 6. Replace temporary with real account from server
        removeAccount(tempId);
        if (result.data) {
          addAccount(result.data);
        }
        return; // Early return since modal already closed
      }

      // Close modal on success (for update mode)
      onClose();
    } catch (error) {
      setError("root", {
        message: error instanceof Error ? error.message : "Errore sconosciuto"
      });
    }
  };

  // Account type options
  const accountTypes = [
    { value: "payroll", label: "Conto Corrente" },
    { value: "cash", label: "Contanti" },
    { value: "investments", label: "Investimenti" },
    { value: "savings", label: "Risparmio" },
  ];

  return (
    <form className={accountStyles.formModal.form}>
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onClose}
        title={title}
        description={description}
        maxWidth="md"
        footer={
          <FormActions
            submitType="button"
            submitLabel={isEditMode ? "Aggiorna" : "Crea"}
            onSubmit={handleSubmit(onSubmit)}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ModalContent className={accountStyles.formModal.content}>
          {/* Submit Error Display */}
          {errors.root && (
            <div className={accountStyles.formModal.error}>
              <p className={accountStyles.formModal.errorText}>{errors.root.message}</p>
            </div>
          )}

          <ModalSection>
            {/* Account Name */}
            <FormField label="Nome Account" required error={errors.name?.message}>
              <Input
                {...register("name")}
                placeholder="Es. Conto Principale"
                disabled={isSubmitting}
              />
            </FormField>

            {/* Account Type */}
            <FormField label="Tipo Account" required error={errors.type?.message}>
              <FormSelect
                value={watchedType}
                onValueChange={(val) => setValue("type", val as Account['type'])}
                options={accountTypes}
                placeholder="Seleziona tipo"
              />
            </FormField>

            {/* User Selection */}
            <UserField
              value={watchedUserId}
              onChange={(val) => setValue("user_id", val)}
              error={errors.user_id?.message}
              users={groupUsers}
              label="Proprietario"
              placeholder="Seleziona proprietario"
              disabled={shouldDisableUserField || isSubmitting}
              required
            />

            {/* Set as Default */}
            <div className={accountStyles.formModal.checkboxRow}>
              <Checkbox
                id="isDefault"
                checked={watchedIsDefault}
                onCheckedChange={(checked) => setValue("isDefault", checked as boolean)}
                disabled={isSubmitting}
              />
              <Label
                htmlFor="isDefault"
                className={accountStyles.formModal.checkboxLabel}
              >
                Imposta come account predefinito per questo utente
              </Label>
            </div>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}

// Default export for lazy loading
export default AccountFormModal;
