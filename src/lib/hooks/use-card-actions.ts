/**
 * Card Action Hooks
 *
 * Shared hooks for card interactions
 * Follows DRY principle by centralizing common card behavior
 */

import { useCallback, useState } from 'react';

/**
 * Hook for card selection behavior
 * Useful for multi-select card lists
 */
export function useCardSelection<T extends { id: string }>(
  initialSelected: string[] = []
) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected);

  const toggleSelection = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
  }, []);

  const selectAll = useCallback((items: T[]) => {
    setSelectedIds(items.map((item) => item.id));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  const isSelected = useCallback(
    (id: string) => selectedIds.includes(id),
    [selectedIds]
  );

  return {
    selectedIds,
    toggleSelection,
    selectAll,
    clearSelection,
    isSelected,
    hasSelection: selectedIds.length > 0,
    selectionCount: selectedIds.length,
  };
}

/**
 * Hook for card hover behavior
 * Useful for showing/hiding actions on hover
 */
export function useCardHover() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const onMouseEnter = useCallback((id: string) => {
    setHoveredId(id);
  }, []);

  const onMouseLeave = useCallback(() => {
    setHoveredId(null);
  }, []);

  const isHovered = useCallback(
    (id: string) => hoveredId === id,
    [hoveredId]
  );

  return {
    hoveredId,
    onMouseEnter,
    onMouseLeave,
    isHovered,
  };
}

/**
 * Hook for card expansion behavior
 * Useful for expandable cards with details
 */
export function useCardExpansion(initialExpandedIds: string[] = []) {
  const [expandedIds, setExpandedIds] = useState<string[]>(initialExpandedIds);

  const toggleExpansion = useCallback((id: string) => {
    setExpandedIds((prev) =>
      prev.includes(id) ? prev.filter((expandedId) => expandedId !== id) : [...prev, id]
    );
  }, []);

  const expandAll = useCallback((ids: string[]) => {
    setExpandedIds(ids);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedIds([]);
  }, []);

  const isExpanded = useCallback(
    (id: string) => expandedIds.includes(id),
    [expandedIds]
  );

  return {
    expandedIds,
    toggleExpansion,
    expandAll,
    collapseAll,
    isExpanded,
  };
}

/**
 * Hook for card keyboard navigation
 * Useful for accessible card lists
 */
export function useCardKeyboardNavigation<T extends { id: string }>(
  items: T[],
  onSelect?: (item: T) => void
) {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((prev) => Math.min(prev + 1, items.length - 1));
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((prev) => Math.max(prev - 1, 0));
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (onSelect && items[focusedIndex]) {
            onSelect(items[focusedIndex]);
          }
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          event.preventDefault();
          setFocusedIndex(items.length - 1);
          break;
      }
    },
    [focusedIndex, items, onSelect]
  );

  const focusedItem = items[focusedIndex] || null;

  return {
    focusedIndex,
    focusedItem,
    setFocusedIndex,
    handleKeyDown,
  };
}
