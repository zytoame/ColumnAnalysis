import React, { useCallback, useMemo, useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { ChartContainer } from '@/components/ui';
import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend } from 'recharts';

import deviceTrendApi from '@/api/deviceTrend';
import { useToast } from '@/hooks/use-toast';

export default function DeviceTrendDashboard(props) {
  const { style } = props;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState([]); // 所有设备列表
  const [selectedDevice, setSelectedDevice] = useState('');
  const [points, setPoints] = useState([]);

  // 页面加载时获取设备列表
  useEffect(() => {
    fetchDeviceList();
  }, []);

  // 监听选中的设备变化
  useEffect(() => {
    if (selectedDevice) {
      fetchDeviceTrend(selectedDevice);
    }
  }, [selectedDevice]);

  // 获取设备列表
  const fetchDeviceList = async () => {
    setLoading(true);
    try {
      // 这里需要调用获取设备列表的API
      const resp = await deviceTrendApi.getDeviceList();
      const deviceList = resp?.data || [];
      setDevices(deviceList);
      
      // 默认选中第一个设备
      if (deviceList.length > 0) {
        setSelectedDevice(deviceList[0].sn);
      }
    } catch (error) {
      console.error('获取设备列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 获取设备趋势数据（全部数据）
  const fetchDeviceTrend = async (deviceSn) => {
    setLoading(true);
    try {
      // 修改API调用，不传limit参数或传很大的值
      const resp = await deviceTrendApi.getDeviceTrend(deviceSn, 0); // 0表示获取全部
      const list = resp?.data || [];
      setPoints(Array.isArray(list) ? list : []);
    } catch (error) {
      console.error('获取设备趋势数据失败:', error);
      toast({
        title: '加载失败',
        description: '获取设备趋势数据失败',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    return (points || []).map((p, idx) => ({
      n: idx + 1,
      pressure: p?.pressure ?? null,
      peakTime: p?.peakTime ?? null,
      setTemperature: p?.setTemperature ?? null,
      createdAt: p?.createdAt ? new Date(p.createdAt).toLocaleString() : '',
      columnSn: p?.columnSn ?? '',
      productSn: p?.productSn ?? '',
    }));
  }, [points]);

  // 如果数据量很大，可以考虑抽样显示
  const sampledChartData = useMemo(() => {
    if (chartData.length <= 1000) return chartData;
    
    // 每N个点取一个点，保证图表不卡顿
    const sampleInterval = Math.ceil(chartData.length / 1000);
    return chartData.filter((_, index) => index % sampleInterval === 0);
  }, [chartData]);

  return (
    <div style={style}>
      <div className="space-y-6">
        {/* 设备选择器 */}
        <Card>
          <CardHeader>
            <CardTitle>设备趋势监控</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="text-sm mb-1">选择设备</div>
                <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="请选择设备" />
                  </SelectTrigger>
                  <SelectContent>
                    {devices.map((device) => (
                      <SelectItem key={device.sn} value={device.sn}>
                        {device.name || device.sn} {device.model ? `(${device.model})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-500">
                共 {devices.length} 台设备 | {points.length} 条记录
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 实时数据概览 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">最新压力</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {points.length > 0 ? `${points[points.length - 1]?.pressure || '--'} kPa` : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                最后更新: {points.length > 0 ? new Date(points[points.length - 1]?.createdAt).toLocaleTimeString() : '--'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">最新出峰时间</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {points.length > 0 ? `${points[points.length - 1]?.peakTime || '--'} s` : '--'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                历史平均值: {points.length > 0 
                  ? `${(points.reduce((sum, p) => sum + (p.peakTime || 0), 0) / points.length).toFixed(2)} s` 
                  : '--'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">设备状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                <span className="font-medium">运行正常</span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                总运行次数: {points.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 压力趋势图 */}
        <Card>
          <CardHeader>
            <CardTitle>压力趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">加载中...</div>
            ) : points.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                暂无数据
              </div>
            ) : (
              <ChartContainer>
                <LineChart data={sampledChartData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="n" 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: '运行次数', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: '压力 (kPa)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value, name) => {
                      const labels = { pressure: '压力', peakTime: '出峰时间' };
                      return [`${value} ${name === 'pressure' ? 'kPa' : 's'}`, labels[name] || name];
                    }}
                    labelFormatter={(label) => `第${label}次运行`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="pressure" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    dot={false}
                    name="压力"
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* 出峰时间趋势图 */}
        <Card>
          <CardHeader>
            <CardTitle>出峰时间趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-64 flex items-center justify-center">加载中...</div>
            ) : points.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-gray-500">
                暂无数据
              </div>
            ) : (
              <ChartContainer>
                <LineChart data={sampledChartData} margin={{ left: 12, right: 12 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="n" 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: '运行次数', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis 
                    tickLine={false} 
                    axisLine={false}
                    label={{ value: '时间 (秒)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip 
                    formatter={(value) => [`${value} 秒`, '出峰时间']}
                    labelFormatter={(label) => `第${label}次运行`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="peakTime" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                    name="出峰时间"
                  />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}