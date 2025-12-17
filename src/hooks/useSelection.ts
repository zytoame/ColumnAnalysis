/**
 * 选择管理 Hook
 */
import { useState, useCallback, useMemo } from 'react';

export interface UseSelectionReturn {
  selectedItems: string[];
  isSelected: (id: string) => boolean;
  isAllSelected: (items: { id: string }[]) => boolean;
  toggleSelection: (id: string) => void;
  toggleSelectAll: (items: { id: string }[], checked: boolean) => void;
  clearSelection: () => void;
  selectItems: (ids: string[]) => void;
}

export function useSelection(): UseSelectionReturn {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const isSelected = useCallback(
    (id: string) => {
      return selectedItems.includes(id);
    },
    [selectedItems]
  );

  const isAllSelected = useCallback(
    (items: { id: string }[]) => {
      return items.length > 0 && items.every((item) => selectedItems.includes(item.id));
    },
    [selectedItems]
  );

  const toggleSelection = useCallback((id: string) => {
    setSelectedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  }, []);

  const toggleSelectAll = useCallback(
    (items: { id: string }[], checked: boolean) => {
      if (checked) {
        const newSelected = items.map((item) => item.id);
        setSelectedItems((prev) => {
          const combined = [...prev, ...newSelected];
          return Array.from(new Set(combined));
        });
      } else {
        const itemIds = items.map((item) => item.id);
        setSelectedItems((prev) => prev.filter((id) => !itemIds.includes(id)));
      }
    },
    []
  );

  const clearSelection = useCallback(() => {
    setSelectedItems([]);
  }, []);

  const selectItems = useCallback((ids: string[]) => {
    setSelectedItems(ids);
  }, []);

  return {
    selectedItems,
    isSelected,
    isAllSelected,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    selectItems,
  };
}
