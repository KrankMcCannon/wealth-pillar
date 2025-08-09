import React, { useState, useEffect, memo, useCallback } from 'react';
import { Card, FormField, Input } from '../ui';
import { formatCurrency } from '../../constants';

// Simple calculator icon as SVG component
const CalculatorIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
);

/**
 * Hook per gestire la logica del calcolatore di interesse composto
 * Principio SRP: Single Responsibility - gestisce solo i calcoli finanziari
 */
const useCompoundInterest = () => {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(10);
  const [compoundsPerYear, setCompoundsPerYear] = useState(12);
  const [futureValue, setFutureValue] = useState(0);

  const calculateFutureValue = useCallback(() => {
    const P = principal;
    const r = rate / 100;
    const n = compoundsPerYear;
    const t = years;
    const A = P * Math.pow((1 + r / n), (n * t));
    setFutureValue(A);
  }, [principal, rate, years, compoundsPerYear]);

  useEffect(() => {
    calculateFutureValue();
  }, [calculateFutureValue]);

  return {
    principal,
    setPrincipal,
    rate,
    setRate,
    years,
    setYears,
    compoundsPerYear,
    setCompoundsPerYear,
    futureValue,
  };
};

/**
 * Componente per il calcolatore di interesse composto
 * Principio SRP: Single Responsibility - gestisce solo l'interfaccia del calcolatore
 */
export const CompoundInterestCalculator = memo(() => {
  const {
    principal,
    setPrincipal,
    rate,
    setRate,
    years,
    setYears,
    compoundsPerYear,
    setCompoundsPerYear,
    futureValue,
  } = useCompoundInterest();

  const handlePrincipalChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPrincipal(Number(e.target.value));
  }, [setPrincipal]);

  const handleRateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setRate(Number(e.target.value));
  }, [setRate]);

  const handleYearsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setYears(Number(e.target.value));
  }, [setYears]);

  const handleCompoundsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCompoundsPerYear(Number(e.target.value));
  }, [setCompoundsPerYear]);

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-white flex items-center">
        <CalculatorIcon />
        <span className="ml-3">Calcolatore Interesse Composto</span>
      </h2>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <FormField label="Capitale (€)">
          <Input
            type="number"
            value={principal.toString()}
            onChange={handlePrincipalChange}
            min="0"
            step="100"
          />
        </FormField>
        
        <FormField label="Tasso Annuo (%)">
          <Input
            type="number"
            value={rate.toString()}
            onChange={handleRateChange}
            min="0"
            step="0.1"
          />
        </FormField>
        
        <FormField label="Anni">
          <Input
            type="number"
            value={years.toString()}
            onChange={handleYearsChange}
            min="1"
            step="1"
          />
        </FormField>
        
        <FormField label="Comp. per anno">
          <Input
            type="number"
            value={compoundsPerYear.toString()}
            onChange={handleCompoundsChange}
            min="1"
            step="1"
          />
        </FormField>
      </div>

      <div className="bg-blue-100 dark:bg-blue-900/50 p-6 rounded-lg text-center">
        <p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-2">
          Valore Futuro
        </p>
        <p className="text-3xl font-bold text-blue-700 dark:text-blue-400">
          {formatCurrency(futureValue)}
        </p>
        <p className="text-xs text-blue-600 dark:text-blue-300 mt-2">
          Guadagno: {formatCurrency(futureValue - principal)}
        </p>
      </div>
    </Card>
  );
});

CompoundInterestCalculator.displayName = 'CompoundInterestCalculator';
