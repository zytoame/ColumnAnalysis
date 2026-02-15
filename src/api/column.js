import http from '../lib/http';

const columnApi = {
  // 获取待审核层析柱列表（后端分页）
  getPendingReviewColumns: (pageNum = 1, pageSize = 10) =>
    http.get(`/column/pending-review`, {
      params: { pageNum, pageSize },
    }),

  // 获取不合格层析柱列表（后端分页）
  getUnqualifiedColumns: (pageNum = 1, pageSize = 10) =>
    http.get(`/column/unqualified`, {
      params: { pageNum, pageSize },
    }),

  // 获取未匹配层析柱列表（后端分页）
  getUnmatchedColumns: (pageNum = 1, pageSize = 10, keyword) =>
    http.get(`/column/unmatched`, {
      params: { pageNum, pageSize, keyword },
    }),

  // 高级搜索（后端分页）
  advancedSearch: (searchParams, pageNum = 1, pageSize = 10) =>
    http.post(`/column/advanced-search`, searchParams, {
      params: { pageNum, pageSize },
    }).then((response) => response.data),

  // 查询层析柱标准
  getColumnStandard: (columnSn) =>
    http.get(`/column/standard`, {
      params: { columnSn },
    }),

  // 标准/模板列表查询
  listStandards: (params) =>
    http.get(`/column/standard/list`, {
      params,
    }),

  // 新增层析柱标准
  addStandard: (standard) =>
    http.post(`/column/standard`, standard),

  // 修改层析柱标准
  updateStandard: (standard) =>
    http.put(`/column/standard`, standard),

  // 按ID删除层析柱标准
  deleteStandardById: (id) =>
    http.delete(`/column/standard/${id}`),

  // 查询层析柱重复性测值
  getRepeatabilityData: (columnSn) =>
    http.get(`/column/repeatability`, {
      params: { columnSn },
    }),

  // 批量审核通过
  batchApprove: (columnSns) =>
    http.post(`/column/batch-approve`, columnSns),

  // 更新层析柱数据并验证
  updateColumnData: (request) =>
    http.post(`/column/update-column-data`, request),

  // 删除层析柱相关数据（支持两种模式）
  deleteByColumnSn: (columnSn, deleteMode = 'ONLY_COLUMN') =>
    http.delete(`/column/${columnSn}`, {
      params: { deleteMode },
    }).then((response) => response.data),
};

export default columnApi;
