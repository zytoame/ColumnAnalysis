// src/utils/request.js
import axios from 'axios';
// 如果使用 UI 框架的消息提示
// import { Message } from 'element-ui'; // element-ui
// import { notification, message } from 'antd'; // antd

// 创建 axios 实例
const service = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || '/api', // 根据项目配置
  timeout: 10000, // 请求超时时间
  headers: {
    'Content-Type': 'application/json;charset=utf-8'
  }
});

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 在发送请求之前做些什么
    
    // 1. 添加 token
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 2. 添加请求时间戳（防止缓存）
    if (config.method?.toLowerCase() === 'get') {
      config.params = {
        ...config.params,
        _t: Date.now()
      };
    }
    
    // 3. 显示 loading（如果需要）
    if (config.showLoading !== false) {
      // 可以在这里显示全局 loading
      // showLoading();
    }
    
    // 4. 序列化 POST 请求参数
    if (config.method?.toLowerCase() === 'post' || config.method?.toLowerCase() === 'put') {
      // 处理 FormData
      if (config.data instanceof FormData) {
        config.headers['Content-Type'] = 'multipart/form-data';
      }
    }
    
    return config;
  },
  (error) => {
    // 对请求错误做些什么
    console.error('Request Error:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    // 对响应数据做点什么
    
    // 隐藏 loading
    // hideLoading();
    
    const res = response.data;
    
    // 根据业务状态码处理
    if (res.code === 200 || res.success) {
      return res.data; // 直接返回业务数据
    } else {
      // 业务错误处理
      handleBusinessError(res.code, res.message);
      return Promise.reject(new Error(res.message || 'Error'));
    }
  },
  (error) => {
    // 对响应错误做点什么
    
    // 隐藏 loading
    // hideLoading();
    
    // HTTP 状态码错误处理
    if (error.response) {
      handleHttpError(error.response.status, error.response.data);
    } else if (error.request) {
      // 请求发出但没有收到响应
      handleNetworkError();
    } else {
      // 请求配置错误
      console.error('Request Config Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// 业务错误处理函数
function handleBusinessError(code, message) {
  // 这里可以根据项目使用的 UI 框架选择对应的消息提示方式
  switch (code) {
    case 401:
      // 未授权，跳转到登录页
      console.error('登录已过期，请重新登录');
      localStorage.removeItem('token');
      window.location.href = '/login';
      break;
    case 403:
      console.error('没有权限访问该资源');
      break;
    case 404:
      console.error('请求的资源不存在');
      break;
    case 500:
      console.error('服务器内部错误');
      break;
    default:
      console.error(message || '请求失败');
  }
}

// HTTP 错误处理函数
function handleHttpError(status, data) {
  switch (status) {
    case 400:
      console.error('请求参数错误');
      break;
    case 401:
      console.error('未授权，请重新登录');
      localStorage.removeItem('token');
      window.location.href = '/login';
      break;
    case 403:
      console.error('拒绝访问');
      break;
    case 404:
      console.error('请求的资源不存在');
      break;
    case 405:
      console.error('请求方法不允许');
      break;
    case 408:
      console.error('请求超时');
      break;
    case 500:
      console.error('服务器内部错误');
      break;
    case 501:
      console.error('服务未实现');
      break;
    case 502:
      console.error('网关错误');
      break;
    case 503:
      console.error('服务不可用');
      break;
    case 504:
      console.error('网关超时');
      break;
    default:
      console.error(`请求失败: ${status}`);
  }
}

// 网络错误处理
function handleNetworkError() {
  console.error('网络异常，请检查网络连接');
}

// 导出常用方法
export default service;

// 导出更易用的请求方法
export const request = {
  get(url, config = {}) {
    return service.get(url, config);
  },
  
  post(url, data, config = {}) {
    return service.post(url, data, config);
  },
  
  put(url, data, config = {}) {
    return service.put(url, data, config);
  },
  
  delete(url, config = {}) {
    return service.delete(url, config);
  },
  
  patch(url, data, config = {}) {
    return service.patch(url, data, config);
  },
  
  // 上传文件
  upload(url, formData, config = {}) {
    return service.post(url, formData, {
      ...config,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...config.headers
      }
    });
  },
  
  // 下载文件
  download(url, config = {}) {
    return service.get(url, {
      ...config,
      responseType: 'blob'
    });
  }
};