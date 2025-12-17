/**
 * 分页工具函数
 */

export interface PaginationConfig {
  pageNum: number;
  pageSize: number;
  total: number;
}

export interface PaginationResult {
  totalPages: number;
  startIndex: number;
  endIndex: number;
  currentItems: any[];
}

/**
 * 计算分页信息
 */
export function calculatePagination<T>(
  items: T[],
  pageNum: number,
  pageSize: number
): PaginationResult {
  const totalPages = Math.ceil(items.length / pageSize);
  const startIndex = (pageNum - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentItems = items.slice(startIndex, endIndex);

  return {
    totalPages,
    startIndex,
    endIndex,
    currentItems,
  };
}

/**
 * 生成分页页码数组（带省略号）
 */
export function generatePageNumbers(
  pageNum: number,
  totalPages: number
): (number | 'ellipsis')[] {
  if (totalPages <= 1) return [];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  // 总是显示第一页
  pages.push(1);

  // 计算显示范围
  const showRange = 2;
  const startPage = Math.max(2, pageNum - showRange);
  const endPage = Math.min(totalPages - 1, pageNum + showRange);

  // 添加省略号或页码
  if (startPage > 2) {
    pages.push('ellipsis');
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  // 添加省略号或页码
  if (endPage < totalPages - 1) {
    pages.push('ellipsis');
  }

  // 总是显示最后一页
  if (totalPages > 1) {
    pages.push(totalPages);
  }

  return pages;
}
