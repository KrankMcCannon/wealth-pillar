import { useCallback, useMemo, useState } from 'react';
import { InvestmentHolding } from '../../types';
import { useFinance } from '../core/useFinance';
import { useModalForm } from '../ui/useModalForm';
import { useModal } from '../ui/useModal';

/**
 * Interface per i dati del form investimento
 */
interface InvestmentFormData {
  symbol: string;
  name: string;
  quantity: number;
  purchasePrice: number;
  currentPrice: number;
  purchaseDate: string;
  personId: string;
}

/**
 * Interface per il calcolo dell'interesse composto
 */
interface CompoundInterestCalculation {
  principal: number;
  annualRate: number;
  compoundingFrequency: number;
  years: number;
  monthlyContribution: number;
  result: {
    futureValue: number;
    totalContributions: number;
    totalInterest: number;
    yearlyBreakdown: {
      year: number;
      balance: number;
      yearlyContribution: number;
      yearlyInterest: number;
    }[];
  };
}

/**
 * Interface per le metriche del portfolio
 */
interface PortfolioMetrics {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalReturn: number;
  diversification: {
    sectors: { [key: string]: number };
    assets: { [key: string]: number };
  };
  topPerformers: {
    investment: InvestmentHolding;
    return: number;
    gainLoss: number;
  }[];
  worstPerformers: {
    investment: InvestmentHolding;
    return: number;
    gainLoss: number;
  }[];
}

/**
 * Hook consolidato per gestire tutti gli aspetti degli investimenti
 * Principio SRP: Single Responsibility - gestisce investimenti
 * Principio DRY: Don't Repeat Yourself - unifica logica investimenti
 */
export const useInvestments = () => {
  const { investments, addInvestment, people } = useFinance();

  // === FORM MANAGEMENT ===

  const [editingInvestment, setEditingInvestment] = useState<InvestmentHolding | null>(null);
  const calculatorModal = useModal();

  const investmentForm = useModalForm({
    initialData: {
      symbol: '',
      name: '',
      quantity: 0,
      purchasePrice: 0,
      currentPrice: 0,
      purchaseDate: new Date().toISOString().split('T')[0],
      personId: people[0]?.id || '',
    } as InvestmentFormData,
    resetOnClose: true,
    resetOnOpen: true,
  });

  const validateInvestmentForm = useCallback((data: InvestmentFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.symbol.trim()) {
      errors.symbol = "Il simbolo è obbligatorio";
    }

    if (!data.name.trim()) {
      errors.name = "Il nome è obbligatorio";
    }

    if (data.quantity <= 0) {
      errors.quantity = "La quantità deve essere positiva";
    }

    if (data.purchasePrice <= 0) {
      errors.purchasePrice = "Il prezzo di acquisto deve essere positivo";
    }

    if (data.currentPrice <= 0) {
      errors.currentPrice = "Il prezzo corrente deve essere positivo";
    }

    if (!data.personId) {
      errors.personId = "Seleziona una persona";
    }

    return errors;
  }, []);

  const openInvestmentForm = useCallback((investment?: InvestmentHolding) => {
    if (investment) {
      investmentForm.updateData({
        symbol: investment.symbol,
        name: investment.name,
        quantity: investment.quantity,
        purchasePrice: investment.purchasePrice,
        currentPrice: investment.currentPrice,
        purchaseDate: investment.purchaseDate,
        personId: investment.personId,
      });
      setEditingInvestment(investment);
    } else {
      investmentForm.resetForm();
      setEditingInvestment(null);
    }
  }, [investmentForm]);

  const saveInvestmentForm = useCallback(async (onClose: () => void) => {
    const errors = validateInvestmentForm(investmentForm.data);
    if (Object.keys(errors).length > 0) {
      Object.entries(errors).forEach(([field, message]) => {
        investmentForm.setError(field, message);
      });
      return;
    }

    investmentForm.setSubmitting(true);

    try {
      const investmentData = {
        symbol: investmentForm.data.symbol.toUpperCase().trim(),
        name: investmentForm.data.name.trim(),
        quantity: investmentForm.data.quantity,
        purchasePrice: investmentForm.data.purchasePrice,
        currentPrice: investmentForm.data.currentPrice,
        purchaseDate: investmentForm.data.purchaseDate,
        personId: investmentForm.data.personId,
        groupId: people.find(p => p.id === investmentForm.data.personId)?.groupId || '',
      };

      if (editingInvestment) {
        // For now, just log - update not implemented in useFinance
        console.log('Update investment:', editingInvestment.id, investmentData);
      } else {
        await addInvestment(investmentData);
      }

      onClose();
      setEditingInvestment(null);
    } catch (err) {
      investmentForm.setError("general", err instanceof Error ? err.message : "Errore durante l'operazione");
    } finally {
      investmentForm.setSubmitting(false);
    }
  }, [investmentForm, editingInvestment, addInvestment, validateInvestmentForm]);

  const peopleOptions = useMemo(() => 
    people.map(person => ({
      id: person.id,
      label: person.name,
      selected: investmentForm.data.personId === person.id,
    })),
    [people, investmentForm.data.personId]
  );

  const handlePersonSelect = useCallback((personId: string) => {
    investmentForm.updateField("personId", personId);
  }, [investmentForm]);

  // === PORTFOLIO CALCULATIONS ===

  const portfolioMetrics = useMemo((): PortfolioMetrics => {
    const investmentCalculations = investments.map(investment => {
      const currentValue = investment.quantity * investment.currentPrice;
      const purchaseValue = investment.quantity * investment.purchasePrice;
      const gainLoss = currentValue - purchaseValue;
      const returnPercent = purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0;

      return {
        investment,
        currentValue,
        purchaseValue,
        gainLoss,
        return: returnPercent,
      };
    });

    const totalValue = investmentCalculations.reduce((sum, calc) => sum + calc.currentValue, 0);
    const totalCost = investmentCalculations.reduce((sum, calc) => sum + calc.purchaseValue, 0);
    const totalGainLoss = totalValue - totalCost;
    const totalReturn = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

    // Diversification analysis (simplified)
    const sectors: { [key: string]: number } = {};
    const assets: { [key: string]: number } = {};

    investmentCalculations.forEach(calc => {
      // Simplified sector classification based on symbol
      const symbol = calc.investment.symbol;
      let sector = 'Altri';
      
      if (symbol.includes('TECH') || symbol.includes('AAPL') || symbol.includes('GOOGL')) {
        sector = 'Tecnologia';
      } else if (symbol.includes('BANK') || symbol.includes('JPM') || symbol.includes('BAC')) {
        sector = 'Bancario';
      } else if (symbol.includes('REIT')) {
        sector = 'Immobiliare';
      }

      sectors[sector] = (sectors[sector] || 0) + calc.currentValue;
      assets[calc.investment.symbol] = calc.currentValue;
    });

    // Top and worst performers
    const sortedByReturn = [...investmentCalculations].sort((a, b) => b.return - a.return);
    const topPerformers = sortedByReturn.slice(0, 3).map(calc => ({
      investment: calc.investment,
      return: calc.return,
      gainLoss: calc.gainLoss,
    }));
    const worstPerformers = sortedByReturn.slice(-3).reverse().map(calc => ({
      investment: calc.investment,
      return: calc.return,
      gainLoss: calc.gainLoss,
    }));

    return {
      totalValue,
      totalCost,
      totalGainLoss,
      totalReturn,
      diversification: { sectors, assets },
      topPerformers,
      worstPerformers,
    };
  }, [investments]);

  // Investment rows with calculations
  const investmentRows = useMemo(() => {
    return investments.map(investment => {
      const currentValue = investment.quantity * investment.currentPrice;
      const purchaseValue = investment.quantity * investment.purchasePrice;
      const gainLoss = currentValue - purchaseValue;
      const returnPercent = purchaseValue > 0 ? (gainLoss / purchaseValue) * 100 : 0;
      const portfolioWeight = portfolioMetrics.totalValue > 0 ? (currentValue / portfolioMetrics.totalValue) * 100 : 0;

      return {
        investment,
        currentValue,
        purchaseValue,
        gainLoss,
        returnPercent,
        portfolioWeight,
        isPositive: gainLoss >= 0,
      };
    });
  }, [investments, portfolioMetrics.totalValue]);

  // === COMPOUND INTEREST CALCULATOR ===

  const [compoundCalculation, setCompoundCalculation] = useState<CompoundInterestCalculation>({
    principal: 10000,
    annualRate: 7,
    compoundingFrequency: 12,
    years: 10,
    monthlyContribution: 500,
    result: {
      futureValue: 0,
      totalContributions: 0,
      totalInterest: 0,
      yearlyBreakdown: [],
    },
  });

  const calculateCompoundInterest = useCallback((params: Omit<CompoundInterestCalculation, 'result'>) => {
    const { principal, annualRate, compoundingFrequency, years, monthlyContribution } = params;
    
    const monthlyRate = annualRate / 100 / 12;
    const totalMonths = years * 12;
    
    let balance = principal;
    const yearlyBreakdown: any[] = [];
    let totalContributions = principal;
    
    for (let year = 1; year <= years; year++) {
      let yearlyContribution = 0;
      let yearStartBalance = balance;
      
      for (let month = 1; month <= 12; month++) {
        balance = balance * (1 + monthlyRate) + monthlyContribution;
        yearlyContribution += monthlyContribution;
        totalContributions += monthlyContribution;
      }
      
      const yearlyInterest = balance - yearStartBalance - yearlyContribution;
      
      yearlyBreakdown.push({
        year,
        balance: Math.round(balance * 100) / 100,
        yearlyContribution,
        yearlyInterest: Math.round(yearlyInterest * 100) / 100,
      });
    }
    
    const futureValue = Math.round(balance * 100) / 100;
    const totalInterest = Math.round((futureValue - totalContributions) * 100) / 100;
    
    const result = {
      futureValue,
      totalContributions,
      totalInterest,
      yearlyBreakdown,
    };

    const calculation = { ...params, result };
    setCompoundCalculation(calculation);
    return calculation;
  }, []);

  const updateCalculationParam = useCallback((key: keyof Omit<CompoundInterestCalculation, 'result'>, value: number) => {
    const newParams = { ...compoundCalculation, [key]: value };
    delete (newParams as any).result;
    calculateCompoundInterest(newParams);
  }, [compoundCalculation, calculateCompoundInterest]);

  // === UTILITY FUNCTIONS ===

  const getInvestmentStatusColor = useCallback((returnPercent: number): string => {
    if (returnPercent >= 10) return 'green';
    if (returnPercent >= 5) return 'lightgreen';
    if (returnPercent >= 0) return 'gray';
    if (returnPercent >= -5) return 'orange';
    return 'red';
  }, []);

  const formatCurrency = useCallback((amount: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
    }).format(amount);
  }, []);

  const formatPercentage = useCallback((percent: number): string => {
    return new Intl.NumberFormat('it-IT', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(percent / 100);
  }, []);

  // Initialize compound interest calculation
  useMemo(() => {
    calculateCompoundInterest({
      principal: compoundCalculation.principal,
      annualRate: compoundCalculation.annualRate,
      compoundingFrequency: compoundCalculation.compoundingFrequency,
      years: compoundCalculation.years,
      monthlyContribution: compoundCalculation.monthlyContribution,
    });
  }, []); // Only on mount

  return {
    // Data
    investments: investmentRows,
    portfolioMetrics,
    
    // Form management
    investmentForm,
    editingInvestment,
    peopleOptions,
    openInvestmentForm,
    saveInvestmentForm,
    handlePersonSelect,
    
    // Compound interest calculator
    calculatorModal,
    compoundCalculation,
    calculateCompoundInterest,
    updateCalculationParam,
    
    // Utilities
    getInvestmentStatusColor,
    formatCurrency,
    formatPercentage,
    
    // Note: delete not implemented in useFinance yet
  };
};