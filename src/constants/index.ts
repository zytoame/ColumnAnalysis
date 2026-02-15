/**
 * 应用常量定义
 */

// 检测类型
export const TEST_TYPES = {
  ALL: 'all',
  GLYCATION: '糖化模式',
  THALASSEMIA: '地贫模式',
} as const;

// 检测结果
export const TEST_RESULTS = {
  ALL: 'all',
  QUALIFIED: '合格',
  UNQUALIFIED: '不合格',
} as const;

// 审核状态
export const AUDIT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

// 结论状态
export const CONCLUSION_STATUS = {
  QUALIFIED: 'qualified',
  UNQUALIFIED: 'unqualified',
} as const;

// 检测结论
export const DETECTION_CONCLUSION = {
  PASS: 'pass',
  FAIL: 'fail',
} as const;

// 分页配置
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 200,
} as const;

// 报告类型
export const REPORT_TYPES = {
  GLYCATION: 'glycation',
  THALASSEMIA: 'thalassemia',
} as const;

// 时间范围
export const DATE_RANGES = {
  ALL: 'all',
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
} as const;

// 检测项目名称映射
export const DETECTION_ITEM_NAMES = {
  setTemperature: '设置温度',
  pressure: '系统压力',
  peakTime: '出峰时间',
  repeatabilityTest: '重复性测试',
  appearanceInspection: '外观检查',
  hbA1cPeakTime: 'HbA1c出峰时间',
} as const;

// 用户类型
export const USER_TYPES = {
  ADMIN: 'admin',
  CUSTOMER: 'customer',
} as const;

// 用户类型显示名称
export const USER_TYPE_LABELS = {
  [USER_TYPES.ADMIN]: '管理员',
  [USER_TYPES.CUSTOMER]: '用户',
} as const;

// 报告类型显示名称
export const REPORT_TYPE_LABELS = {
  [REPORT_TYPES.GLYCATION]: '糖化模式',
  [REPORT_TYPES.THALASSEMIA]: '地贫模式',
} as const;

// 审核操作
export const AUDIT_ACTIONS = {
  APPROVE: 'approve',
  REJECT: 'reject',
} as const;

// 审核操作显示名称
export const AUDIT_ACTION_LABELS = {
  [AUDIT_ACTIONS.APPROVE]: '通过',
  [AUDIT_ACTIONS.REJECT]: '拒绝',
} as const;
