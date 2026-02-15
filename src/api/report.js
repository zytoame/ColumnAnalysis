import http from '../lib/http';

const reportApi = {
  // 单报告生成
  generateReport: (columnSn, mode) => 
    http.post(`/report/generate`, { columnSn, mode }, { responseType: 'blob' }),

  // 异步任务：批量生成（仅生成不下载）
  submitGenerateOnlyTask: (columnSns, mode) => {
    const body = { columnSns, mode };
    return http.post(`/report/tasks/generate`, body).then((response) => response.data);
  },

  // 异步任务：批量生成并打包ZIP
  submitGenerateZipTask: (columnSns, mode) => {
    const body = { columnSns, mode };
    return http.post(`/report/tasks/generate-zip`, body).then((response) => response.data);
  },

  // 异步任务：仅打包已有报告ZIP（不触发生成）
  submitZipExistingTask: (columnSns) => {
    return http.post(`/report/tasks/zip-existing`, columnSns).then((response) => response.data);
  },

  // 异步任务：查询任务状态
  getTask: (taskId) =>
    http.get(`/report/tasks/${taskId}`).then((response) => response.data),

  // 异步任务：下载任务ZIP
  downloadTaskZip: (taskId) =>
    http.get(`/report/tasks/${taskId}/download`, { responseType: 'blob' }),

  // 按筛选条件直接打包下载ZIP（同步流式）
  downloadZipBySearchParams: (searchParams) =>
    http.post(`/report/download-zip`, searchParams, { responseType: 'blob' }),

  // 搜索报告
  searchReports: (searchParams, pageNum = 1, pageSize = 10) => {
    return http.post(`/report/search`, searchParams, {
    params: {
      pageNum,
      pageSize
    }
  }).then(response => response.data);
  },

  // 下载报告
  downloadReport: (columnSn) =>
    http.get(`/report/download/${columnSn}`, {
      responseType: 'blob'
    }),

  // 删除报告
  deleteReport: (id) => http.delete(`/report/${id}`),

  // 预览报告
  previewReport: (columnSn) =>
    http.get(`/report/preview`,{
      params: { columnSn },
      responseType: 'blob'
    }),

  // 获取统计
  getStatistics: () =>
    http.get(`/report/statistics`)
};

export default reportApi;