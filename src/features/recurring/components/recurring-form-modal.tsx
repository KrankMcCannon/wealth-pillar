"use client";

import { useEffect, useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RecurringTransactionSeries, TransactionFrequencyType } from "@/lib/types";
import { getTempId } from "@/lib/utils/temp-id";
import {
  createRecurringSeriesAction,
  updateRecurringSeriesAction,
} from "@/features/recurring/actions/recurring-actions";
import { ModalWrapper, ModalContent, ModalSection } from "@/components/ui/modal-wrapper";
import { FormActions, FormField, FormSelect, MultiUserSelect } from "@/components/form";
import {
  AccountField,
  AmountField,
  CategoryField,
  DateField,
  Input,
} from "@/components/ui";
import { todayDateString } from "@/lib/utils/date-utils";
import { useRequiredCurrentUser, useRequiredGroupUsers, useRequiredGroupId } from "@/hooks";
import { useAccounts, useCategories } from "@/stores/reference-data-store";
import { useUserFilterStore } from "@/stores/user-filter-store";
import { usePageDataStore } from "@/stores/page-data-store";
import { recurringStyles } from "../theme/recurring-styles";

// Zod schema for recurring series validation
const recurringSchema = z.object({
  description: z.string()
    .min(1, "La descrizione è obbligatoria")
    .trim(),
  amount: z.string()
    .min(1, "L'importo è obbligatorio")
    .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, {
      message: "L'importo deve essere maggiore di zero"
    }),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "La categoria è obbligatoria"),
  frequency: z.enum(["once", "weekly", "biweekly", "monthly", "yearly"]),
  user_ids: z.array(z.string()).min(1, "Almeno un utente è obbligatorio"),
  account_id: z.string().min(1, "Il conto è obbligatorio"),
  start_date: z.string().min(1, "La data di inizio è obbligatoria"),
  end_date: z.string().optional(),
  due_day: z.string()
    .min(1, "Il giorno di addebito è obbligatorio")
    .refine((val) => {
      const num = Number.parseInt(val, 10);
      return !Number.isNaN(num) && num >= 1 && num <= 31;
    }, {
      message: "Il giorno deve essere tra 1 e 31"
    }),
}).refine((data) => {
  // Validate end_date if provided
  if (data.end_date && data.start_date) {
    return new Date(data.end_date) > new Date(data.start_date);
  }
  return true;
}, {
  message: "La data di fine deve essere successiva alla data di inizio",
  path: ["end_date"]
});

type RecurringFormData = z.infer<typeof recurringSchema>;

interface RecurringFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function RecurringFormModal({
  isOpen,
  onClose,
  editId,
}: Readonly<RecurringFormModalProps>) {
  // Read from stores instead of props
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const accounts = useAccounts();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const selectedUserId = useUserFilterStore(state => state.selectedUserId);

  // Page data store actions for optimistic updates
  const storeRecurringSeries = usePageDataStore((state) => state.recurringSeries);
  const addRecurringSeries = usePageDataStore((state) => state.addRecurringSeries);
  const updateRecurringSeries = usePageDataStore((state) => state.updateRecurringSeries);
  const removeRecurringSeries = usePageDataStore((state) => state.removeRecurringSeries);

  const isEditMode = !!editId;
  const title = isEditMode ? "Modifica Serie Ricorrente" : "Nuova Serie Ricorrente";
  const description = isEditMode ? "Aggiorna la serie ricorrente" : "Configura una nuova serie ricorrente";

  const today = todayDateString();

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      description: "",
      amount: "",
      type: "expense",
      category: "",
      frequency: "monthly",
      user_ids: selectedUserId ? [selectedUserId] : [currentUser.id],
      account_id: "",
      start_date: today,
      end_date: "",
      due_day: "1",
    }
  });

  const watchedType = useWatch({ control, name: "type" });
  const watchedFrequency = useWatch({ control, name: "frequency" });
  const watchedUserIds = useWatch({ control, name: "user_ids" });
  const watchedAccountId = useWatch({ control, name: "account_id" });
  const watchedCategory = useWatch({ control, name: "category" });
  const watchedAmount = useWatch({ control, name: "amount" });
  const watchedStartDate = useWatch({ control, name: "start_date" });
  const watchedEndDate = useWatch({ control, name: "end_date" });

  // Filter accounts: show accounts accessible by ALL selected users (intersection)
  const filteredAccounts = useMemo(() => {
    if (!watchedUserIds || watchedUserIds.length === 0) return accounts;

    // Filter: accounts accessible by ALL selected users
    const filtered = accounts.filter((acc) =>
      watchedUserIds.every((userId) => acc.user_ids.includes(userId))
    );

    // Sort: currentUser's accounts first
    return filtered.sort((a, b) => {
      const aHasCurrentUser = a.user_ids.includes(currentUser.id);
      const bHasCurrentUser = b.user_ids.includes(currentUser.id);
      if (aHasCurrentUser && !bHasCurrentUser) return -1;
      if (!aHasCurrentUser && bHasCurrentUser) return 1;
      return 0;
    });
  }, [accounts, watchedUserIds, currentUser.id]);

  // Calculate default account to prepopulate
  const defaultAccountId = useMemo(() => {
    if (!watchedUserIds || watchedUserIds.length === 0 || filteredAccounts.length === 0) {
      return "";
    }

    // ONLY 1 USER: Use their default account
    if (watchedUserIds.length === 1) {
      const selectedUser = groupUsers.find((u) => u.id === watchedUserIds[0]);

      if (selectedUser?.default_account_id) {
        const defaultAcc = filteredAccounts.find((acc) => acc.id === selectedUser.default_account_id);
        if (defaultAcc) {
          return defaultAcc.id;
        }
      }

      // Fallback: first available account for that user
      return filteredAccounts[0].id;
    }

    // Multiple users: first shared account
    if (filteredAccounts.length > 0) {
      return filteredAccounts[0].id;
    }

    // Fallback: creator's default
    const creator = groupUsers.find((u) => u.id === currentUser.id);
    if (creator?.default_account_id) {
      const creatorDefaultAcc = accounts.find((acc) => acc.id === creator.default_account_id);
      if (creatorDefaultAcc) {
        return creatorDefaultAcc.id;
      }
    }

    // Last fallback: first available account
    return accounts.length > 0 ? accounts[0].id : "";
  }, [watchedUserIds, filteredAccounts, accounts, currentUser.id, groupUsers]);

  // Load recurring series data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      // Find series in store
      const series = storeRecurringSeries.find((s) => s.id === editId);

      if (series) {
        // Handle date formatting
        const startDateStr = typeof series.start_date === "string"
          ? series.start_date.split("T")[0]
          : (series.start_date).toISOString().split("T")[0];

        const endDateStr = series.end_date
          ? (typeof series.end_date === "string"
            ? series.end_date.split("T")[0]
            : (series.end_date).toISOString().split("T")[0])
          : "";

        reset({
          description: series.description,
          amount: series.amount.toString(),
          type: series.type === "transfer" ? "expense" : series.type,
          category: series.category,
          frequency: series.frequency,
          user_ids: series.user_ids,
          account_id: series.account_id,
          start_date: startDateStr,
          end_date: endDateStr,
          due_day: series.due_day.toString(),
        });
      }
    } else if (isOpen && !isEditMode) {
      // Reset to defaults for create mode
      reset({
        description: "",
        amount: "",
        type: "expense",
        category: "",
        frequency: "monthly",
        user_ids: selectedUserId ? [selectedUserId] : [currentUser.id],
        account_id: "",
        start_date: today,
        end_date: "",
        due_day: "1",
      });
    }
  }, [isOpen, isEditMode, editId, selectedUserId, currentUser.id, reset, today, storeRecurringSeries]);

  // Prepopulate account when users change
  useEffect(() => {
    if (!isOpen || !defaultAccountId) return;

    // Update account when users change
    if (defaultAccountId !== watchedAccountId) {
      setValue("account_id", defaultAccountId);
    }
  }, [isOpen, watchedUserIds, defaultAccountId, watchedAccountId, setValue]);

  // Handle form submission with optimistic updates
  const onSubmit = async (data: RecurringFormData) => {
    try {
      const amount = Number.parseFloat(data.amount);
      const dueDay = Number.parseInt(data.due_day, 10);

      const seriesData = {
        description: data.description.trim(),
        amount,
        type: data.type,
        category: data.category,
        frequency: data.frequency as TransactionFrequencyType,
        account_id: data.account_id,
        start_date: data.start_date,
        end_date: data.end_date || null,
        due_day: dueDay,
        user_ids: data.user_ids,
        group_id: groupId,
      };

      if (isEditMode && editId) {
        // UPDATE: Optimistic update pattern
        // 1. Store original series for revert
        const originalSeries = storeRecurringSeries.find((s) => s.id === editId);
        if (!originalSeries) {
          setError("root", { message: "Serie ricorrente non trovata" });
          return;
        }

        // 2. Update in store immediately (optimistic)
        updateRecurringSeries(editId, seriesData);

        // 3. Call server action
        const result = await updateRecurringSeriesAction({
          id: editId,
          ...seriesData,
        });

        if (result.error) {
          // 4. Revert on error
          updateRecurringSeries(editId, originalSeries);
          setError("root", { message: result.error });
          return;
        }

        // 5. Success - update with real data from server
        if (result.data) {
          updateRecurringSeries(editId, result.data);
        }
      } else {
        // CREATE: Optimistic add pattern
        // 1. Create temporary ID
        const tempId = getTempId("temp-recurring");
        const now = new Date().toISOString();
        const optimisticSeries: RecurringTransactionSeries = {
          id: tempId,
          created_at: now,
          updated_at: now,
          is_active: true,
          total_executions: 0,
          ...seriesData,
        };

        // 2. Add to store immediately (optimistic)
        addRecurringSeries(optimisticSeries);

        // 3. Close modal immediately for better UX
        onClose();

        // 4. Call server action in background
        const result = await createRecurringSeriesAction(seriesData);

        if (result.error) {
          // 5. Remove optimistic series on error
          removeRecurringSeries(tempId);
          console.error("Failed to create recurring series:", result.error);
          return;
        }

        // 6. Replace temporary with real series from server
        removeRecurringSeries(tempId);
        if (result.data) {
          addRecurringSeries(result.data);
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

  return (
    <form className={recurringStyles.formModal.form}>
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onClose}
        title={title}
        description={description}
        maxWidth="md"
        footer={
          <FormActions
            submitType="button"
            submitLabel={isEditMode ? "Salva Modifiche" : "Crea Serie"}
            onSubmit={handleSubmit(onSubmit)}
            onCancel={onClose}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ModalContent className={recurringStyles.formModal.content}>
          {/* Submit Error Display */}
          {errors.root && (
            <div className={recurringStyles.formModal.error}>
              {errors.root.message}
            </div>
          )}

          <ModalSection className={recurringStyles.formModal.section}>
            <div className={recurringStyles.formModal.grid}>
              {/* Type */}
              <FormField label="Tipo" required error={errors.type?.message}>
                <FormSelect
                  value={watchedType}
                  onValueChange={(value) => setValue("type", value as "income" | "expense")}
                  options={[
                    { value: "expense", label: "Uscita" },
                    { value: "income", label: "Entrata" },
                  ]}
                />
              </FormField>

              {/* Frequency */}
              <FormField label="Frequenza" required error={errors.frequency?.message}>
                <FormSelect
                  value={watchedFrequency}
                  onValueChange={(value) => setValue("frequency", value as TransactionFrequencyType)}
                  options={[
                    { value: "weekly", label: "Settimanale" },
                    { value: "biweekly", label: "Quindicinale" },
                    { value: "monthly", label: "Mensile" },
                    { value: "yearly", label: "Annuale" },
                  ]}
                />
              </FormField>
            </div>
          </ModalSection>

          <ModalSection className={recurringStyles.formModal.section}>
            {/* Users - Multi-select (full width) */}
            <FormField label="Utenti" required error={errors.user_ids?.message}>
              <MultiUserSelect
                value={watchedUserIds}
                onChange={(value) => setValue("user_ids", value)}
                users={groupUsers}
                currentUserId={currentUser.id}
              />
            </FormField>
          </ModalSection>

          <ModalSection className={recurringStyles.formModal.section}>
            <div className={recurringStyles.formModal.grid}>
              {/* Account */}
              <AccountField
                value={watchedAccountId}
                onChange={(value) => setValue("account_id", value)}
                error={errors.account_id?.message}
                accounts={filteredAccounts}
                label="Conto"
                placeholder="Seleziona conto"
                required
              />

              {/* Category */}
              <CategoryField
                value={watchedCategory}
                onChange={(value) => setValue("category", value)}
                error={errors.category?.message}
                categories={categories}
                label="Categoria"
                placeholder="Seleziona categoria"
                required
              />

              {/* Amount */}
              <AmountField
                value={Number.parseFloat(watchedAmount || "0")}
                onChange={(value) => setValue("amount", value.toString())}
                error={errors.amount?.message}
                label="Importo"
                placeholder="0,00"
                required
              />

              {/* Due Day */}
              <FormField label="Giorno addebito" required error={errors.due_day?.message}>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  {...register("due_day")}
                  placeholder="1-31"
                  disabled={isSubmitting}
                />
              </FormField>

              {/* Start Date */}
              <DateField
                label="Data inizio"
                value={watchedStartDate}
                onChange={(value) => setValue("start_date", value)}
                error={errors.start_date?.message}
                required
              />

              {/* End Date (optional) */}
              <DateField
                label="Data fine"
                value={watchedEndDate || ""}
                onChange={(value) => setValue("end_date", value)}
                error={errors.end_date?.message}
              />
            </div>
          </ModalSection>

          <ModalSection className={recurringStyles.formModal.section}>
            {/* Description */}
            <FormField label="Descrizione" required error={errors.description?.message}>
              <Input
                {...register("description")}
                placeholder="Es. Abbonamento Netflix"
                disabled={isSubmitting}
              />
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}

// Default export for lazy loading
export default RecurringFormModal;
