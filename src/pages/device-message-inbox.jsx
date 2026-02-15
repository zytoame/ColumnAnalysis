import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wrench } from 'lucide-react';
import deviceMessageInboxApi from '@/api/deviceMessageInbox';
import { showErrorToast } from '@/utils/toast';

const STATUS_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'RECEIVED', label: '已接收' },
  { value: 'UNDETERMINED', label: '内容缺失' },
  { value: 'PROCESSED', label: '已处理' },
  { value: 'FAILED', label: '处理失败' },
];

const MODE_OPTIONS = [
  { value: 'all', label: '全部' },
  { value: 'glycation', label: '糖化' },
  { value: 'thalassemia', label: '地贫' },
];

const GROUP_LABELS = {
  '设备信息': '设备信息',
  records: '检测记录',
  EV_records: '重复性测值',
  r_records: '试剂信息',
  c_records: '校准信息',
  qc_records: '质控信息',
};

const FIELD_LABELS = {
  Version: '协议版本',
  SN: '仪器序列号',
  model: '机型',
  mode: '检测模式',

  column_sn: '层析柱序列号',
  pre_column_sn: '预处理柱编号',
  second: '秒数',
  inspection_date: '检测日期',
  set_temperature: '设定温度',
  env_temperature: '环境温度',
  pressure: '压力',
  peak_time: '峰时间',

  f_peak_time: 'F峰时间',
  a1c_peak_time: 'A1C峰时间',
  a2_peak_time: 'A2峰时间',

  f_EV: 'F有效期',
  a1c_EV: 'A1C有效期',
  a2_EV: 'A2有效期',

  r_a_lot: '试剂A批号',
  r_b_lot: '试剂B批号',
  r_c_lot: '试剂C批号',
  r_d_lot: '试剂D批号',
  r_l_lot: '试剂L批号',

  c1_lot: '校准品1批号',
  c1_conc: '校准品1浓度',
  c1_f_conc: '校准品1-F浓度',
  c1_a1c_conc: '校准品1-A1C浓度',
  c1_a2_conc: '校准品1-A2浓度',
  c2_lot: '校准品2批号',
  c2_conc: '校准品2浓度',
  c2_f_conc: '校准品2-F浓度',
  c2_a1c_conc: '校准品2-A1C浓度',
  c2_a2_conc: '校准品2-A2浓度',
  k: 'K值',
  b: 'B值',

  f_k: 'F-K值',
  a1c_k: 'A1C-K值',
  a2_k: 'A2-K值',
  f_b: 'F-B值',
  a1c_b: 'A1C-B值',
  a2_b: 'A2-B值',

  qc1_lot: '质控品1批号',
  qc1_target: '质控品1靶值',
  qc1_f_target: '质控品1-F靶值',
  qc1_a1c_target: '质控品1-A1C靶值',
  qc1_a2_target: '质控品1-A2靶值',
  qc1_SD: '质控品1标准差',
  qc1_expiry_date: '质控品1有效期',
  qc1_conc: '质控品1浓度',
  qc1_f_conc: '质控品1-F浓度',
  qc1_a1c_conc: '质控品1-A1C浓度',
  qc1_a2_conc: '质控品1-A2浓度',
  qc1_test_value: '质控品1测值',
  qc1_f_test_value: '质控品1-F测值',
  qc1_a1c_test_value: '质控品1-A1C测值',
  qc1_a2_test_value: '质控品1-A2测值',
  qc2_lot: '质控品2批号',
  qc2_target: '质控品2靶值',
  qc2_f_target: '质控品2-F靶值',
  qc2_a1c_target: '质控品2-A1C靶值',
  qc2_a2_target: '质控品2-A2靶值',
  qc2_SD: '质控品2标准差',
  qc2_expiry_date: '质控品2有效期',
  qc2_conc: '质控品2浓度',
  qc2_f_conc: '质控品2-F浓度',
  qc2_a1c_conc: '质控品2-A1C浓度',
  qc2_a2_conc: '质控品2-A2浓度',
  qc2_test_value: '质控品2测值',
  qc2_f_test_value: '质控品2-F测值',
  qc2_a1c_test_value: '质控品2-A1C测值',
  qc2_a2_test_value: '质控品2-A2测值',
};

function safeJsonParse(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}

function formatMissingFields(missingFields) {
  if (!missingFields) return '';
  const arr = safeJsonParse(missingFields);
  if (!Array.isArray(arr)) return String(missingFields);
  return arr.join(', ');
}

function formatJsonPretty(objOrStr) {
  if (objOrStr == null) return '';
  if (typeof objOrStr === 'string') {
    const obj = safeJsonParse(objOrStr);
    if (obj) return JSON.stringify(obj, null, 2);
    return objOrStr;
  }
  return JSON.stringify(objOrStr, null, 2);
}

function getValue(obj, path) {
  if (!obj) return undefined;
  const parts = String(path).split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null) return undefined;
    cur = cur[p];
  }
  return cur;
}

function setValueByPath(obj, path, value) {
  if (!obj || !path) return;
  const parts = String(path).split('.').filter(Boolean);
  if (!parts.length) return;
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (cur[k] == null || typeof cur[k] !== 'object' || Array.isArray(cur[k])) {
      cur[k] = {};
    }
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
}

function tryParseStructuredValue(val) {
  const s = String(val ?? '');
  const t = s.trim();
  if (!t) return '';
  const looksJson =
    (t.startsWith('{') && t.endsWith('}')) || (t.startsWith('[') && t.endsWith(']'));
  if (!looksJson) return s;
  try {
    return JSON.parse(t);
  } catch (e) {
    return s;
  }
}

function isReadOnlyEditKey(editKey) {
  return false;
}

function mapEditKeyToJsonPath(editKey) {
  const parts = String(editKey || '').split('.');
  const group = parts[0];
  const rest = parts.slice(1).join('.');

  if (group === '设备信息') {
    if (rest === 'Version') return 'Version';
    if (rest === 'SN') return 'device_data.SN';
    if (rest === 'model') return 'device_data.model';
    if (rest === 'mode') return 'device_data.mode';
    return null;
  }

  if (group === 'records') {
    if (!rest) return null;
    if (rest === 'column_sn') return 'device_data.records.column_sn';
    if (rest.startsWith('peak_time.')) {
      const sub = rest.replace('peak_time.', '');
      if (['f_peak_time', 'a1c_peak_time', 'a2_peak_time'].includes(sub)) {
        return `device_data.records.${sub}`;
      }
    }
    return `device_data.records.${rest}`;
  }

  if (group === 'EV_records') {
    if (!rest) return null;
    if (rest === 'EV_records') return 'device_data.EV_records';
    return `device_data.EV_records.${rest}`;
  }

  if (group === 'r_records') {
    if (!rest) return null;
    return `device_data.r_records.${rest}`;
  }

  if (group === 'c_records') {
    if (!rest) return null;
    return `device_data.c_records.${rest}`;
  }

  if (group === 'qc_records') {
    if (!rest) return null;
    return `device_data.qc_records.${rest}`;
  }

  return null;
}

function buildRawJsonFromEditMap(selectedRawObj, editMap) {
  const next = JSON.parse(JSON.stringify(selectedRawObj || {}));

  for (const [k, v] of Object.entries(editMap || {})) {
    if (isReadOnlyEditKey(k)) continue;
    const jsonPath = mapEditKeyToJsonPath(k);
    if (!jsonPath) continue;
    setValueByPath(next, jsonPath, tryParseStructuredValue(v));
  }

  return JSON.stringify(next);
}

export default function DeviceMessageInboxPage(props) {
  const { $w, style } = props;
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [saveErrorMsg, setSaveErrorMsg] = useState('');

  // 未保存变更确认弹窗
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [pendingSelect, setPendingSelect] = useState(null);
  const [pendingRoute, setPendingRoute] = useState(null);
  const skipRouteBlockRef = useRef(false);
  const unblockRef = useRef(null);
  const unblockResolveRef = useRef(null); 

  const statusLabelMap = useMemo(() => {
    const map = {};
    for (const o of STATUS_OPTIONS) {
      if (!o?.value || o.value === 'all') continue;
      map[o.value] = o.label;
    }
    return map;
  }, []);

  const [pageNum, setPageNum] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [draftFilters, setDraftFilters] = useState({
    status: 'UNDETERMINED',
    mode: 'all',
    columnSn: '',
  });

  const [queryFilters, setQueryFilters] = useState({
    status: 'UNDETERMINED',
    mode: 'all',
    columnSn: '',
  });

  const [hasQueried, setHasQueried] = useState(false);

  const [list, setList] = useState([]);
  const [total, setTotal] = useState(0);

  const [selected, setSelected] = useState(null);

  const [editMap, setEditMap] = useState({});

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmDiff, setConfirmDiff] = useState([]);

  const fetchList = useCallback(
    async (page = pageNum, overrideFilters) => {
      const f = overrideFilters || queryFilters;
      setLoading(true);
      try {
        const resp = await deviceMessageInboxApi.search({
          pageNum: page,
          pageSize,
          status: f.status === 'all' ? undefined : f.status || undefined,
          mode: f.mode === 'all' ? undefined : f.mode || undefined,
          columnSn: f.columnSn || undefined,
        });

        const body = resp?.data;

        const records = body?.records ?? [];
        const totalCount = body?.total ?? 0;

        setList(Array.isArray(records) ? records : []);
        setTotal(totalCount);
        setPageNum(page);

        setSelected((prev) => {
          if (!records?.length) return null;
          if (!prev) return records[0];
          const found = records.find((r) => r?.id === prev?.id);
          return found || records[0];
        });
      } catch (e) {
        showErrorToast(toast, { title: '加载失败', description: '无法加载收件箱列表，请稍后重试' });
      } finally {
        setLoading(false);
      }
    },
    [pageNum, pageSize, queryFilters, toast],
  );

  // 查询按钮点击
  const submitQuery = useCallback(() => {
    setHasQueried(true);
    setQueryFilters(draftFilters);
    fetchList(1, draftFilters);
  }, [draftFilters, fetchList]);

  // 选中项 rawJson 解析结果
  const selectedRawObj = useMemo(() => {
    return selected ? safeJsonParse(selected.rawJson) : null;
  }, [selected]);

  // selectedRawObj 格式化后的字符串
  const selectedRawPretty = useMemo(() => {
    return selected ? formatJsonPretty(selected.rawJson) : '';
  }, [selected]);

  // selectedRawObj 解析出的各字段详情分组
  const detailGroups = useMemo(() => {
    const obj = selectedRawObj;
    if (!obj) return [];

    const mode = getValue(obj, 'device_data.mode') || selected?.mode || '';

    const common = {
      Version: getValue(obj, 'Version') ?? getValue(obj, 'version') ?? '',
      SN: getValue(obj, 'device_data.SN') ?? getValue(obj, 'device_data.sn') ?? '',
      model: getValue(obj, 'device_data.model') ?? '',
      mode: getValue(obj, 'device_data.mode') ?? '',
    };

    // 基本参数
    const records = {
      column_sn: getValue(obj, 'device_data.records.column_sn') ?? '',
      pre_column_sn: getValue(obj, 'device_data.records.pre_column_sn') ?? '',
      second: getValue(obj, 'device_data.records.second') ?? '',
      inspection_date: getValue(obj, 'device_data.records.inspection_date') ?? '',
      set_temperature: getValue(obj, 'device_data.records.set_temperature') ?? '',
      pressure: getValue(obj, 'device_data.records.pressure') ?? '',
      peak_time:
        mode === 'thalassemia'
          ? {
              f_peak_time: getValue(obj, 'device_data.records.f_peak_time') ?? '',
              a1c_peak_time: getValue(obj, 'device_data.records.a1c_peak_time') ?? '',
              a2_peak_time: getValue(obj, 'device_data.records.a2_peak_time') ?? '',
            }
          : getValue(obj, 'device_data.records.peak_time') ?? '',
      env_temperature: getValue(obj, 'device_data.records.env_temperature') ?? '',
    };

    // 重复性测值
    const ev =
      mode === 'thalassemia'
        ? {
            f_EV: getValue(obj, 'device_data.EV_records.f_EV') ?? getValue(obj, 'device_data.EV_records.f_EV') ?? '',
            a1c_EV: getValue(obj, 'device_data.EV_records.a1c_EV') ?? '',
            a2_EV: getValue(obj, 'device_data.EV_records.a2_EV') ?? '',
          }
        : {
            EV_records: getValue(obj, 'device_data.EV_records') ?? '',
          };

    // 试剂信息
    const r = {
      r_a_lot: getValue(obj, 'device_data.r_records.r_a_lot') ?? '',
      r_b_lot: getValue(obj, 'device_data.r_records.r_b_lot') ?? '',
      r_c_lot: getValue(obj, 'device_data.r_records.r_c_lot') ?? '',
      r_d_lot: getValue(obj, 'device_data.r_records.r_d_lot') ?? '',
      r_l_lot: getValue(obj, 'device_data.r_records.r_l_lot') ?? '',
    };

    // 校准信息
    const c =
      mode === 'thalassemia'
        ? {
            c1_lot: getValue(obj, 'device_data.c_records.c1_lot') ?? '',
            c1_f_conc: getValue(obj, 'device_data.c_records.c1_f_conc') ?? '',
            c1_a1c_conc: getValue(obj, 'device_data.c_records.c1_a1c_conc') ?? '',
            c1_a2_conc: getValue(obj, 'device_data.c_records.c1_a2_conc') ?? '',
            c2_lot: getValue(obj, 'device_data.c_records.c2_lot') ?? '',
            c2_f_conc: getValue(obj, 'device_data.c_records.c2_f_conc') ?? '',
            c2_a1c_conc: getValue(obj, 'device_data.c_records.c2_a1c_conc') ?? '',
            c2_a2_conc: getValue(obj, 'device_data.c_records.c2_a2_conc') ?? '',
            f_k: getValue(obj, 'device_data.c_records.f_k') ?? '',
            a1c_k: getValue(obj, 'device_data.c_records.a1c_k') ?? '',
            a2_k: getValue(obj, 'device_data.c_records.a2_k') ?? '',
            f_b: getValue(obj, 'device_data.c_records.f_b') ?? '',
            a1c_b: getValue(obj, 'device_data.c_records.a1c_b') ?? '',
            a2_b: getValue(obj, 'device_data.c_records.a2_b') ?? '',
          }
        : {
            c1_lot: getValue(obj, 'device_data.c_records.c1_lot') ?? '',
            c1_conc: getValue(obj, 'device_data.c_records.c1_conc') ?? '',
            c2_lot: getValue(obj, 'device_data.c_records.c2_lot') ?? '',
            c2_conc: getValue(obj, 'device_data.c_records.c2_conc') ?? '',
            k: getValue(obj, 'device_data.c_records.k') ?? '',
            b: getValue(obj, 'device_data.c_records.b') ?? '',
          };

    // 质控信息
    const qc =
      mode === 'thalassemia'
        ? {
            qc1_lot: getValue(obj, 'device_data.qc_records.qc1_lot') ?? '',
            qc1_f_target: getValue(obj, 'device_data.qc_records.qc1_f_target') ?? '',
            qc1_a1c_target: getValue(obj, 'device_data.qc_records.qc1_a1c_target') ?? '',
            qc1_a2_target: getValue(obj, 'device_data.qc_records.qc1_a2_target') ?? '',
            qc1_expiry_date: getValue(obj, 'device_data.qc_records.qc1_expiry_date') ?? '',
            qc1_f_conc: getValue(obj, 'device_data.qc_records.qc1_f_conc') ?? '',
            qc1_a1c_conc: getValue(obj, 'device_data.qc_records.qc1_a1c_conc') ?? '',
            qc1_a2_conc: getValue(obj, 'device_data.qc_records.qc1_a2_conc') ?? '',
            qc1_f_test_value: getValue(obj, 'device_data.qc_records.qc1_f_test_value') ?? '',
            qc1_a1c_test_value: getValue(obj, 'device_data.qc_records.qc1_a1c_test_value') ?? '',
            qc1_a2_test_value: getValue(obj, 'device_data.qc_records.qc1_a2_test_value') ?? '',
            qc2_lot: getValue(obj, 'device_data.qc_records.qc2_lot') ?? '',
            qc2_f_target: getValue(obj, 'device_data.qc_records.qc2_f_target') ?? '',
            qc2_a1c_target: getValue(obj, 'device_data.qc_records.qc2_a1c_target') ?? '',
            qc2_a2_target: getValue(obj, 'device_data.qc_records.qc2_a2_target') ?? '',
            qc2_expiry_date: getValue(obj, 'device_data.qc_records.qc2_expiry_date') ?? '',
            qc2_f_conc: getValue(obj, 'device_data.qc_records.qc2_f_conc') ?? '',
            qc2_a1c_conc: getValue(obj, 'device_data.qc_records.qc2_a1c_conc') ?? '',
            qc2_a2_conc: getValue(obj, 'device_data.qc_records.qc2_a2_conc') ?? '',
            qc2_f_test_value: getValue(obj, 'device_data.qc_records.qc2_f_test_value') ?? '',
            qc2_a1c_test_value: getValue(obj, 'device_data.qc_records.qc2_a1c_test_value') ?? '',
            qc2_a2_test_value: getValue(obj, 'device_data.qc_records.qc2_a2_test_value') ?? '',
          }
        : {
            qc1_lot: getValue(obj, 'device_data.qc_records.qc1_lot') ?? '',
            qc1_target: getValue(obj, 'device_data.qc_records.qc1_target') ?? '',
            qc1_SD: getValue(obj, 'device_data.qc_records.qc1_SD') ?? '',
            qc1_expiry_date: getValue(obj, 'device_data.qc_records.qc1_expiry_date') ?? '',
            qc1_conc: getValue(obj, 'device_data.qc_records.qc1_conc') ?? '',
            qc1_test_value: getValue(obj, 'device_data.qc_records.qc1_test_value') ?? '',
            qc2_lot: getValue(obj, 'device_data.qc_records.qc2_lot') ?? '',
            qc2_target: getValue(obj, 'device_data.qc_records.qc2_target') ?? '',
            qc2_SD: getValue(obj, 'device_data.qc_records.qc2_SD') ?? '',
            qc2_expiry_date: getValue(obj, 'device_data.qc_records.qc2_expiry_date') ?? '',
            qc2_conc: getValue(obj, 'device_data.qc_records.qc2_conc') ?? '',
            qc2_test_value: getValue(obj, 'device_data.qc_records.qc2_test_value') ?? '',
          };

    return [
      { title: '设备信息', data: common },
      { title: 'records', data: records },
      { title: 'EV_records', data: ev },
      { title: 'r_records', data: r },
      { title: 'c_records', data: c },
      { title: 'qc_records', data: qc },
    ];
  }, [selected, selectedRawObj]);

  // 初始值扁平化映射
  const originalMap = useMemo(() => {
    const out = {};
    const buildFlatMap = (obj, prefix) => {
      if (obj == null) {
        out[prefix] = '';
        return;
      }
      if (typeof obj !== 'object') {
        out[prefix] = String(obj);
        return;
      }
      if (Array.isArray(obj)) {
        out[prefix] = JSON.stringify(obj);
        return;
      }
      for (const [k, v] of Object.entries(obj)) {
        const nextPrefix = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          buildFlatMap(v, nextPrefix);
        } else if (Array.isArray(v)) {
          out[nextPrefix] = JSON.stringify(v);
        } else {
          out[nextPrefix] = v == null ? '' : String(v);
        }
      }
    };

    for (const g of detailGroups) {
      buildFlatMap(g.data, g.title);
    }

    return out;
  }, [detailGroups]);

  // 是否存在“已改动但未保存”的字段
  const dirtyFields = useMemo(() => {
    const keys = new Set([
      ...Object.keys(originalMap || {}),
      ...Object.keys(editMap || {}),
    ]);
    const changed = new Set();
    for (const k of keys) {
      const oldVal = String((originalMap || {})[k] ?? '');
      const newVal = String((editMap || {})[k] ?? '');
      if (oldVal !== newVal) changed.add(k);
    }
    return changed;
  }, [editMap, originalMap]);

  const isDirty = useMemo(() => dirtyFields.size > 0, [dirtyFields]);

  // 请求离开（切换选中项或路由跳转）
  const requestLeave = useCallback(
    ({ nextSelected, nextRoute }) => {
      setPendingSelect(nextSelected || null);
      setPendingRoute(nextRoute || null);
      setSaveErrorMsg('');
      setLeaveConfirmOpen(true);
    },
    [],
  );

  // 不保存离开
  const doDiscardAndLeave = useCallback(() => {
    console.log('执行 doDiscardAndLeave，准备离开');
    
    setLeaveConfirmOpen(false);
    setSaveErrorMsg('');

    // 重置 editMap
    setEditMap((p) => {
      const next = { ...(originalMap || {}) };
      return next;
    });

    // 如果有 Promise 在等待，先 resolve 它
    if (unblockResolveRef.current) {
      console.log('resolve 路由阻塞 Promise');
      unblockResolveRef.current();
      unblockResolveRef.current = null;
    }

    // 然后执行实际的跳转或选择切换
    if (pendingSelect) {
      console.log('切换到新的选中项');
      setSelected(pendingSelect);
    }

    if (pendingRoute) {
      console.log('执行路由跳转到:', pendingRoute);
      const history = window?._WEAPPS_HISTORY;
      if (history) {
        skipRouteBlockRef.current = true;
        // 这里需要确保 pendingRoute 是正确的格式
        history.push(pendingRoute);
      }
    }

    setPendingSelect(null);
    setPendingRoute(null);
  }, [originalMap, pendingRoute, pendingSelect]);


  // 构建变更对比列表
  const buildDiff = useCallback(() => {
    const rows = [];
    const keys = new Set([
      ...Object.keys(originalMap || {}),
      ...Object.keys(editMap || {}),
    ]);

    for (const k of keys) {
      const oldVal = String((originalMap || {})[k] ?? '');
      const newVal = String((editMap || {})[k] ?? '');
      if (oldVal === newVal) continue;

      const lastKey = String(k).split('.').pop();
      const label = FIELD_LABELS[lastKey] || lastKey;
      rows.push({
        label,
        field: k,
        oldVal,
        newVal,
      });
    }

    return rows;
  }, [editMap, originalMap]);

  // 打开保存确认弹窗
  const openConfirm = useCallback(() => {
    const diff = buildDiff();
    if (!diff.length) {
      toast({
        title: '没有修改',
        description: '你还没有修改任何字段',
      });
      return;
    }
    setConfirmDiff(diff);
    setConfirmOpen(true);
  }, [buildDiff, toast]);

  // 提交保存
  const submitSave = useCallback(async () => {
    if (!selected?.id) return false;
    if (!selectedRawObj) {
      toast({
        title: '保存失败',
        description: 'raw_json 不是合法 JSON，无法保存修改',
        variant: 'destructive',
      });
      setSaveErrorMsg('raw_json 不是合法 JSON，无法保存修改');
      return false;
    }

    const rawJson = buildRawJsonFromEditMap(selectedRawObj, editMap);
    const request = { inboxId: selected.id, rawJson };

    setSaving(true);
    try {
      const resp = await deviceMessageInboxApi.save(request);
      const body = resp?.data;
      if (body?.success === false) {
        throw new Error(body?.errorMsg || '保存失败');
      }

      const ok = body?.data;
      toast({
        title: '保存成功',
        description: ok ? '已保存并重新判定' : '已保存，已尝试重新判定（可能仍未判定/失败）',
      });

      // 关键：保存成功后，立刻把 selected.rawJson 更新为最新值
      // 否则 originalMap 仍基于旧 rawJson，dirtyFields 会一直存在，从而反复弹“未保存”
      setSelected((prev) => {
        if (!prev) return prev;
        if (prev?.id !== selected?.id) return prev;
        return { ...prev, rawJson };
      });

      setConfirmOpen(false);
      setSaveErrorMsg('');

      // 刷新列表并保持当前页
      await fetchList(pageNum);
      return true;
    } catch (e) {
      const msg = e?.message || '保存失败，请稍后重试';
      showErrorToast(toast, { title: '保存失败', description: '保存失败，请稍后重试' });
      setSaveErrorMsg(msg);
      return false;
    } finally {
      setSaving(false);
    }
  }, [editMap, fetchList, pageNum, selected, selectedRawObj, toast]);

  // 保存并离开
  const doSaveAndLeave = useCallback(async () => {
    if (saving) return;
    if (!selected?.id) return;

    const ok = await submitSave();
    if (!ok) {
      return;
    }

    setLeaveConfirmOpen(false);
    setSaveErrorMsg('');

    // 同样需要 resolve Promise
    if (unblockResolveRef.current) {
      unblockResolveRef.current();
      unblockResolveRef.current = null;
    }

    if (pendingRoute) {
      const history = window?._WEAPPS_HISTORY;
      if (history) {
        skipRouteBlockRef.current = true;
        history.push(pendingRoute);
      }
    } else if (pendingSelect) {
      setSelected(pendingSelect);
    }

    setPendingSelect(null);
    setPendingRoute(null);
  }, [pendingRoute, pendingSelect, saving, selected?.id, submitSave]);

  // 选中项摘要
  const selectedSummary = useMemo(() => {
    if (!selected) return null;
    const missing = formatMissingFields(selected.missingFields);
    const mode = selected.mode || '';
    return { missing, mode };
  }, [selected]);

  useEffect(() => {
    if (!selectedRawObj) {
      setEditMap({});
      return;
    }

    const buildFlatMap = (obj, prefix, out) => {
      if (obj == null) {
        out[prefix] = '';
        return;
      }
      if (typeof obj !== 'object') {
        out[prefix] = String(obj);
        return;
      }
      if (Array.isArray(obj)) {
        out[prefix] = JSON.stringify(obj);
        return;
      }
      for (const [k, v] of Object.entries(obj)) {
        const nextPrefix = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          buildFlatMap(v, nextPrefix, out);
        } else if (Array.isArray(v)) {
          out[nextPrefix] = JSON.stringify(v);
        } else {
          out[nextPrefix] = v == null ? '' : String(v);
        }
      }
    };

    const next = {};
    for (const g of detailGroups) {
      buildFlatMap(g.data, g.title, next);
    }

    setEditMap(next);
  }, [detailGroups, selectedRawObj, selected?.id]);

  // 递归渲染字段编辑项
  const renderGroupFields = useCallback(
    (data, prefix) => {
      if (data == null) return null;

      if (typeof data !== 'object' || Array.isArray(data)) {
        const key = String(prefix || '');
        const value = String(editMap[key] ?? '');
        const changed = dirtyFields.has(key);
        const isColumnSn = key === 'records.column_sn';
        const disabled = isColumnSn ? false : isReadOnlyEditKey(key);

        return (
          <div className="space-y-1">
            <Input
              value={value}
              className={
                isColumnSn
                  ? 'ring-1 ring-rose-200 bg-rose-50 focus-visible:ring-rose-300'
                  : changed
                    ? 'ring-1 ring-amber-400 bg-amber-50 focus-visible:ring-amber-400'
                    : undefined
              }
              disabled={disabled}
              onChange={(e) => {
                if (disabled) return;
                setEditMap((p) => ({ ...p, [key]: e.target.value }));
              }}
            />
            {isColumnSn ? (
              <div className="text-xs text-slate-500">
                重要字段：提交前会提示“将更新已有/将新增层析柱信息”。建议仔细核对后再保存。
              </div>
            ) : null}
          </div>
        );
      }

      const entries = Object.entries(data);

      return (
        <div className="space-y-3">
          {entries.map(([k, v]) => {
            const nextPrefix = prefix ? `${prefix}.${k}` : k;
            if (v && typeof v === 'object' && !Array.isArray(v)) {
              const title = FIELD_LABELS[k] || k;
              return (
                <div key={nextPrefix} className="border rounded-md p-3 bg-secondary">
                  <div className="text-sm font-medium text-gray-900 mb-3">{title}</div>
                  {renderGroupFields(v, nextPrefix)}
                </div>
              );
            }

            const label = FIELD_LABELS[k] || k;
            const value = String(editMap[nextPrefix] ?? '');
            const changed = dirtyFields.has(nextPrefix);

            return (
              <div key={nextPrefix} className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div className="text-sm text-gray-600 md:col-span-1">{label}</div>
                <div className="md:col-span-2">
                  <Input
                    value={value}
                    className={(() => {
                      const isColumnSn = nextPrefix === 'records.column_sn';
                      if (isColumnSn) {
                        return 'ring-1 ring-rose-200 bg-rose-50 focus-visible:ring-rose-300';
                      }
                      return changed
                        ? 'ring-1 ring-amber-400 bg-amber-50 focus-visible:ring-amber-400'
                        : undefined;
                    })()}
                    disabled={(() => {
                      const isColumnSn = nextPrefix === 'records.column_sn';
                      if (isColumnSn) {
                        return false;
                      }
                      return isReadOnlyEditKey(nextPrefix);
                    })()}
                    onChange={(e) => {
                      const isColumnSn = nextPrefix === 'records.column_sn';
                      const disabled = isColumnSn
                        ? false
                        : isReadOnlyEditKey(nextPrefix);
                      if (disabled) return;
                      setEditMap((p) => ({ ...p, [nextPrefix]: e.target.value }));
                    }}
                  />
                  {nextPrefix === 'records.column_sn' ? (
                    <div className="text-xs text-slate-500">
                      重要字段：提交前会提示“将更新已有/将新增层析柱信息”。建议仔细核对后再保存。
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      );
    },
    [dirtyFields, editMap],
  );

  // 调试路由守卫状态
  useEffect(() => {
    console.log('路由守卫状态:', {
    isDirty,
    pendingRoute,
    pendingSelect,
    leaveConfirmOpen,
    hasHistory: !!window?._WEAPPS_HISTORY
  });
  }, [isDirty, pendingRoute, pendingSelect, leaveConfirmOpen]);


  // 2) 路由切换时提醒（HistoryRouter / history.block）
  useEffect(() => {
    const history = window?._WEAPPS_HISTORY;
    if (!history) return;

    if (unblockRef.current) {
      unblockRef.current();
      unblockRef.current = null;
    }

    // 只在有未保存修改时才设置路由守卫
    if (isDirty) {
      console.log('设置路由守卫，isDirty = true');
      
      unblockRef.current = history.block((tx) => {
        console.log('路由拦截触发:', {
          pathname: tx.location?.pathname,
          skipRouteBlock: skipRouteBlockRef.current,
          isDirty
        });

        if (skipRouteBlockRef.current) {
          console.log('跳过拦截（skipRouteBlock为true）');
          skipRouteBlockRef.current = false;
          return;
        }

        // 保存跳转信息，打开确认弹窗
        console.log('打开确认弹窗，目标路由:', tx.location);
        setPendingRoute(tx.location);
        setLeaveConfirmOpen(true);
        
        // 返回一个 Promise 来延迟路由跳转
        return new Promise((resolve) => {
          // 保存 resolve 函数供后续使用
          unblockResolveRef.current = resolve;
          console.log('路由阻塞，等待用户确认');
        });
      });
    } else {
      console.log('未设置路由守卫，isDirty = false');
    }

    return () => {
      if (unblockRef.current) {
        console.log('清理路由守卫');
        unblockRef.current();
        unblockRef.current = null;
      }
    };
  }, [isDirty]); // 依赖 isDirty，当 isDirty 变化时会重新设置

  return (
    <div style={style} className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">设备消息收件箱</h1>
          <div className="mt-1 text-sm text-slate-500">查看 JSON 消息并进行补录/重算</div>
        </div>
        <div className="shrink-0">
          <Button
            onClick={() => {
              if (!hasQueried) return;
              fetchList(pageNum);
            }}
            disabled={loading || !hasQueried}
          >
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            刷新
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 左侧：列表 */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5" />
              收件箱列表
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-2">
                <Select
                  value={draftFilters.status}
                  onValueChange={(v) => setDraftFilters((p) => ({ ...p, status: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="状态" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={draftFilters.mode}
                  onValueChange={(v) => setDraftFilters((p) => ({ ...p, mode: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="模式" />
                  </SelectTrigger>
                  <SelectContent>
                    {MODE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Input
                placeholder="按层析柱序列号筛选"
                value={draftFilters.columnSn}
                onChange={(e) => setDraftFilters((p) => ({ ...p, columnSn: e.target.value }))}
              />

              <Button onClick={submitQuery} disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                查询
              </Button>
            </div>

            <div className="text-sm text-gray-500">
              共 {total} 条，本页 {list.length} 条
            </div>

            <div className="max-h-[520px] overflow-auto border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>状态</TableHead>
                    <TableHead>模式</TableHead>
                    <TableHead>层析柱SN</TableHead>
                    <TableHead>接收日期</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((row) => {
                    const isActive = selected?.id === row.id;
                    const statusLabel = statusLabelMap[row.status] || row.status;
                    const isActiveDirty = isActive && isDirty;

                    // 格式化接收日期函数
                    const formatReceivedDate = (dateStr) => {
                      if (!dateStr) return '-';
                      try {
                        const date = new Date(dateStr);
                        // 显示格式：(月-日 时:分)
                        const month = (date.getMonth() + 1).toString().padStart(2, '0');
                        const day = date.getDate().toString().padStart(2, '0');
                        const hours = date.getHours().toString().padStart(2, '0');
                        const minutes = date.getMinutes().toString().padStart(2, '0');
                        return `${month}-${day} ${hours}:${minutes}`;
                      } catch (e) {
                        // 如果解析失败，显示原始值的一部分
                        return dateStr.length >= 10 ? dateStr.substring(5, 16) : dateStr;
                      }
                    };
                    
                    return (
                      <TableRow
                        key={row.id}
                        className={
                          isActiveDirty
                            ? 'bg-secondary cursor-pointer ring-1 ring-amber-400'
                            : isActive
                              ? 'bg-secondary cursor-pointer'
                              : 'cursor-pointer'
                        }
                        onClick={() => {
                          if (row?.id === selected?.id) return;
                          if (isDirty) {
                            requestLeave({ nextSelected: row });
                            return;
                          }
                          setSelected(row);
                        }}
                      >
                        <TableCell className="text-xs">{statusLabel}</TableCell>
                        <TableCell className="text-xs">{row.mode}</TableCell>
                        <TableCell className="text-xs">{row.columnSn}</TableCell>
                        <TableCell className="text-xs">{formatReceivedDate(row.receivedAt)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {!list.length ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-gray-500">
                        暂无数据
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* 右侧：详情 */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>基本数据</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedRawObj ? (
                <div className="text-sm text-gray-500">raw_json 不是合法 JSON，无法分组展示</div>
              ) : (
                detailGroups.map((g) => (
                  <div key={g.title} className="border rounded-md p-4">
                    <div className="text-sm font-semibold text-gray-900 mb-3">
                      {GROUP_LABELS[g.title] || g.title}
                    </div>
                    {renderGroupFields(g.data, g.title)}
                  </div>
                ))
              )}

              <div className="pt-2 space-y-2">
                <Button onClick={openConfirm} disabled={!selected || saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  保存
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>完整 raw JSON</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea value={selectedRawPretty} readOnly className="font-mono min-h-[280px]" />
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>二次确认</AlertDialogTitle>
            <AlertDialogDescription>
              请确认以下字段变更。
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="max-h-[260px] overflow-auto border rounded-md p-3 bg-secondary">
            {confirmDiff.length ? (
              <div className="space-y-2">
                {confirmDiff.map((d) => (
                  <div key={d.field} className="text-sm">
                    <div className="font-medium text-gray-900">{d.label}</div>
                    <div className="text-gray-600 break-all">旧值：{d.oldVal || '-'}</div>
                    <div className="text-gray-900 break-all">新值：{d.newVal || '-'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500">没有变更</div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>取消</AlertDialogCancel>
            <AlertDialogAction onClick={submitSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              确认提交
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={leaveConfirmOpen} onOpenChange={setLeaveConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>你有未保存的修改</AlertDialogTitle>
            <AlertDialogDescription>
              当前消息的修改还没有保存。你想保存后再离开吗？
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="text-sm text-muted-foreground">
            未保存字段数：
            <span className="font-medium text-foreground">{dirtyFields.size}</span>
          </div>

          {saveErrorMsg ? (
            <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-md p-3">
              保存失败：{saveErrorMsg}
              <div className="mt-1 text-amber-700/80">
                你可以选择“不保存”继续离开，或点击“取消”留在当前页稍后重试。
              </div>
            </div>
          ) : null}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={saving}
              onClick={doDiscardAndLeave}
              className="bg-secondary text-secondary-foreground hover:bg-secondary/80"
            >
              不保存
            </AlertDialogAction>
            <AlertDialogAction disabled={saving} onClick={doSaveAndLeave}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              保存
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
