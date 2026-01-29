import service from './request';

const API_BASE_URL = '/api'; // 根据实际部署调整

const columnApi = {
  // 获取待审核层析柱列表（后端分页）
  getPendingReviewColumns: (pageNum = 1, pageSize = 10) =>
    service.get(`/column/pending-review`, {
      params: { pageNum, pageSize },
    }),

  // 获取不合格层析柱列表（后端分页）
  getUnqualifiedColumns: (pageNum = 1, pageSize = 10) =>
    service.get(`/column/unqualified`, {
      params: { pageNum, pageSize },
    }),

  // 高级搜索（后端分页）
  advancedSearch: (searchParams, pageNum = 1, pageSize = 10) =>
    service.post(`/column/advanced-search`, searchParams, {
      params: { pageNum, pageSize },
    }).then((response) => response.data),

  // 查询层析柱标准
  getColumnStandard: (columnSn) =>
    service.get(`/column/standard`, {
      params: { columnSn },
    }),

  // 标准/模板列表查询
  listStandards: (params) =>
    service.get(`/column/standard/list`, {
      params,
    }),

  // 新增层析柱标准
  addStandard: (standard) =>
    service.post(`/column/standard`, standard),

  // 修改层析柱标准
  updateStandard: (standard) =>
    service.put(`/column/standard`, standard),

  // 按ID删除层析柱标准
  deleteStandardById: (id) =>
    service.delete(`/column/standard/${id}`),

  // 查询层析柱重复性测值
  getRepeatabilityData: (columnSn) =>
    service.get(`/column/repeatability`, {
      params: { columnSn },
    }),

  // 批量审核通过
  batchApprove: (columnSns) =>
    service.post(`/column/batch-approve`, columnSns),

  // 更新层析柱数据并验证
  updateColumnData: (request) =>
    service.post(`/column/update-column-data`, request),

  // 删除层析柱相关数据（支持两种模式）
  deleteByColumnSn: (columnSn, deleteMode = 'ONLY_COLUMN') =>
    service.delete(`/column/${columnSn}`, {
      params: { deleteMode },
    }).then((response) => response.data),
};

export default columnApi;
