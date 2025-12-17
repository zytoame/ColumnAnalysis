/**
 * 展开/收起管理 Hook
 */
import { useState, useCallback } from 'react';

export interface UseExpandReturn {
  expandedItems: string[];
  isExpanded: (id: string) => boolean;
  toggleExpand: (id: string) => void;
  expandAll: (ids: string[]) => void;
  collapseAll: () => void;
}

export function useExpand(): UseExpandReturn {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const isExpanded = useCallback(
    (id: string) => {
      return expandedItems.includes(id);
    },
    [expandedItems]
  );

  const toggleExpand = useCallback((id: string) => {
    setExpandedItems((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      }
      return [...prev, id];
    });
  }, []);

  const expandAll = useCallback((ids: string[]) => {
    setExpandedItems(ids);
  }, []);

  const collapseAll = useCallback(() => {
    setExpandedItems([]);
  }, []);

  return {
    expandedItems,
    isExpanded,
    toggleExpand,
    expandAll,
    collapseAll,
  };
}
