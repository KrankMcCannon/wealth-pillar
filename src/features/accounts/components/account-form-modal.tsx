"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { User, Account } from "@/lib/types";
import { createAccountAction, updateAccountAction } from "@/features/accounts/actions/account-actions";
import { ModalWrapper, ModalContent, ModalSection } from "@/src/components/ui/modal-wrapper";
import { FormActions, FormField, FormSelect } from "@/src/components/form";
import { UserField } from "@/src/components/ui/fields";
import { Input } from "@/src/components/ui/input";
import { usePermissions } from "@/hooks";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/src/components/ui";

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
  currentUser: User;
  groupUsers: User[];
  groupId: string;
  selectedUserId?: string;
}

function AccountFormModal({
  isOpen,
  onClose,
  editId,
  currentUser,
  groupUsers,
  groupId,
  selectedUserId
}: AccountFormModalProps) {
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
    watch,
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

  const watchedUserId = watch("user_id");
  const watchedIsDefault = watch("isDefault");
  const watchedType = watch("type");

  // Load account data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      // TODO: Fetch account by editId
      // For now, reset to defaults
      reset({
        name: "",
        type: "payroll",
        user_id: defaultFormUserId || currentUser.id,
        isDefault: false,
      });
    } else if (isOpen && !isEditMode) {
      // Reset to defaults for create mode
      reset({
        name: "",
        type: "payroll",
        user_id: defaultFormUserId || currentUser.id,
        isDefault: false,
      });
    }
  }, [isOpen, isEditMode, editId, defaultFormUserId, currentUser.id, reset]);

  // Handle form submission
  const onSubmit = async (data: AccountFormData) => {
    try {
      if (isEditMode && editId) {
        // Update existing account
        const result = await updateAccountAction(
          editId,
          {
            name: data.name.trim(),
            type: data.type,
            user_ids: [data.user_id],
          },
          data.isDefault || false
        );

        if (result.error) {
          setError("root", { message: result.error });
          return;
        }
      } else {
        // Create new account
        const result = await createAccountAction(
          {
            id: crypto.randomUUID(),
            name: data.name.trim(),
            type: data.type,
            user_ids: [data.user_id],
            group_id: groupId,
          },
          data.isDefault || false
        );

        if (result.error) {
          setError("root", { message: result.error });
          return;
        }
      }

      // Close modal on success
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
    <form className="space-y-4">
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
        <ModalContent className="space-y-4">
          {/* Submit Error Display */}
          {errors.root && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mb-4">
              <p className="text-sm text-destructive font-medium">{errors.root.message}</p>
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
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="isDefault"
                checked={watchedIsDefault}
                onCheckedChange={(checked) => setValue("isDefault", checked as boolean)}
                disabled={isSubmitting}
              />
              <Label
                htmlFor="isDefault"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
