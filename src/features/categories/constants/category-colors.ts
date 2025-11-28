/**
 * Category Color Palette
 * Predefined colors for category creation and editing
 */

export interface ColorOption {
  name: string;
  value: string;
}

export const CATEGORY_COLOR_PALETTE: ColorOption[] = [
  { name: "Rosso", value: "#EF4444" },
  { name: "Arancione", value: "#F97316" },
  { name: "Ambra", value: "#F59E0B" },
  { name: "Giallo", value: "#EAB308" },
  { name: "Verde", value: "#22C55E" },
  { name: "Smeraldo", value: "#10B981" },
  { name: "Turchese", value: "#14B8A6" },
  { name: "Ciano", value: "#06B6D4" },
  { name: "Blu", value: "#3B82F6" },
  { name: "Indaco", value: "#6366F1" },
  { name: "Viola", value: "#8B5CF6" },
  { name: "Porpora", value: "#A855F7" },
  { name: "Rosa", value: "#EC4899" },
  { name: "Fucsia", value: "#D946EF" },
  { name: "Grigio", value: "#6B7280" },
  { name: "Ardesia", value: "#475569" },
];

export const DEFAULT_CATEGORY_COLOR = "#6366F1"; // Indaco
