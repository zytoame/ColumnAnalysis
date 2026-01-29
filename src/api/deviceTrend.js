import service from './request';

const API_BASE_URL = '/api';

const deviceTrendApi = {
  getDeviceTrend: (deviceSn, limit) =>
    service.get(`/column/device-trend`, {
      params: { deviceSn, limit },
    }),
};

export default deviceTrendApi;