import { get } from 'http';
import http from '../lib/http';

const deviceTrendApi = {
  // 获取设备列表
  getDeviceList: () =>
    http.get('/api/column/devices'),
  // 获取设备趋势数据
  getDeviceTrend: (deviceSn, limit) =>
    http.get(`/api/column/device-trend`, {
      params: { deviceSn, limit },
    }),
};

export default deviceTrendApi;