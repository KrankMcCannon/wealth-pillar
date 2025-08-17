import { memo } from 'react';
import { Card, FormField, Input } from '../ui';
import { formatCurrency } from '../../constants';
import { useCompoundInterest } from '../../hooks';
import { CalculatorIcon } from '../common';

/**
 * Componente per i controlli di input del calcolatore
 */
const CalculatorInputs = memo<{
  principal: number;
  setPrincipal: (value: number) => void;
  rate: number;
  setRate: (value: number) => void;
  years: number;
  setYears: (value: number) => void;
  compoundsPerYear: number;
  setCompoundsPerYear: (value: number) => void;
}>(({
  principal, setPrincipal,
  rate, setRate,
  years, setYears,
  compoundsPerYear, setCompoundsPerYear
}) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField id='principal' label="Capitale Iniziale (€)">
      <Input
        type="number"
        value={principal}
        onChange={(e) => setPrincipal(Number(e.target.value))}
        min="0"
        step="100"
      />
    </FormField>

    <FormField id='rate' label="Tasso di Interesse Annuo (%)">
      <Input
        type="number"
        value={rate}
        onChange={(e) => setRate(Number(e.target.value))}
        min="0"
        step="0.1"
      />
    </FormField>

    <FormField id='years' label="Periodo (anni)">
      <Input
        type="number"
        value={years}
        onChange={(e) => setYears(Number(e.target.value))}
        min="1"
        step="1"
      />
    </FormField>

    <FormField id='compoundsPerYear' label="Capitalizzazioni per Anno">
      <select
        value={compoundsPerYear}
        onChange={(e) => setCompoundsPerYear(Number(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value={1}>Annuale</option>
        <option value={4}>Trimestrale</option>
        <option value={12}>Mensile</option>
        <option value={365}>Giornaliera</option>
      </select>
    </FormField>
  </div>
));

CalculatorInputs.displayName = 'CalculatorInputs';

/**
 * Componente per visualizzare i risultati del calcolo
 */
const CalculatorResults = memo<{
  futureValue: number;
  gain: number;
  returnPercentage: number;
}>(({ futureValue, gain, returnPercentage }) => (
  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
    <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-4">
      Risultati del Calcolo
    </h3>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">Valore Futuro</p>
        <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
          {formatCurrency(futureValue)}
        </p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">Guadagno</p>
        <p className="text-xl font-bold text-green-600 dark:text-green-400">
          {formatCurrency(gain)}
        </p>
      </div>
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">Ritorno %</p>
        <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
          {returnPercentage.toFixed(2)}%
        </p>
      </div>
    </div>
  </div>
));

CalculatorResults.displayName = 'CalculatorResults';

/**
 * Calcolatore di Interesse Composto
 */
export const CompoundInterestCalculator = memo(() => {
  const {
    principal, setPrincipal,
    rate, setRate,
    years, setYears,
    compoundsPerYear, setCompoundsPerYear,
    futureValue,
    calculateGain,
    calculateReturnPercentage
  } = useCompoundInterest();

  const gain = calculateGain();
  const returnPercentage = calculateReturnPercentage();

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <CalculatorIcon />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
            Calcolatore Interesse Composto
          </h2>
        </div>

        <CalculatorInputs
          principal={principal}
          setPrincipal={setPrincipal}
          rate={rate}
          setRate={setRate}
          years={years}
          setYears={setYears}
          compoundsPerYear={compoundsPerYear}
          setCompoundsPerYear={setCompoundsPerYear}
        />

        <CalculatorResults
          futureValue={futureValue}
          gain={gain}
          returnPercentage={returnPercentage}
        />

        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Formula utilizzata:
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            A = P(1 + r/n)^(nt)
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
            Dove: A = importo finale, P = capitale iniziale, r = tasso di interesse,
            n = numero di capitalizzazioni per anno, t = tempo in anni
          </p>
        </div>
      </div>
    </Card>
  );
});

CompoundInterestCalculator.displayName = 'CompoundInterestCalculator';
