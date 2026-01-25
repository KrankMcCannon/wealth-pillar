"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ModalWrapper, ModalBody, ModalFooter, ModalSection } from "@/components/ui/modal-wrapper";
import { FormActions, FormField, FormSelect } from "@/components/form";
import { DateField } from "@/components/ui/fields";
import { Input } from "@/components/ui/input";
import { createInvestmentAction } from "@/features/investments/actions/investment-actions";
import { transactionStyles } from "@/styles/system";
import { cn } from "@/lib/utils";

// Schema definition
const investmentSchema = z.object({
  name: z.string().min(1, "Il nome è obbligatorio"),
  symbol: z.string().min(1, "Il simbolo è obbligatorio"),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Importo non valido"),
  tax_paid: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Tasse non valide"),
  shares: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Quote non valide"),
  created_at: z.string().min(1, "Data obbligatoria"),
  currency: z.enum(["EUR", "USD"])
});

type InvestmentFormData = z.infer<typeof investmentSchema>;

interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddInvestmentModal({ isOpen, onClose }: AddInvestmentModalProps) {
  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: {
      name: "",
      symbol: "",
      amount: "",
      tax_paid: "0",
      shares: "",
      currency: "EUR",
      created_at: new Date().toISOString().split('T')[0]
    }
  });

  const watchedDate = useWatch({ control, name: "created_at" });
  const watchedCurrency = useWatch({
    control,
    name: "currency"
  });
  const currencyOptions = [
    { value: "EUR", label: "EUR" },
    { value: "USD", label: "USD" }
  ];

  const onSubmit = async (data: InvestmentFormData) => {
    try {
      const res = await createInvestmentAction({
        name: data.name,
        symbol: data.symbol.toUpperCase(),
        amount: Number(data.amount),
        shares_acquired: Number(data.shares),
        currency: data.currency,
        created_at: new Date(data.created_at),
        // Taxes paid for the purchase
        tax_paid: Number(data.tax_paid) || 0,
        // Defaults
        currency_rate: 1,
        net_earn: 0
      });

      if (!res.error) {
        reset();
        onClose();
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title="Aggiungi Investimento"
      description="Inserisci i dettagli del nuovo investimento"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className={cn(transactionStyles.form.container, "flex flex-col h-full")}>
        <ModalBody className={transactionStyles.modal.content}>
          <ModalSection>
            <div className={transactionStyles.form.grid}>
              <FormField label="Nome" required error={errors.name?.message}>
                <Input {...register("name")} placeholder="Es. Apple Inc." />
              </FormField>

              <FormField label="Simbolo" required error={errors.symbol?.message}>
                <Input {...register("symbol")} placeholder="Es. AAPL" />
              </FormField>

              <FormField label="Importo Investito" required error={errors.amount?.message}>
                <Input {...register("amount")} type="number" step="0.01" placeholder="1000.00" />
              </FormField>

              <FormField label="Tasse Pagate" error={errors.tax_paid?.message}>
                <Input {...register("tax_paid")} type="number" step="0.01" placeholder="0.00" />
              </FormField>

              <FormField label="Quote Acquisite" required error={errors.shares?.message}>
                <Input {...register("shares")} type="number" step="0.000001" placeholder="10" />
              </FormField>

              <DateField
                value={watchedDate}
                onChange={(val) => setValue("created_at", val)}
                error={errors.created_at?.message}
                label="Data Acquisto"
                required
              />

              <FormField label="Valuta" required error={errors.currency?.message}>
                <FormSelect
                  value={watchedCurrency}
                  onValueChange={(val) => setValue("currency", val as "EUR" | "USD")}
                  options={currencyOptions}
                />
              </FormField>
            </div>
          </ModalSection>
        </ModalBody>

        <ModalFooter>
          <FormActions
            submitType="submit"
            submitLabel="Salva"
            onCancel={onClose}
            isSubmitting={isSubmitting}
            className="w-full sm:w-auto"
          />
        </ModalFooter>
      </form>
    </ModalWrapper>
  );
}
