import axios from 'axios';

const API_BASE_URL = '/api'; // 根据实际部署调整

const reportApi = {
  // 单报告生成
  generateReport: (columnSn) => 
    axios.post(`${API_BASE_URL}/report/generate`, { columnSn }),

  // 批量生成
  generateBatchReports: (columnSns) =>
    axios.post(`${API_BASE_URL}/report/generate-batch`, columnSns),

  // 查询报告
  getReportsByColumn: (columnSn, pageNum = 1, pageSize = 10) =>
    axios.get(`${API_BASE_URL}/report/by-column/${columnSn}`, {
      params: { pageNum, pageSize }
    }),

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

  // 批量下载报告
  downloadBatchReports: (columnSns) =>
    axios.post(`${API_BASE_URL}/report/download-batch`, columnSns, {
      responseType: 'json'
    }),

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