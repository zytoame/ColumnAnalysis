export const env = {
  API_URL: import.meta.env.VITE_API_BASE_URL,
  NODE_ENV: import.meta.env.MODE,  // Vite 中使用 MODE 替代 NODE_ENV
} as const;
// 导出类型定义
export type Env = typeof env;

export default env;