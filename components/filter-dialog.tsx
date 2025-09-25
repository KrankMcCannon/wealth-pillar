"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Filter } from "lucide-react";
import { Category } from "@/lib/types";

interface FilterDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFilter: string;
  selectedCategory: string;
  categories: Category[];
  onFilterChange: (filter: string) => void;
  onCategoryChange: (category: string) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
}

const TRANSACTION_TYPES = [
  { key: "All", label: "Tutti", icon: "📊", color: "slate" },
  { key: "Income", label: "Entrate", icon: "💚", color: "green" },
  { key: "Expenses", label: "Spese", icon: "💸", color: "red" }
];

export function FilterDialog({
  isOpen,
  onOpenChange,
  selectedFilter,
  selectedCategory,
  categories,
  onFilterChange,
  onCategoryChange,
  onReset,
  hasActiveFilters
}: FilterDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={`rounded-2xl border-slate-200/50 hover:bg-primary/10 hover:border-primary/40 w-12 h-12 p-0 shadow-lg shadow-slate-200/30 hover:shadow-xl hover:shadow-slate-200/40 transition-all duration-300 hover:scale-105 group ${
            hasActiveFilters
              ? "bg-gradient-to-r from-primary to-secondary text-white hover:from-secondary hover:to-primary border-transparent shadow-primary/30"
              : "bg-white/80 backdrop-blur-sm"
          }`}
        >
          <Filter
            className={`h-5 w-5 transition-all duration-200 group-hover:rotate-12 ${
              hasActiveFilters
                ? "fill-current drop-shadow-sm"
                : "text-slate-600"
            }`}
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg bg-white/95 backdrop-blur-xl border border-slate-200/50 shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-bold text-slate-900">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            Filtra Transazioni
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-8 pt-6">
          {/* Transaction Type Filter */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <span className="text-xl">🏷️</span>
              Tipo Transazione
            </h4>
            <div className="grid grid-cols-3 gap-3">
              {TRANSACTION_TYPES.map((type) => (
                <Button
                  key={type.key}
                  variant={selectedFilter === type.key ? "default" : "outline"}
                  size="default"
                  onClick={() => onFilterChange(type.key)}
                  className={`rounded-2xl py-4 px-3 transition-all duration-300 hover:scale-105 group ${
                    selectedFilter === type.key
                      ? "bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white shadow-lg shadow-primary/30 border-transparent"
                      : "bg-white/80 backdrop-blur-sm hover:bg-primary/10 hover:text-primary border-slate-200/50 hover:border-primary/40 hover:shadow-lg hover:shadow-slate-200/50"
                  }`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <span className={`text-lg transition-transform duration-200 group-hover:scale-110 ${selectedFilter === type.key ? 'drop-shadow-sm' : ''}`}>
                      {type.icon}
                    </span>
                    <span className="text-sm font-semibold">{type.label}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Category Filter */}
          <div className="space-y-4">
            <h4 className="text-base font-semibold text-slate-800 flex items-center gap-2">
              <span className="text-xl">🎯</span>
              Categoria
            </h4>
            <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
              {[
                { name: "Tutte le Categorie", key: "all", icon: "FileText" },
                ...categories.slice(0, 7).map(cat => ({
                  name: cat.label,
                  key: cat.key,
                  icon: cat.icon || "FileText"
                }))
              ].map((category) => (
                <Button
                  key={category.name}
                  variant={selectedCategory === category.name ? "default" : "outline"}
                  size="default"
                  onClick={() => onCategoryChange(category.name)}
                  className={`justify-start py-3 px-4 rounded-2xl transition-all duration-300 hover:scale-105 group ${
                    selectedCategory === category.name
                      ? "bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white shadow-lg shadow-primary/30 border-transparent"
                      : "bg-white/80 backdrop-blur-sm hover:bg-primary/10 hover:text-primary border-slate-200/50 hover:border-primary/40 hover:shadow-lg hover:shadow-slate-200/50"
                  }`}
                >
                  <span className={`mr-3 text-lg transition-transform duration-200 group-hover:scale-110 ${selectedCategory === category.name ? 'drop-shadow-sm' : ''}`}>
                    {category.icon}
                  </span>
                  <span className="font-medium truncate">{category.name}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-slate-200/50">
            <Button
              variant="ghost"
              size="default"
              onClick={onReset}
              className="w-full py-3 px-4 rounded-2xl text-slate-600 hover:text-primary hover:bg-primary/10 font-semibold transition-all duration-300 hover:scale-105 group border border-slate-200/50 hover:border-primary/40 hover:shadow-md"
            >
              <div className="flex items-center justify-center gap-2">
                <span className="text-lg group-hover:rotate-180 transition-transform duration-300">🔄</span>
                <span>Ripristina Tutti i Filtri</span>
              </div>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}