import axios from 'axios';

const API_BASE_URL = '/api'; // 根据实际部署调整

const reportApi = {
  // 单报告生成
  generateReport: (columnSn, mode) => 
    axios.post(`${API_BASE_URL}/report/generate`, { columnSn, mode }, { responseType: 'blob' }),

  // 异步任务：批量生成（仅生成不下载）
  submitGenerateOnlyTask: (columnSns, mode) => {
    const body = { columnSns, mode };
    return axios.post(`${API_BASE_URL}/report/tasks/generate`, body).then((response) => response.data);
  },

  // 异步任务：批量生成并打包ZIP
  submitGenerateZipTask: (columnSns, mode) => {
    const body = { columnSns, mode };
    return axios.post(`${API_BASE_URL}/report/tasks/generate-zip`, body).then((response) => response.data);
  },

  // 异步任务：仅打包已有报告ZIP（不触发生成）
  submitZipExistingTask: (columnSns) => {
    return axios.post(`${API_BASE_URL}/report/tasks/zip-existing`, columnSns).then((response) => response.data);
  },

  // 异步任务：查询任务状态
  getTask: (taskId) =>
    axios.get(`${API_BASE_URL}/report/tasks/${taskId}`).then((response) => response.data),

  // 异步任务：下载任务ZIP
  downloadTaskZip: (taskId) =>
    axios.get(`${API_BASE_URL}/report/tasks/${taskId}/download`, { responseType: 'blob' }),

  // 搜索报告
  searchReports: (searchParams, pageNum = 1, pageSize = 10) => {
    return axios.post(`${API_BASE_URL}/report/search`, searchParams, {
    params: {
      pageNum,
      pageSize
    }
  }).then(response => response.data);
  },

  // 下载报告
  downloadReport: (columnSn) =>
    axios.get(`${API_BASE_URL}/report/download/${columnSn}`, {
      responseType: 'blob'
    }),

  // 删除报告
  deleteReport: (id) => axios.delete(`${API_BASE_URL}/report/${id}`),

  // 预览报告
  previewReport: (columnSn) =>
    axios.get(`${API_BASE_URL}/report/preview`,{
      params: { columnSn },
      responseType: 'blob'
    }),

  // 获取统计
  getStatistics: () =>
    axios.get(`${API_BASE_URL}/report/statistics`)
};

export default reportApi;