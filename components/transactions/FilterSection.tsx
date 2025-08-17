import { memo } from "react";
import { TransactionType } from "../../types";

/**
 * Props per il componente FilterSection
 */
interface FilterSectionProps {
  searchTerm: string;
  typeFilter: "all" | TransactionType;
  categoryFilter: "all" | string;
  dateRange: { startDate: string; endDate: string };
  availableCategories: string[];
  hasActiveFilters: boolean;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: "all" | TransactionType) => void;
  onCategoryFilterChange: (value: "all" | string) => void;
  onDateRangeChange: (range: { startDate: string; endDate: string }) => void;
  onResetFilters: () => void;
  getCategoryName: (category: string) => string;
}

/**
 * Componente per la sezione filtri delle transazioni
 */
export const FilterSection = memo<FilterSectionProps>(
  ({
    searchTerm,
    typeFilter,
    categoryFilter,
    dateRange,
    availableCategories,
    hasActiveFilters,
    onSearchChange,
    onTypeFilterChange,
    onCategoryFilterChange,
    onDateRangeChange,
    onResetFilters,
    getCategoryName,
  }) => {
    return (
      <div className="p-4 lg:p-6 space-y-4 lg:space-y-6">
        {/* Header della sezione filtri */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <h2 className="text-base lg:text-lg font-semibold text-gray-800 dark:text-white">Filtri e Ricerca</h2>
          <button
            onClick={onResetFilters}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium hover:underline transition-colors self-start sm:self-auto"
          >
            Reset Filtri
          </button>
        </div>

        {/* Barra di ricerca */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cerca per descrizione, categoria, account o persona..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 hover:bg-white dark:hover:bg-gray-700"
          />
          {searchTerm && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Filtri tipo e categoria */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
          {/* Filtro per tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tipo di Transazione
            </label>
            <select
              value={typeFilter}
              onChange={(e) => onTypeFilterChange(e.target.value as "all" | TransactionType)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutti i Tipi</option>
              <option value={TransactionType.ENTRATA}>💰 Entrate</option>
              <option value={TransactionType.SPESA}>💸 Spese</option>
            </select>
          </div>

          {/* Filtro per categoria */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categoria</label>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tutte le Categorie</option>
              {availableCategories.map((category) => (
                <option key={category} value={category}>
                  {getCategoryName(category)}
                </option>
              ))}
            </select>
          </div>

          {/* Range di date */}
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Periodo</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => onDateRangeChange({ ...dateRange, startDate: e.target.value })}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => onDateRangeChange({ ...dateRange, endDate: e.target.value })}
                className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Indicatori dei filtri attivi */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Filtri attivi:</span>
            {searchTerm && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                🔍 "{searchTerm}"
              </span>
            )}
            {typeFilter !== "all" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                {typeFilter === TransactionType.ENTRATA ? "💰" : "💸"}{" "}
                {typeFilter === TransactionType.ENTRATA ? "Entrate" : "Spese"}
              </span>
            )}
            {categoryFilter !== "all" && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                📋 {getCategoryName(categoryFilter)}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }
);

FilterSection.displayName = "FilterSection";
