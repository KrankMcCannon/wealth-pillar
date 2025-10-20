"use client";

import * as React from "react";
import * as icons from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Icon Picker Component
 *
 * Beautiful icon picker using Lucide React icons library.
 * Provides search functionality and categorized icon display.
 *
 * Features:
 * - 100+ popular icons from Lucide React
 * - Real-time search/filter functionality
 * - Smooth scrolling with styled scrollbars
 * - Visual feedback on selection
 * - Organized by categories (finance, shopping, transport, etc.)
 *
 * @example
 * ```tsx
 * <IconPicker
 *   value={formData.icon}
 *   onChange={(iconName) => handleChange('icon', iconName)}
 * />
 * ```
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface IconPickerProps {
  /** Current selected icon name */
  value: string;
  /** Callback when icon changes */
  onChange: (iconName: string) => void;
  /** Additional CSS classes */
  className?: string;
}

// ============================================================================
// ICON CATEGORIES
// ============================================================================

const ICON_CATEGORIES = {
  all: {
    label: "Tutti",
    icons: [] as string[], // Will be populated dynamically
  },
  finance: {
    label: "Finanza",
    icons: [
      "Wallet", "CreditCard", "Banknote", "PiggyBank", "TrendingUp", "TrendingDown",
      "DollarSign", "Euro", "CircleDollarSign", "Landmark", "Receipt", "Calculator",
    ],
  },
  shopping: {
    label: "Shopping",
    icons: [
      "ShoppingCart", "ShoppingBag", "Store", "Coffee", "UtensilsCrossed", "Pizza",
      "Wine", "IceCream", "Sandwich", "Apple", "Beef", "Fish",
    ],
  },
  transport: {
    label: "Trasporti",
    icons: [
      "Car", "Bus", "Train", "Plane", "Ship", "Bike", "Fuel", "ParkingCircle",
    ],
  },
  home: {
    label: "Casa",
    icons: [
      "Home", "Building", "Building2", "Sofa", "Bed", "Lamp", "Tv", "Refrigerator",
      "WashingMachine", "AirVent", "Lightbulb", "Hammer",
    ],
  },
  health: {
    label: "Salute",
    icons: [
      "Heart", "Activity", "Dumbbell", "Stethoscope", "Pill", "Syringe",
    ],
  },
  entertainment: {
    label: "Svago",
    icons: [
      "Film", "Music", "Tv2", "Gamepad2", "Ticket", "Trophy", "Medal", "PartyPopper",
      "Gift", "Sparkles", "Camera", "Headphones",
    ],
  },
  work: {
    label: "Lavoro",
    icons: [
      "GraduationCap", "BookOpen", "Book", "Briefcase", "Laptop", "Monitor",
      "Smartphone", "Phone", "Mail", "FileText", "Folder", "Printer",
    ],
  },
  utilities: {
    label: "Utilità",
    icons: [
      "Zap", "Droplet", "Wifi", "CloudRain", "Shield", "Lock", "Key", "Bell",
      "Settings", "Tool", "Wrench", "Scissors",
    ],
  },
  nature: {
    label: "Natura",
    icons: [
      "Sun", "Moon", "CloudSun", "CloudSnow", "Snowflake", "Wind", "Leaf", "Tree",
      "Flower", "Sprout",
    ],
  },
  people: {
    label: "Persone",
    icons: [
      "User", "Users", "Baby", "UserCircle", "HeartHandshake", "MessageCircle", "PhoneCall",
    ],
  },
  misc: {
    label: "Altro",
    icons: [
      "Star", "Flag", "Tag", "Bookmark", "Clock", "Calendar", "MapPin", "Navigation",
      "Compass", "Globe", "Package", "Box", "Archive", "Trash",
    ],
  },
} as const;

// Populate "all" category with all icons
ICON_CATEGORIES.all.icons = Object.values(ICON_CATEGORIES)
  .filter(cat => cat.label !== "Tutti")
  .flatMap(cat => cat.icons);

type CategoryKey = keyof typeof ICON_CATEGORIES;

// ============================================================================
// COMPONENT
// ============================================================================

export function IconPicker({
  value,
  onChange,
  className,
}: IconPickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState<CategoryKey>("all");

  // Get the selected icon component
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const iconRecord = icons as any;
  const SelectedIcon = value && iconRecord[value]
    ? iconRecord[value]
    : icons.HelpCircle;

  // Filter icons based on search and category
  const filteredIcons = React.useMemo(() => {
    const iconsToFilter = ICON_CATEGORIES[selectedCategory].icons;

    if (!searchQuery) return iconsToFilter;

    const query = searchQuery.toLowerCase();
    return iconsToFilter.filter(iconName =>
      iconName.toLowerCase().includes(query)
    );
  }, [searchQuery, selectedCategory]);

  const handleIconSelect = (iconName: string) => {
    onChange(iconName);
    setIsOpen(false);
    setSearchQuery("");
    setSelectedCategory("all");
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent, iconName: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleIconSelect(iconName);
    }
  };

  const renderIconGrid = (iconsList: string[]) => {
    if (iconsList.length === 0) {
      return (
        <div className="flex items-center justify-center min-h-[300px] py-8 text-center text-sm text-muted-foreground">
          Nessuna icona trovata
        </div>
      );
    }

    return (
      <div className="grid grid-cols-6 gap-2 p-3 pb-6">
        {iconsList.map((iconName) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const iconRecord = icons as any;
          const IconComponent = iconRecord[iconName];
          if (!IconComponent) return null;

          const isSelected = value === iconName;

          return (
            <button
              key={iconName}
              onClick={() => handleIconSelect(iconName)}
              onKeyDown={(e) => handleKeyDown(e, iconName)}
              className={cn(
                "flex items-center justify-center h-10 w-10 rounded-lg transition-all duration-200",
                "hover:bg-primary/10 hover:scale-105",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
                isSelected && "bg-primary text-white shadow-md",
                !isSelected && "text-primary hover:text-primary"
              )}
              title={iconName}
              aria-label={`Seleziona icona ${iconName}`}
              aria-pressed={isSelected}
              type="button"
              tabIndex={0}
            >
              <IconComponent className="h-5 w-5" />
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className={cn("space-y-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-full h-10 justify-start text-left font-normal rounded-lg border-primary/20 bg-card hover:bg-card"
            aria-label={value ? `Icona selezionata: ${value}. Clicca per cambiare` : "Seleziona un'icona"}
            aria-haspopup="dialog"
            aria-expanded={isOpen}
          >
            <SelectedIcon className="mr-2 h-4 w-4 text-primary" aria-hidden="true" />
            <span className="text-muted-foreground">
              {value || "Seleziona un'icona"}
            </span>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent
          className="w-[400px] p-0 bg-card"
          align="start"
          side="bottom"
          sideOffset={5}
          collisionPadding={10}
          role="dialog"
          aria-label="Selettore icone"
        >
          {/* Search Input - Fixed at top */}
          <div className="p-3 border-b border-primary/20 bg-card/50 backdrop-blur-sm">
            <Input
              placeholder="Cerca icona..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9 bg-card"
              autoFocus={false}
              aria-label="Cerca icona per nome"
              role="searchbox"
            />
          </div>

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={(v) => setSelectedCategory(v as CategoryKey)}>
            {/* Horizontal scrollable tabs */}
            <div className="border-b border-primary/20 bg-card/30 backdrop-blur-sm">
              <ScrollArea className="w-full whitespace-nowrap">
                <TabsList
                  className="inline-flex h-10 w-full justify-start rounded-none bg-transparent p-0"
                  aria-label="Categorie icone"
                >
                  {(Object.keys(ICON_CATEGORIES) as CategoryKey[]).map((categoryKey) => (
                    <TabsTrigger
                      key={categoryKey}
                      value={categoryKey}
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-3 text-xs"
                      aria-label={`Filtra per categoria: ${ICON_CATEGORIES[categoryKey].label}`}
                    >
                      {ICON_CATEGORIES[categoryKey].label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </ScrollArea>
            </div>

            {/* Tab Contents - All share same scrollable grid */}
            <div role="status" aria-live="polite" className="sr-only">
              {filteredIcons.length > 0
                ? `${filteredIcons.length} icone disponibili`
                : "Nessuna icona trovata"}
            </div>
            <div className="h-[300px] overflow-y-auto overflow-x-hidden" aria-label="Lista icone">
              {renderIconGrid(filteredIcons)}
            </div>
          </Tabs>
        </PopoverContent>
      </Popover>
    </div>
  );
}
