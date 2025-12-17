/**
 * 分页 Hook
 */
import { useState, useMemo, useCallback } from 'react';
import { calculatePagination, PaginationResult } from '@/utils/pagination';
import { PAGINATION } from '@/constants';

export interface UsePaginationOptions {
  pageSize?: number;
}

export interface UsePaginationReturn<T> {
  currentPage: number;
  pageSize: number;
  setCurrentPage: (page: number) => void;
  pagination: PaginationResult;
  reset: () => void;
}

export function usePagination<T>(
  items: T[],
  options: UsePaginationOptions = {}
): UsePaginationReturn<T> {
  const { pageSize = PAGINATION.DEFAULT_PAGE_SIZE } = options;
  const [currentPage, setCurrentPage] = useState(1);

  const pagination = useMemo(() => {
    return calculatePagination(items, currentPage, pageSize);
  }, [items, currentPage, pageSize]);

  const reset = useCallback(() => {
    setCurrentPage(1);
  }, []);

  return {
    currentPage,
    pageSize,
    setCurrentPage,
    pagination,
    reset,
  };
}
