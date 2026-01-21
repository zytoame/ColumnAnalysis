import BATCH_AUDIT from '../pages/batch-audit.jsx';
import MAIN from '../pages/main.jsx';
import UNQUALIFIED_REPORTS from '../pages/unqualified-reports.jsx';
import QUERY_REPORTS from '../pages/query-reports.jsx';
import QUERY_COLUMNS from '../pages/query-columns.jsx';
import STANDARD_MANAGE from '../pages/standard-manage.jsx';
import SIGNATURE_SETTINGS from '../pages/signature-settings.jsx';
import DEVICE_CONFIG from '../pages/device-config.jsx';
import DEVICE_MESSAGE_INBOX from '../pages/device-message-inbox.jsx';
import SN_MAPPING_MANAGE from '../pages/sn-mapping-manage.jsx';

export const routers = [
  {
    id: 'main',
    component: MAIN,
    isHome: true,
  },
  {
    id: 'signature-settings',
    component: SIGNATURE_SETTINGS,
  },
  {
    id: 'batch-audit',
    component: BATCH_AUDIT,
  },
  {
    id: 'unqualified-reports',
    component: UNQUALIFIED_REPORTS,
  },
  {
    id: 'query-reports',
    component: QUERY_REPORTS,
  },
  {
    id: 'query-columns',
    component: QUERY_COLUMNS,
  },
  {
    id: 'standard-manage',
    component: STANDARD_MANAGE,
  },
  {
    id: 'device-config',
    component: DEVICE_CONFIG,
  },
  {
    id: 'device-message-inbox',
    component: DEVICE_MESSAGE_INBOX,
  },
  {
    id: 'sn-mapping-manage',
    component: SN_MAPPING_MANAGE,
  },
];