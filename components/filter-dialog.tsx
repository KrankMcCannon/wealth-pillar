"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import { Filter, Search } from "lucide-react";
import { Category } from "@/lib/types";
import { useMediaQuery } from "@/hooks/use-media-query";
import { useState } from "react";
import { Input } from "./ui/input";
import { CategoryIcon, iconSizes } from "@/lib/icons";
import { cn } from "@/lib/utils";

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
  { key: "All", label: "Tutti" },
  { key: "Income", label: "Entrate" },
  { key: "Expenses", label: "Spese" }
];

function FilterDialogContent({
  selectedFilter,
  selectedCategory,
  categories,
  onFilterChange,
  onCategoryChange,
  onReset,
  onOpenChange
}: Omit<FilterDialogProps, 'isOpen' | 'hasActiveFilters'> & { onOpenChange: (open: boolean) => void }) {
  const [categorySearch, setCategorySearch] = useState("");

  const filteredCategories = categories.filter(cat => cat.label.toLowerCase().includes(categorySearch.toLowerCase()));

  return (
    <div className="flex flex-col h-full bg-card">
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Transaction Type Filter */}
        <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Tipo</h4>
          <div className="grid grid-cols-3 gap-2">
            {TRANSACTION_TYPES.map((type) => (
              <Button
                key={type.key}
                variant={selectedFilter === type.key ? "default" : "outline"}
                size="lg"
                onClick={() => { onFilterChange(type.key); }}
                className={cn(
                  "rounded-xl transition-all duration-200 text-sm font-semibold",
                  selectedFilter === type.key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-foreground border border-primary/20 hover:bg-primary/5 hover:text-primary"
                )}
              >
                {type.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Categoria</h4>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cerca categoria..."
              value={categorySearch}
              onChange={(e) => setCategorySearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto scrollbar-thin">
            {[
              { label: "Tutte", key: "all", icon: "FileText" },
              ...filteredCategories
            ].map((category) => (
              <Button
                key={category.key}
                variant={selectedCategory === category.key ? "default" : "outline"}
                size="lg"
                onClick={() => { onCategoryChange(category.key); }}
                className={cn(
                  "rounded-xl transition-all duration-200 text-sm font-semibold flex items-center justify-start gap-2",
                  selectedCategory === category.key
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-foreground border border-primary/20 hover:bg-primary/5 hover:text-primary"
                )}
              >
                <CategoryIcon categoryKey={category.key} size={iconSizes.sm} />
                <span>{category.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer with Reset and Apply buttons */}
      <div className="p-3 flex items-center gap-2 border-t border-border bg-card rounded-b-2xl flex-shrink-0">
        <Button
          variant="outline"
          size="lg"
          onClick={() => { onReset(); onOpenChange(false); }}
          className="flex-1 bg-card text-primary border-primary/30 hover:bg-primary/5 rounded-xl"
        >
          Reset
        </Button>
        <Button
          size="lg"
          onClick={() => onOpenChange(false)}
          className="flex-1 bg-primary text-primary-foreground shadow-md hover:bg-primary/90 rounded-xl"
        >
          Applica
        </Button>
      </div>
    </div>
  );
}

export function FilterDialog(props: FilterDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  // Unified filter button styling for both mobile and desktop
  const filterButtonClasses = cn(
    "rounded-2xl w-12 h-12 p-0 transition-all duration-300 group",
    "hover:scale-105 active:scale-95",
    props.hasActiveFilters
      ? "gradient-primary text-primary-foreground shadow-lg border-transparent hover-glow"
      : "liquid-glass-subtle border-primary/20 hover:border-primary/40"
  );

  const filterIconClasses = cn(
    "h-5 w-5 transition-all duration-200 group-hover:rotate-12",
    props.hasActiveFilters
      ? "fill-current drop-shadow-sm"
      : "text-primary/70 group-hover:text-primary"
  );

  if (isDesktop) {
    return (
      <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
        <DialogTrigger asChild>
          <Button variant="outline" className={filterButtonClasses}>
            <Filter className={filterIconClasses} />
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md max-h-[75vh] border border-border shadow-xl rounded-3xl p-0 bg-card overflow-hidden flex flex-col">
          <DialogHeader className="px-4 py-3 border-b border-border flex-shrink-0">
            <DialogTitle className="text-lg font-semibold text-foreground">
              Filtri
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            <FilterDialogContent {...props} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DrawerTrigger asChild>
        <Button variant="outline" className={filterButtonClasses}>
          <Filter className={filterIconClasses} />
        </Button>
      </DrawerTrigger>
      <DrawerContent className="rounded-t-3xl bg-card shadow-xl max-h-[70vh] overflow-hidden flex flex-col">
        <div className="p-0 flex-1 overflow-y-auto">
          <FilterDialogContent {...props} />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
