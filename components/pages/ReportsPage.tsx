import { memo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useReportsPage } from "../../hooks";
import { Card, SummaryCards } from "../ui";
import { BudgetProgress } from "../budget";
import { formatCurrency } from "../../constants";
import { useBreakpoint } from "../../hooks/ui/useResponsive";
import { useFinance } from "../../hooks/core/useFinance";

/**
 * Componente per la selezione dell'anno
 */
const YearSelector = memo<{
  availableYears: number[];
  selectedYear: number;
  onYearChange: (year: number) => void;
}>(({ availableYears, selectedYear, onYearChange }) => (
  <Card>
    <div className="p-4">
      <label htmlFor="year-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Seleziona Anno
      </label>
      <select
        id="year-select"
        value={selectedYear}
        onChange={(e) => onYearChange(parseInt(e.target.value))}
        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        {availableYears.map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
    </div>
  </Card>
));

YearSelector.displayName = "YearSelector";

/**
 * Componente per il grafico mensile
 * Principio SRP: Single Responsibility - gestisce solo la visualizzazione del grafico
 */
const MonthlyChart = memo<{
  data: Array<{ name: string; entrata: number; spesa: number }>;
  selectedYear: number;
}>(({ data, selectedYear }) => (
  <Card>
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Trend Finanziario Mensile</h3>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Confronto entrate e spese per l'anno {selectedYear}
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex space-x-4">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Entrate</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded mr-2"></div>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Spese</span>
          </div>
        </div>
      </div>

      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }} barCategoryGap="20%">
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 12, fill: "currentColor" }}
              axisLine={{ stroke: "currentColor", opacity: 0.3 }}
              tickLine={{ stroke: "currentColor", opacity: 0.3 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis
              tick={{ fontSize: 12, fill: "currentColor" }}
              axisLine={{ stroke: "currentColor", opacity: 0.3 }}
              tickLine={{ stroke: "currentColor", opacity: 0.3 }}
              className="text-gray-600 dark:text-gray-400"
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip
              formatter={(value: number, name: string) => [
                formatCurrency(value),
                name === "entrata" ? "Entrate" : "Spese",
              ]}
              labelFormatter={(label) => `${label} ${selectedYear}`}
              contentStyle={{
                backgroundColor: "rgb(255 255 255 / 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgb(229 231 235)",
                borderRadius: "12px",
                boxShadow: "0 10px 25px -5px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)",
                color: "#374151",
              }}
              cursor={{ fill: "rgba(156, 163, 175, 0.1)" }}
            />
            <Bar dataKey="entrata" fill="#10B981" name="entrata" radius={[4, 4, 0, 0]} maxBarSize={60} />
            <Bar dataKey="spesa" fill="#EF4444" name="spesa" radius={[4, 4, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  </Card>
));

MonthlyChart.displayName = "MonthlyChart";

/**
 * Pagina Report
 */
export const ReportsPage = memo(() => {
  const { isMobile, isTablet } = useBreakpoint();
  const {
    selectedPersonId,
    selectedPerson,
    availableYears,
    selectedYear,
    monthlyData,
    summaryCardsData,
    availableBudgetPeriods,
    selectedBudgetPeriod,
    budgetReferencePerson,
    handleYearChange,
    handleBudgetPeriodChange,
    budgets,
    people,
  } = useReportsPage();
  const { selectPerson } = useFinance();

  // Aggiungi il calcolo del netto ai dati mensili per il grafico mobile
  const mobileChartData = monthlyData.map((item) => ({
    ...item,
    netto: item.entrata - item.spesa,
  }));

  return (
    <div className="space-y-6 p-2 sm:p-4 lg:p-6 xl:p-8 pb-24 lg:pb-8 overflow-hidden">
      {/* Header con selezione persona su mobile/tablet */}
      <div className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">Report</h1>
          <p className="text-sm lg:text-base text-gray-600 dark:text-gray-400">Analisi dettagliate delle tue finanze</p>
        </div>

        {/* Selezione persona solo su mobile/tablet */}
        {(isMobile || isTablet) && people.length > 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-3 sm:p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Seleziona Persona</h2>
            <div className="relative">
              <select
                className="w-full p-3 pr-10 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none shadow-sm"
                value={selectedPersonId}
                onChange={(e) => selectPerson(e.target.value)}
              >
                <option value="all">👥 Tutte le persone</option>
                {people.map((person) => (
                  <option key={person.id} value={person.id}>
                    👤 {person.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500 dark:text-gray-400">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </div>
            </div>
          </div>
        )}
      </div>

      <YearSelector availableYears={availableYears} selectedYear={selectedYear} onYearChange={handleYearChange} />

      <SummaryCards cards={summaryCardsData} />

      <MonthlyChart data={monthlyData} selectedYear={selectedYear} />

      {/* Storico Budget */}
      <Card>
        <div className="p-6">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Storico Budget {selectedYear}
              {budgetReferencePerson && (
                <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                  {typeof budgetReferencePerson === "string"
                    ? `(Periodi di ${budgetReferencePerson})`
                    : `(Periodi di ${budgetReferencePerson.name})`}
                </span>
              )}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              Panoramica completa dei budget con transazioni e categorie associate
              {selectedBudgetPeriod && (
                <span className="block mt-1">
                  <strong>Periodo selezionato:</strong>{" "}
                  {new Date(selectedBudgetPeriod.startDate).toLocaleDateString("it-IT", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {selectedBudgetPeriod.endDate && (
                    <>
                      {" "}
                      -{" "}
                      {new Date(selectedBudgetPeriod.endDate).toLocaleDateString("it-IT", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </>
                  )}
                </span>
              )}
            </p>
          </div>

          {budgets.length > 0 ? (
            <BudgetProgress
              budgets={budgets}
              people={people}
              selectedPersonId={selectedPersonId}
              isReportMode={true}
              availablePeriods={availableBudgetPeriods}
              selectedPeriod={selectedBudgetPeriod}
              onPeriodChange={handleBudgetPeriodChange}
            />
          ) : (
            <div className="text-center py-10 text-gray-500 dark:text-gray-400">
              Nessun budget configurato per l'anno selezionato.
            </div>
          )}
        </div>
      </Card>
    </div>
  );
});

ReportsPage.displayName = "ReportsPage";
