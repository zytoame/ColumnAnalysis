import BATCH_AUDIT from '../pages/batch-audit.jsx';
import MAIN from '../pages/main.jsx';
import UNQUALIFIED_REPORTS from '../pages/unqualified-reports.jsx';
import QUERY_REPORTS from '../pages/query-reports.jsx';
import QUERY_COLUMNS from '../pages/query-columns.jsx';
import STANDARD_MANAGE from '../pages/standard-manage.jsx';
import SIGNATURE_SETTINGS from '../pages/signature-settings.jsx';

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
];