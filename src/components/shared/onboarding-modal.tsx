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
import { onboardingStyles, getOnboardingProgressStyle } from "@/features/onboarding/styles";

interface OnboardingModalProps {
  categories: Category[];
  onComplete: (data: OnboardingPayload) => Promise<void>;
  loading?: boolean;
  error?: string | null;
  categoriesLoading?: boolean;
}

interface AccountFormState {
  id: string;
  name: string;
  type: keyof typeof AccountTypeMap;
  isDefault?: boolean;
}

interface BudgetFormState {
  id: string;
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

// Helper for button content
function renderButtonContent(currentStep: number, totalSteps: number, loading: boolean) {
  if (currentStep === totalSteps - 1) {
    if (loading) {
      return (
        <>
          <Loader2 className={onboardingStyles.budgets.loadingIcon} />
          Salvataggio...
        </>
      );
    }
    return (
      <>
        Conferma
        <CheckCircle2 className={onboardingStyles.footer.buttonIcon} />
      </>
    );
  }
  return (
    <>
      Avanti
      <ArrowRight className={onboardingStyles.footer.buttonIcon} />
    </>
  );
}

// Helper for step dots
function getStepDotClass(index: number, currentStep: number) {
  if (index === currentStep) return onboardingStyles.steps.dotActive;
  if (index < currentStep) return onboardingStyles.steps.dotDone;
  return onboardingStyles.steps.dotIdle;
}

export default function OnboardingModal({
  categories,
  onComplete,
  loading = false,
  error = null,
  categoriesLoading = false,
}: Readonly<OnboardingModalProps>) {
  const [currentStep, setCurrentStep] = useState(0);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [budgetStartDay, setBudgetStartDay] = useState<number>(1);
  const [accounts, setAccounts] = useState<AccountFormState[]>([{ id: crypto.randomUUID(), name: "", type: "payroll", isDefault: true }]);
  const [budgets, setBudgets] = useState<BudgetFormState[]>([
    { id: crypto.randomUUID(), description: "", amount: "", type: "monthly", categoryId: "" },
  ]);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showDraftRestore, setShowDraftRestore] = useState(() => Boolean(loadDraft()));

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
      return budgets.every((budget) => {
        const amount = Number.parseFloat(budget.amount);
        return budget.description.trim().length > 1 && !Number.isNaN(amount) && amount > 0 && Boolean(budget.categoryId);
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
          amount: Number.parseFloat(budget.amount),
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
    <div className={onboardingStyles.form.section}>
      <div className={onboardingStyles.form.field}>
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
      <div className={onboardingStyles.form.field}>
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
    setAccounts((prev) => [...prev, { id: crypto.randomUUID(), name: "", type: "payroll", isDefault: false }]);
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
    <div className={onboardingStyles.form.section}>
      {/* Info banner - only if multiple accounts */}
      {accounts.length > 1 && (
        <div className={onboardingStyles.accounts.infoBanner}>
          <Label className={onboardingStyles.label}>Conto Predefinito</Label>
          <p className={onboardingStyles.accounts.infoText}>
            Seleziona quale conto vuoi usare come predefinito per le transazioni
          </p>
        </div>
      )}

      {accounts.map((account, index) => (
        <div key={account.id} className={onboardingStyles.card}>
          <div className={onboardingStyles.cardHeader}>
            <div className={onboardingStyles.accounts.labelRow}>
              <p className={onboardingStyles.cardTitle}>Conto {index + 1}</p>

              {/* Star icon for default selection - only if multiple accounts */}
              {accounts.length > 1 && (
                <button
                  type="button"
                  onClick={() => setAccountAsDefault(index)}
                  className={`${onboardingStyles.accounts.defaultToggle} ${
                    account.isDefault
                      ? onboardingStyles.accounts.defaultActive
                      : onboardingStyles.accounts.defaultInactive
                  }`}
                  title={account.isDefault ? 'Conto predefinito' : 'Imposta come predefinito'}
                  disabled={loading}
                >
                  <Star className={`${onboardingStyles.accounts.defaultIcon} ${account.isDefault ? onboardingStyles.accounts.defaultIconFilled : ''}`} />
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
                <Trash2 className={onboardingStyles.accounts.deleteIcon} />
              </button>
            )}
          </div>
          <div className={onboardingStyles.form.field}>
            <Label className={onboardingStyles.label}>Nome del conto</Label>
            <Input
              value={account.name}
              onChange={(e) => updateAccountField(index, "name", e.target.value)}
              placeholder="Conto corrente principale"
              disabled={loading}
              className={onboardingStyles.input}
            />
          </div>
          <div className={onboardingStyles.form.field}>
            <div className={onboardingStyles.accounts.labelRow}>
              <Label className={onboardingStyles.label}>Tipologia</Label>
              <div className={onboardingStyles.accounts.helpGroup}>
                <HelpCircle className={onboardingStyles.accounts.helpIcon} />
                <div className={onboardingStyles.accounts.helpPopover}>
                  <p className={onboardingStyles.accounts.helpTitle}>{AccountTypeMap[account.type]}</p>
                  <p className={onboardingStyles.accounts.helpBody}>{accountTypeDescriptions[account.type]}</p>
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
        <PlusCircle className={onboardingStyles.accounts.addIcon} /> Aggiungi un conto
      </Button>
    </div>
  );

  const updateBudgetField = (index: number, field: keyof BudgetFormState, value: string) => {
    setBudgets((prev) => prev.map((budget, idx) => (idx === index ? { ...budget, [field]: value } : budget)));
  };

  const addBudget = () => {
    setBudgets((prev) => [...prev, { id: crypto.randomUUID(), description: "", amount: "", type: "monthly", categoryId: "" }]);
  };

  const removeBudget = (index: number) => {
    setBudgets((prev) => prev.filter((_, idx) => idx !== index));
  };

  const renderBudgetsStep = () => (
    <div className={onboardingStyles.form.section}>
      {/* Skip budget info */}
      <div className={onboardingStyles.budgets.infoBanner}>
        <div className={onboardingStyles.budgets.infoRow}>
          <HelpCircle className={onboardingStyles.budgets.infoIcon} />
          <div className={onboardingStyles.budgets.infoBody}>
            <p className={onboardingStyles.budgets.infoTitle}>Puoi saltare questo passaggio</p>
            <p className={onboardingStyles.budgets.infoText}>
              Non sei sicuro dei budget? Puoi configurarli più tardi dal dashboard.
            </p>
          </div>
          {budgets.length > 0 && (
            <Button
              type="button"
              onClick={handleSkipBudgets}
              disabled={loading}
              className={onboardingStyles.budgets.skipButton}
            >
              Salta
            </Button>
          )}
        </div>
      </div>

      {categoriesLoading && (
        <div className={onboardingStyles.loadingInfo}>
          <Loader2 className={onboardingStyles.budgets.loadingIcon} />
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
        <div key={budget.id} className={onboardingStyles.card}>
          <div className={onboardingStyles.cardHeader}>
            <p className={onboardingStyles.cardTitle}>Budget {index + 1}</p>
            {budgets.length > 1 && (
              <button
                type="button"
                onClick={() => removeBudget(index)}
                className={onboardingStyles.deleteButton}
                disabled={loading}
              >
                <Trash2 className={onboardingStyles.budgets.deleteIcon} />
              </button>
            )}
          </div>
          <div className={onboardingStyles.form.field}>
            <Label className={onboardingStyles.label}>Descrizione</Label>
            <Input
              value={budget.description}
              onChange={(e) => updateBudgetField(index, "description", e.target.value)}
              placeholder="Spesa mensile supermercato"
              disabled={loading}
              className={onboardingStyles.input}
            />
          </div>
          <div className={onboardingStyles.budgets.grid}>
            <div className={onboardingStyles.budgets.field}>
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
            <div className={onboardingStyles.budgets.field}>
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
          <div className={onboardingStyles.form.field}>
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
      <div className={onboardingStyles.budgets.startDay}>
        <Label htmlFor="budgetStartDay" className={onboardingStyles.primaryLabel}>
          Giorno di inizio budget
        </Label>
        <Select
          value={budgetStartDay.toString()}
          onValueChange={(value) => setBudgetStartDay(Number.parseInt(value))}
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
        <PlusCircle className={onboardingStyles.budgets.addIcon} /> Aggiungi un budget
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
          className={onboardingStyles.draftRestore.container}
        >
          <div className={onboardingStyles.draftRestore.body}>
            <HelpCircle className={onboardingStyles.draftRestore.icon} />
            <div className={onboardingStyles.draftRestore.content}>
              <p className={onboardingStyles.draftRestore.title}>Riprendere da dove hai lasciato?</p>
              <p className={onboardingStyles.draftRestore.text}>
                Abbiamo trovato una configurazione salvata in precedenza.
              </p>
            </div>
          </div>
          <div className={onboardingStyles.draftRestore.actions}>
            <Button
              type="button"
              onClick={restoreDraft}
              className={onboardingStyles.draftRestore.primaryButton}
            >
              Ripristina
            </Button>
            <Button
              type="button"
              onClick={dismissDraftRestore}
              className={onboardingStyles.draftRestore.secondaryButton}
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
              <StepIcon className={onboardingStyles.steps.icon} />
            </div>
            <div>
              {/* Visual step progress indicator with dots */}
              <div className={onboardingStyles.steps.dots}>
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className={`${onboardingStyles.steps.dot} ${
                      getStepDotClass(index, currentStep)
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
              style={getOnboardingProgressStyle(currentStep, steps.length)}
            />
          </div>
        </header>

        <div className={onboardingStyles.stepContent}>{renderCurrentStep()}</div>

        {(localError || error) && (
          <div className={onboardingStyles.alert}>
            <AlertCircle className={onboardingStyles.footer.buttonIcon} />
            <span>{localError || error}</span>
          </div>
        )}

        <div className={onboardingStyles.footer.container}>
          {currentStep > 0 ? (
            <Button type="button" onClick={handleBack} disabled={loading} className={onboardingStyles.backButton}>
              <ArrowLeft className={onboardingStyles.footer.buttonIcon} /> Indietro
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
            {renderButtonContent(currentStep, steps.length, loading)}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
