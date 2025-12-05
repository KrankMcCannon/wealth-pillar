"use client";

/**
 * RecurringSeriesForm - Form for creating/editing recurring transaction series
 * 
 * Handles form state management, validation, and submission for recurring series.
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { RecurringTransactionSeries, User, Account, Category, TransactionFrequencyType } from "@/lib/types";
import {
  createRecurringSeriesAction,
  updateRecurringSeriesAction,
} from "@/features/recurring/actions/recurring-actions";
import {
  FormActions,
  FormField,
  FormSelect,
} from "@/src/components/form";
import {
  AccountField,
  AmountField,
  CategoryField,
  DateField,
  Input,
  ModalContent,
  ModalSection,
  ModalWrapper,
} from "@/src/components/ui";
import { todayDateString, toDateString, toDateTime } from "@/lib/utils/date-utils";

type Mode = "create" | "edit";

interface RecurringSeriesFormProps {
  readonly isOpen: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly currentUser: User;
  readonly groupUsers: User[];
  readonly accounts: Account[];
  readonly categories: Category[];
  readonly selectedUserId?: string;
  readonly series?: RecurringTransactionSeries;
  readonly mode?: Mode;
  readonly onSuccess?: (series: RecurringTransactionSeries, action: "create" | "update") => void;
}

interface FormData {
  description: string;
  amount: string;
  type: "income" | "expense";
  category: string;
  frequency: TransactionFrequencyType;
  user_id: string;
  account_id: string;
  start_date: string;
  end_date: string;
  due_day: string; // Giorno del mese (1-31) come stringa per il form
}

interface FormErrors {
  description?: string;
  amount?: string;
  type?: string;
  category?: string;
  frequency?: string;
  user_id?: string;
  account_id?: string;
  start_date?: string;
  end_date?: string;
  due_day?: string;
  submit?: string;
}

export function RecurringSeriesForm({
  isOpen,
  onOpenChange,
  currentUser,
  groupUsers,
  accounts,
  categories,
  selectedUserId,
  series,
  mode = "create",
  onSuccess,
}: RecurringSeriesFormProps) {
  const title = mode === "edit" ? "Modifica Serie Ricorrente" : "Nuova Serie Ricorrente";
  const description = mode === "edit" ? "Aggiorna la serie ricorrente" : "Configura una nuova serie ricorrente";

  // Get today's date in YYYY-MM-DD format using Luxon
  const today = todayDateString();

  // Initialize form data
  const [formData, setFormData] = useState<FormData>({
    description: "",
    amount: "",
    type: "expense",
    category: "",
    frequency: "monthly",
    user_id: selectedUserId ?? currentUser.id,
    account_id: "",
    start_date: today,
    end_date: "",
    due_day: "1", // Default: primo del mese
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter accounts by selected user
  const filteredAccounts = useMemo(() => {
    if (!formData.user_id) return accounts;
    return accounts.filter((acc) => acc.user_ids.includes(formData.user_id));
  }, [accounts, formData.user_id]);

  // Get default account for selected user (same logic as TransactionForm)
  const getDefaultAccountId = useCallback(
    (userId: string): string => {
      if (!userId) {
        return accounts.length > 0 ? accounts[0].id : "";
      }

      // Find user and use their default account
      const user = groupUsers.find((u) => u.id === userId);
      if (user?.default_account_id) {
        // Verify the default account is accessible to this user
        const defaultAccount = accounts.find(
          (acc) => acc.id === user.default_account_id && acc.user_ids.includes(userId)
        );
        if (defaultAccount) return defaultAccount.id;
      }

      // Fall back to first account accessible to this user
      const userAccounts = accounts.filter((acc) => acc.user_ids.includes(userId));
      if (userAccounts.length > 0) {
        return userAccounts[0].id;
      }
      
      return accounts.length > 0 ? accounts[0].id : "";
    },
    [accounts, groupUsers]
  );

  // Reset form when modal opens or mode/series changes
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && series) {
        // Format dates to strings using Luxon
        const formatDateToString = (date: string | Date | undefined | null): string => {
          if (!date) return "";
          const dt = toDateTime(date);
          return dt ? toDateString(dt) : "";
        };

        setFormData({
          description: series.description,
          amount: series.amount.toString(),
          type: series.type === "income" ? "income" : "expense",
          category: series.category,
          frequency: series.frequency,
          user_id: series.user_id,
          account_id: series.account_id,
          start_date: formatDateToString(series.start_date),
          end_date: formatDateToString(series.end_date),
          due_day: series.due_day.toString(),
        });
      } else {
        // Create mode - reset form with defaults
        const userId = selectedUserId ?? currentUser.id;
        setFormData({
          description: "",
          amount: "",
          type: "expense",
          category: "",
          frequency: "monthly",
          user_id: userId,
          account_id: getDefaultAccountId(userId),
          start_date: today,
          end_date: "",
          due_day: "1", // Default: primo del mese
        });
      }
      setErrors({});
    }
  }, [isOpen, mode, series, currentUser.id, selectedUserId, getDefaultAccountId, today]);

  // Update account when user changes
  useEffect(() => {
    if (mode === "create" && formData.user_id) {
      setFormData((prev) => ({
        ...prev,
        account_id: getDefaultAccountId(formData.user_id),
      }));
    }
  }, [formData.user_id, getDefaultAccountId, mode]);

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.description.trim()) {
      newErrors.description = "La descrizione è obbligatoria";
    }

    const amount = Number.parseFloat(formData.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      newErrors.amount = "L'importo deve essere maggiore di zero";
    }

    if (!formData.category) {
      newErrors.category = "La categoria è obbligatoria";
    }

    if (!formData.user_id) {
      newErrors.user_id = "L'utente è obbligatorio";
    }

    if (!formData.account_id) {
      newErrors.account_id = "Il conto è obbligatorio";
    }

    if (!formData.start_date) {
      newErrors.start_date = "La data di inizio è obbligatoria";
    }

    if (formData.due_day) {
      const dueDay = Number.parseInt(formData.due_day, 10);
      if (Number.isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
        newErrors.due_day = "Il giorno deve essere tra 1 e 31";
      }
    } else {
      newErrors.due_day = "Il giorno di addebito è obbligatorio";
    }

    // Validate end_date if provided
    if (formData.end_date && formData.start_date) {
      if (new Date(formData.end_date) <= new Date(formData.start_date)) {
        newErrors.end_date = "La data di fine deve essere successiva alla data di inizio";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle field changes
  const handleFieldChange = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when field changes
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Process submission result
  const processResult = (
    result: { data: RecurringTransactionSeries | null; error: string | null },
    action: "create" | "update"
  ) => {
    if (result.error) {
      setErrors({ submit: result.error });
      return;
    }
    if (result.data) {
      onSuccess?.(result.data, action);
      onOpenChange(false);
    }
  };

  // Handle submit
  const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault?.();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setErrors({});

    try {
      const amount = Number.parseFloat(formData.amount);
      const dueDay = Number.parseInt(formData.due_day, 10);
      const baseInput = {
        description: formData.description.trim(),
        amount,
        type: formData.type,
        category: formData.category,
        frequency: formData.frequency,
        account_id: formData.account_id,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        due_day: dueDay,
      };

      if (mode === "edit" && series) {
        const result = await updateRecurringSeriesAction({ id: series.id, ...baseInput });
        processResult(result, "update");
      } else {
        const result = await createRecurringSeriesAction({ ...baseInput, user_id: formData.user_id });
        processResult(result, "create");
      }
    } catch (error) {
      console.error("[RecurringSeriesForm] Submit error:", error);
      setErrors({
        submit: error instanceof Error ? error.message : "Errore durante il salvataggio",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        title={title}
        description={description}
        maxWidth="md"
        footer={
          <FormActions
            submitType="button"
            submitLabel={mode === "edit" ? "Salva Modifiche" : "Crea Serie"}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            isSubmitting={isSubmitting}
          />
        }
      >
        <ModalContent>
          {/* Error message */}
          {errors.submit && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">{errors.submit}</p>
            </div>
          )}

          <ModalSection>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Tipo */}
              <FormField label="Tipo" required error={errors.type}>
                <FormSelect
                  value={formData.type}
                  onValueChange={(value) => handleFieldChange("type", value as "income" | "expense")}
                  options={[
                    { value: "expense", label: "Uscita" },
                    { value: "income", label: "Entrata" },
                  ]}
                />
              </FormField>

              {/* Frequenza */}
              <FormField label="Frequenza" required error={errors.frequency}>
                <FormSelect
                  value={formData.frequency}
                  onValueChange={(value) => handleFieldChange("frequency", value as TransactionFrequencyType)}
                  options={[
                    { value: "weekly", label: "Settimanale" },
                    { value: "biweekly", label: "Quindicinale" },
                    { value: "monthly", label: "Mensile" },
                    { value: "yearly", label: "Annuale" },
                  ]}
                />
              </FormField>

              {/* Conto */}
              <AccountField
                value={formData.account_id}
                onChange={(value) => handleFieldChange("account_id", value)}
                error={errors.account_id}
                accounts={filteredAccounts}
                required
              />

              {/* Categoria */}
              <CategoryField
                value={formData.category}
                onChange={(value) => handleFieldChange("category", value)}
                error={errors.category}
                categories={categories}
                required
              />

              {/* Importo */}
              <AmountField
                value={formData.amount}
                onChange={(value) => handleFieldChange("amount", value)}
                error={errors.amount}
                required
              />

              {/* Giorno addebito */}
              <FormField label="Giorno addebito" required error={errors.due_day}>
                <Input
                  type="number"
                  min={1}
                  max={31}
                  value={formData.due_day}
                  onChange={(e) => handleFieldChange("due_day", e.target.value)}
                  placeholder="1-31"
                />
              </FormField>

              {/* Data inizio */}
              <DateField
                label="Data inizio"
                value={formData.start_date}
                onChange={(value) => handleFieldChange("start_date", value)}
                error={errors.start_date}
                required
              />

              {/* Data fine (opzionale) */}
              <DateField
                label="Data fine"
                value={formData.end_date}
                onChange={(value) => handleFieldChange("end_date", value)}
                error={errors.end_date}
              />
            </div>
          </ModalSection>

          <ModalSection>
            {/* Descrizione */}
            <FormField label="Descrizione" required error={errors.description}>
              <Input
                value={formData.description}
                onChange={(e) => handleFieldChange("description", e.target.value)}
                placeholder="Es. Abbonamento Netflix"
              />
            </FormField>
          </ModalSection>
        </ModalContent>
      </ModalWrapper>
    </form>
  );
}
