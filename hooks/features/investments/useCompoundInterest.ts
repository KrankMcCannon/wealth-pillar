import { useCallback, useEffect, useState } from 'react';

/**
 * Hook per gestire la logica del calcolatore di interesse composto
 * Principio SRP: Single Responsibility - gestisce solo i calcoli finanziari
 * Principio DRY: Don't Repeat Yourself - centralizza la logica di calcolo
 */
export const useCompoundInterest = () => {
  const [principal, setPrincipal] = useState(1000);
  const [rate, setRate] = useState(5);
  const [years, setYears] = useState(10);
  const [compoundsPerYear, setCompoundsPerYear] = useState(12);
  const [futureValue, setFutureValue] = useState(0);

  /**
   * Calcola il valore futuro usando la formula dell'interesse composto
   * Principio SRP: Single Responsibility - calcola solo il valore futuro
   */
  const calculateFutureValue = useCallback(() => {
    const P = principal;
    const r = rate / 100;
    const n = compoundsPerYear;
    const t = years;
    const A = P * Math.pow((1 + r / n), (n * t));
    setFutureValue(A);
  }, [principal, rate, years, compoundsPerYear]);

  // Ricalcola automaticamente quando cambiano i parametri
  useEffect(() => {
    calculateFutureValue();
  }, [calculateFutureValue]);

  /**
   * Calcola il guadagno totale
   */
  const calculateGain = useCallback(() => {
    return futureValue - principal;
  }, [futureValue, principal]);

  /**
   * Calcola il ritorno percentuale
   */
  const calculateReturnPercentage = useCallback(() => {
    return principal > 0 ? ((futureValue - principal) / principal) * 100 : 0;
  }, [futureValue, principal]);

  return {
    // Stati
    principal,
    rate,
    years,
    compoundsPerYear,
    futureValue,
    
    // Setters
    setPrincipal,
    setRate,
    setYears,
    setCompoundsPerYear,
    
    // Funzioni di calcolo
    calculateFutureValue,
    calculateGain,
    calculateReturnPercentage,
    
    // Valori calcolati
    gain: calculateGain(),
    returnPercentage: calculateReturnPercentage(),
  };
};
