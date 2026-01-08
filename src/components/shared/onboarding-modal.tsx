"use client";

import { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  HelpCircle,
  Loader2,
  PlusCircle,
  Star,
  Target,
  Trash2,
  Wallet,
} from "lucide-react";
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui";
import type { Category, BudgetType } from "@/lib/types";
import { AccountTypeMap } from "@/lib/types";
import type { OnboardingPayload } from "@/features/onboarding/types";
import { onboardingStyles } from "@/features/onboarding/styles";

interface OnboardingModalProps {
  categories: Category[];
  onComplete: (data: OnboardingPayload) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  categoriesLoading?: boolean;
}

interface AccountFormState {
  name: string;
  type: keyof typeof AccountTypeMap;
  isDefault?: boolean;
}

interface BudgetFormState {
  description: string;
  amount: string;
  type: BudgetType;
  categoryId: string;
}

interface OnboardingDraft {
  currentStep: number;
  groupName: string;
  groupDescription: string;
  budgetStartDay: number;
  accounts: AccountFormState[];
  budgets: BudgetFormState[];
}

// Account type descriptions for tooltips
const accountTypeDescriptions: Record<keyof typeof AccountTypeMap, string> = {
  payroll: "Conto principale dove ricevi lo stipendio o pensione",
  savings: "Conto dedicato al risparmio a lungo termine",
  cash: "Denaro contante fisico o fondo cassa",
  investments: "Conto per investimenti, trading e portafoglio",
};

// LocalStorage key for draft
const ONBOARDING_DRAFT_KEY = "onboarding-draft";

// Helper to save draft to localStorage
const saveDraft = (draft: OnboardingDraft) => {
  try {
    localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.error("Failed to save onboarding draft:", err);
  }
};

// Helper to load draft from localStorage
const loadDraft = (): OnboardingDraft | null => {
  try {
    const saved = localStorage.getItem(ONBOARDING_DRAFT_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.error("Failed to load onboarding draft:", err);
    return null;
  }
};

// Helper to clear draft from localStorage
const clearDraft = () => {
  try {
    localStorage.removeItem(ONBOARDING_DRAFT_KEY);
  } catch (err) {
    console.error("Failed to clear onboarding draft:", err);
  }
};

const steps = [
  {
    id: "group",
    title: "Crea il gruppo",
    description: "Dai un nome al tuo spazio condiviso",
    icon: Building2,
  },
  {
    id: "accounts",
    title: "Configura i conti",
    description: "Aggiungi uno o più conti bancari",
    icon: Wallet,
  },
  {
    id: "budgets",
    title: "Definisci i budget",
    description: "Imposta gli obiettivi di spesa",
    icon: Target,
  },
] as const;

export default function OnboardingModal({
  categories,
  onComplete,
  loading = false,
  error = null,
  categoriesLoading = false,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [budgetStartDay, setBudgetStartDay] = useState<number>(1);
  const [accounts, setAccounts] = useState<AccountFormState[]>([{ name: "", type: "payroll", isDefault: true }]);
  const [budgets, setBudgets] = useState<BudgetFormState[]>([
    { description: "", amount: "", type: "monthly", categoryId: "" },
  ]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showDraftRestore, setShowDraftRestore] = useState(false);

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setShowDraftRestore(true);
    }
  }, []);

  // Auto-save draft whenever state changes (debounced)
  useEffect(() => {
    const timeout = setTimeout(() => {
      saveDraft({
        currentStep,
        groupName,
        groupDescription,
        budgetStartDay,
        accounts,
        budgets,
      });
    }, 1000); // Debounce by 1 second

    return () => clearTimeout(timeout);
  }, [currentStep, groupName, groupDescription, budgetStartDay, accounts, budgets]);

  // Restore draft
  const restoreDraft = () => {
    const draft = loadDraft();
    if (draft) {
      setCurrentStep(draft.currentStep);
      setGroupName(draft.groupName);
      setGroupDescription(draft.groupDescription);
      setBudgetStartDay(draft.budgetStartDay);
      setAccounts(draft.accounts);
      setBudgets(draft.budgets);
      setShowDraftRestore(false);
    }
  };

  // Dismiss draft restore prompt
  const dismissDraftRestore = () => {
    clearDraft();
    setShowDraftRestore(false);
  };

  const canProceed = useMemo(() => {
    if (currentStep === 0) {
      return groupName.trim().length > 1;
    }

    if (currentStep === 1) {
      return accounts.every((account) => account.name.trim() && account.type);
    }

    // Budget step: Allow proceeding if at least one budget is valid OR if budgets array is empty (skipped)
    if (currentStep === 2) {
      return budgets.length === 0 || budgets.every((budget) => {
        const amount = parseFloat(budget.amount);
        return budget.description.trim().length > 1 && !isNaN(amount) && amount > 0 && Boolean(budget.categoryId);
      });
    }

    return true;
  }, [currentStep, groupName, accounts, budgets]);

  const accountTypeOptions = useMemo(
    () =>
      Object.entries(AccountTypeMap).map(([value, label]) => ({
        value,
        label,
      })),
    []
  );

  const budgetTypeOptions: { value: BudgetType; label: string }[] = [
    { value: "monthly", label: "Mensile" },
    { value: "annually", label: "Annuale" },
  ];

  const fallbackCategoryOptions = useMemo(
    () => [
      { value: "spesa", label: "Spesa" },
      { value: "bolletta_luce", label: "Bolletta luce" },
      { value: "altro", label: "Altro" },
    ],
    []
  );

  const categoryOptions = categories.length
    ? categories.map((category) => ({ value: category.id, label: category.label }))
    : fallbackCategoryOptions;

  const handleNext = () => {
    if (!canProceed) {
      setLocalError("Completa i campi obbligatori per continuare");
      return;
    }
    setLocalError(null);
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setLocalError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!canProceed) {
      setLocalError("Verifica di aver compilato tutti i campi");
      return;
    }

    try {
      await onComplete({
        group: {
          name: groupName.trim(),
          description: groupDescription.trim(),
        },
        accounts: accounts.map((account) => ({
          name: account.name.trim(),
          type: account.type,
          isDefault: account.isDefault || false,
        })),
        budgets: budgets.map((budget) => ({
          description: budget.description.trim(),
          amount: parseFloat(budget.amount),
          type: budget.type,
          categories: [budget.categoryId],
        })),
        budgetStartDay: budgetStartDay,
      });

      // Clear draft on successful completion
      clearDraft();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Errore durante il salvataggio. Riprova tra poco.");
    }
  };

  // Skip budgets step
  const handleSkipBudgets = () => {
    setBudgets([]);
    setLocalError(null);
  };

  const renderGroupStep = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="groupName" className={onboardingStyles.primaryLabel}>
          Nome del gruppo
        </Label>
        <Input
          id="groupName"
          type="text"
          placeholder="Esempio: Famiglia Rossi"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
          disabled={loading}
          className={onboardingStyles.input}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="groupDescription" className={onboardingStyles.primaryLabel}>
          Descrizione (opzionale)
        </Label>
        <Input
          id="groupDescription"
          type="text"
          placeholder="Chi fa parte di questo gruppo?"
          value={groupDescription}
          onChange={(e) => setGroupDescription(e.target.value)}
          disabled={loading}
          className={onboardingStyles.input}
        />
      </div>
    </div>
  );

  const updateAccountField = (index: number, field: keyof AccountFormState, value: string) => {
    setAccounts((prev) => prev.map((account, idx) => (idx === index ? { ...account, [field]: value } : account)));
  };

  const setAccountAsDefault = (index: number) => {
    setAccounts((prev) =>
      prev.map((account, idx) => ({
        ...account,
        isDefault: idx === index,
      }))
    );
  };

  const addAccount = () => {
    setAccounts((prev) => [...prev, { name: "", type: "payroll", isDefault: false }]);
  };

  const removeAccount = (index: number) => {
    setAccounts((prev) => {
      const updated = prev.filter((_, idx) => idx !== index);

      // If removed account was default, make first account default
      if (prev[index].isDefault && updated.length > 0) {
        updated[0].isDefault = true;
      }

      return updated;
    });
  };

  const renderAccountsStep = () => (
    <div className="space-y-4">
      {/* Info banner - only if multiple accounts */}
      {accounts.length > 1 && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 mb-4">
          <Label className={onboardingStyles.label}>Conto Predefinito</Label>
          <p className="text-xs text-primary/70 mt-1">
            Seleziona quale conto vuoi usare come predefinito per le transazioni
          </p>
        </div>
      )}

      {accounts.map((account, index) => (
        <div key={`account-${index}`} className={onboardingStyles.card}>
          <div className={onboardingStyles.cardHeader}>
            <div className="flex items-center gap-2">
              <p className={onboardingStyles.cardTitle}>Conto {index + 1}</p>

              {/* Star icon for default selection - only if multiple accounts */}
              {accounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setAccountAsDefault(index)}
                  className={`ml-2 p-1 rounded transition-colors ${
                    account.isDefault
                      ? 'text-yellow-500 bg-yellow-50'
                      : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-50'
                  }`}
                  title={account.isDefault ? 'Conto predefinito' : 'Imposta come predefinito'}
                  disabled={loading}
                >
                  <Star className={`h-4 w-4 ${account.isDefault ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>

            {accounts.length > 1 && (
              <button
                type="button"
                onClick={() => removeAccount(index)}
                className={onboardingStyles.deleteButton}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            <Label className={onboardingStyles.label}>Nome del conto</Label>
            <Input
              value={account.name}
              onChange={(e) => updateAccountField(index, "name", e.target.value)}
              placeholder="Conto corrente principale"
              disabled={loading}
              className={onboardingStyles.input}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label className={onboardingStyles.label}>Tipologia</Label>
              <div className="group relative">
                <HelpCircle className="h-3.5 w-3.5 text-primary/60 cursor-help" />
                <div className="invisible group-hover:visible absolute left-0 top-6 z-50 w-64 rounded-lg bg-primary text-white p-3 text-xs shadow-lg">
                  <p className="font-semibold mb-1">{AccountTypeMap[account.type]}</p>
                  <p className="text-white/90">{accountTypeDescriptions[account.type]}</p>
                </div>
              </div>
            </div>
            <Select
              value={account.type}
              onValueChange={(value) => updateAccountField(index, "type", value as keyof typeof AccountTypeMap)}
              disabled={loading}
            >
              <SelectTrigger className={onboardingStyles.select}>
                <SelectValue placeholder="Seleziona il tipo di conto" />
              </SelectTrigger>
              <SelectContent className={onboardingStyles.selectContent}>
                {accountTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
      <Button type="button" onClick={addAccount} disabled={loading} className={onboardingStyles.addButton}>
        <PlusCircle className="h-4 w-4 mr-2" /> Aggiungi un conto
      </Button>
    </div>
  );

  const updateBudgetField = (index: number, field: keyof BudgetFormState, value: string) => {
    setBudgets((prev) => prev.map((budget, idx) => (idx === index ? { ...budget, [field]: value } : budget)));
  };

  const addBudget = () => {
    setBudgets((prev) => [...prev, { description: "", amount: "", type: "monthly", categoryId: "" }]);
  };

  const removeBudget = (index: number) => {
    setBudgets((prev) => prev.filter((_, idx) => idx !== index));
  };

  const renderBudgetsStep = () => (
    <div className="space-y-4">
      {/* Skip budget info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-semibold text-blue-900">Puoi saltare questo passaggio</p>
            <p className="text-xs text-blue-700 mt-1">
              Non sei sicuro dei budget? Puoi configurarli più tardi dal dashboard.
            </p>
          </div>
          {budgets.length > 0 && (
            <Button
              type="button"
              onClick={handleSkipBudgets}
              disabled={loading}
              className="text-xs px-3 py-1 h-auto bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-300"
            >
              Salta
            </Button>
          )}
        </div>
      </div>

      {categoriesLoading && (
        <div className={onboardingStyles.loadingInfo}>
          <Loader2 className="h-4 w-4 animate-spin" />
          Caricamento categorie...
        </div>
      )}
      {!categoriesLoading && categories.length === 0 && (
        <div className={onboardingStyles.warningMessage}>
          Nessuna categoria disponibile al momento. Prova ad aggiornare la pagina dopo aver completato
          l&apos;onboarding.
        </div>
      )}
      {budgets.map((budget, index) => (
        <div key={`budget-${index}`} className={onboardingStyles.card}>
          <div className={onboardingStyles.cardHeader}>
            <p className={onboardingStyles.cardTitle}>Budget {index + 1}</p>
            {budgets.length > 1 && (
              <button
                type="button"
                onClick={() => removeBudget(index)}
                className={onboardingStyles.deleteButton}
                disabled={loading}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="space-y-2">
            <Label className={onboardingStyles.label}>Descrizione</Label>
            <Input
              value={budget.description}
              onChange={(e) => updateBudgetField(index, "description", e.target.value)}
              placeholder="Spesa mensile supermercato"
              disabled={loading}
              className={onboardingStyles.input}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className={onboardingStyles.label}>Importo previsto (€)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={budget.amount}
                onChange={(e) => updateBudgetField(index, "amount", e.target.value)}
                placeholder="500"
                disabled={loading}
                className={onboardingStyles.input}
              />
            </div>
            <div className="space-y-2">
              <Label className={onboardingStyles.label}>Periodo</Label>
              <Select
                value={budget.type}
                onValueChange={(value: BudgetType) => updateBudgetField(index, "type", value)}
                disabled={loading}
              >
                <SelectTrigger className={onboardingStyles.select}>
                  <SelectValue placeholder="Seleziona" />
                </SelectTrigger>
                <SelectContent className={onboardingStyles.selectContent}>
                  {budgetTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label className={onboardingStyles.label}>Categoria principale</Label>
            <Select
              value={budget.categoryId}
              onValueChange={(value) => updateBudgetField(index, "categoryId", value)}
              disabled={loading || categoriesLoading}
            >
              <SelectTrigger className={onboardingStyles.select}>
                <SelectValue
                  placeholder={categoryOptions.length ? "Scegli una categoria" : "Nessuna categoria disponibile"}
                />
              </SelectTrigger>
              <SelectContent className={onboardingStyles.selectContent}>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}
      <div className="space-y-2 pt-2">
        <Label htmlFor="budgetStartDay" className={onboardingStyles.primaryLabel}>
          Giorno di inizio budget
        </Label>
        <Select
          value={budgetStartDay.toString()}
          onValueChange={(value) => setBudgetStartDay(parseInt(value))}
          disabled={loading}
        >
          <SelectTrigger className={onboardingStyles.select}>
            <SelectValue placeholder="Seleziona il giorno" />
          </SelectTrigger>
          <SelectContent className={onboardingStyles.selectContent}>
            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
              <SelectItem key={day} value={day.toString()}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="button" onClick={addBudget} disabled={loading} className={onboardingStyles.addButton}>
        <PlusCircle className="h-4 w-4 mr-2" /> Aggiungi un budget
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    if (currentStep === 0) return renderGroupStep();
    if (currentStep === 1) return renderAccountsStep();
    return renderBudgetsStep();
  };

  const StepIcon = steps[currentStep].icon;

  return (
    <div className={onboardingStyles.overlay}>
      {/* Draft restore banner */}
      {showDraftRestore && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-primary/20 rounded-lg shadow-lg p-4 max-w-md"
        >
          <div className="flex items-start gap-3">
            <HelpCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-primary">Riprendere da dove hai lasciato?</p>
              <p className="text-xs text-primary/70 mt-1">
                Abbiamo trovato una configurazione salvata in precedenza.
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-3">
            <Button
              type="button"
              onClick={restoreDraft}
              className="flex-1 text-xs h-8 bg-primary text-white hover:bg-primary/90"
            >
              Ripristina
            </Button>
            <Button
              type="button"
              onClick={dismissDraftRestore}
              className="flex-1 text-xs h-8 bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Ricomincia
            </Button>
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className={onboardingStyles.modal}
      >
        <header className={onboardingStyles.header.container}>
          <div className={onboardingStyles.header.content}>
            <div className={onboardingStyles.header.icon}>
              <StepIcon className="h-5 w-5" />
            </div>
            <div>
              {/* Visual step progress indicator with dots */}
              <div className="flex items-center gap-2 mb-2">
                {steps.map((_, index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === currentStep
                        ? 'w-8 bg-primary'
                        : index < currentStep
                        ? 'w-2 bg-primary'
                        : 'w-2 bg-primary/20'
                    }`}
                  />
                ))}
              </div>
              <p className={onboardingStyles.header.meta}>
                Step {currentStep + 1} di {steps.length}
              </p>
              <h2 className={onboardingStyles.header.title}>{steps[currentStep].title}</h2>
              <p className={onboardingStyles.header.description}>{steps[currentStep].description}</p>
            </div>
          </div>
          <div className={onboardingStyles.header.progressTrack}>
            <div
              className={onboardingStyles.header.progressIndicator}
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
        </header>

        <div className={onboardingStyles.stepContent}>{renderCurrentStep()}</div>

        {(localError || error) && (
          <div className={onboardingStyles.alert}>
            <AlertCircle className="h-4 w-4" />
            <span>{localError || error}</span>
          </div>
        )}

        <div className={onboardingStyles.footer}>
          {currentStep > 0 ? (
            <Button type="button" onClick={handleBack} disabled={loading} className={onboardingStyles.backButton}>
              <ArrowLeft className="h-4 w-4" /> Indietro
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            onClick={currentStep === steps.length - 1 ? handleSubmit : handleNext}
            disabled={loading || !canProceed || (currentStep === steps.length - 1 && categoriesLoading)}
            className={onboardingStyles.nextButton}
          >
            {currentStep === steps.length - 1 ? (
              loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvataggio...
                </>
              ) : (
                <>
                  Conferma
                  <CheckCircle2 className="h-4 w-4" />
                </>
              )
            ) : (
              <>
                Avanti
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
