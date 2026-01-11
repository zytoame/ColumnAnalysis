import axios from 'axios';

const API_BASE_URL = '/api'; // 根据实际部署调整

const columnApi = {
  // 获取待审核层析柱列表（后端分页）
  getPendingReviewColumns: (pageNum = 1, pageSize = 10) =>
    axios.get(`${API_BASE_URL}/column/pending-review`, {
      params: { pageNum, pageSize },
    }),

  // 获取不合格层析柱列表（后端分页）
  getUnqualifiedColumns: (pageNum = 1, pageSize = 10) =>
    axios.get(`${API_BASE_URL}/column/unqualified`, {
      params: { pageNum, pageSize },
    }),

  // 高级搜索（后端分页）
  advancedSearch: (searchParams, pageNum = 1, pageSize = 10) =>
    axios.post(`${API_BASE_URL}/column/advanced-search`, searchParams, {
      params: { pageNum, pageSize },
    }).then((response) => response.data),

  // 查询层析柱标准
  getColumnStandard: (columnSn) =>
    axios.get(`${API_BASE_URL}/column/standard`, {
      params: { columnSn },
    }),

  // 标准/模板列表查询
  listStandards: (params) =>
    axios.get(`${API_BASE_URL}/column/standard/list`, {
      params,
    }),

  // 新增层析柱标准
  addStandard: (standard) =>
    axios.post(`${API_BASE_URL}/column/standard`, standard),

  // 修改层析柱标准
  updateStandard: (standard) =>
    axios.put(`${API_BASE_URL}/column/standard`, standard),

  // 按ID删除层析柱标准
  deleteStandardById: (id) =>
    axios.delete(`${API_BASE_URL}/column/standard/${id}`),

  // 查询层析柱重复性测值
  getRepeatabilityData: (columnSn) =>
    axios.get(`${API_BASE_URL}/column/repeatability`, {
      params: { columnSn },
    }),

  // 批量审核通过
  batchApprove: (columnSns) =>
    axios.post(`${API_BASE_URL}/column/batch-approve`, columnSns),

  // 更新层析柱数据并验证
  updateColumnData: (request) =>
    axios.post(`${API_BASE_URL}/column/update-column-data`, request),

  // 删除层析柱相关数据（支持两种模式）
  deleteByColumnSn: (columnSn, deleteMode = 'ONLY_COLUMN') =>
    axios.delete(`${API_BASE_URL}/column/${columnSn}`, {
      params: { deleteMode },
    }).then((response) => response.data),
};

export default columnApi;
