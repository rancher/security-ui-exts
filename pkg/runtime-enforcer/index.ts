import { importTypes } from '@rancher/auto-import';
import { registerCommonL10n } from '@common/config';
import { IPlugin, TableColumnLocation, PanelLocation, TabLocation } from '@shell/core/types';
import { POD, WORKLOAD_TYPES } from '@shell/config/types';
import runtimeEnforcer from './routes/runtime-enforcer';
import { getRuntimeSecurityValue } from './utils/workload-policy';

const ALL_WORKLOAD_TYPES = [
  WORKLOAD_TYPES.DEPLOYMENT,
  WORKLOAD_TYPES.DAEMON_SET,
  WORKLOAD_TYPES.STATEFUL_SET,
  WORKLOAD_TYPES.JOB,
  WORKLOAD_TYPES.CRON_JOB,
  WORKLOAD_TYPES.REPLICA_SET,
  POD,
];

export default function(plugin: IPlugin): void {
  importTypes(plugin);
  registerCommonL10n(plugin);

  plugin.metadata = require('./package.json');
  plugin.addProduct(require('./config/runtime-enforcer'));
  plugin.addRoutes(runtimeEnforcer);

  // Add Runtime Security column to all Workloads list tables
  plugin.addTableColumn(
    TableColumnLocation.RESOURCE,
    {
      resource: ALL_WORKLOAD_TYPES,
      mode:     ['list'],
    },
    {
      name:      'runtimeSecurity',
      labelKey:  'runtimeEnforcer.tableColumns.runtimeSecurity.header',
      label:     'Runtime Security',
      formatter: 'RuntimeSecurityCell',
      getValue:  getRuntimeSecurityValue,
      search:    true,
    }
  );

  // Add Runtime Security indicator to Workload detail top area
  plugin.addPanel(
    PanelLocation.DETAIL_TOP,
    {
      resource: ALL_WORKLOAD_TYPES,
    },
    {
      component: () => import('./components/DeploymentDetailRuntimeSecurity.vue'),
    }
  );

  // Add Runtime Violations tab to Workload detail page (v2.12.6, v2.13.2, v2.14.0+)
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL_PAGE,
    {
      resource: ALL_WORKLOAD_TYPES,
    },
    {
      name:       'runtime-violations',
      labelKey:   'runtimeEnforcer.workloadViolations.tab.title',
      label:      'Runtime Violations',
      weight:     -6,
      showHeader: false,
      component:  () => import('./components/WorkloadRuntimeViolations.vue'),
    }
  );

  // Add Runtime Violations tab to Workload detail drawer (pre-2.12.6, pre-2.13.2)
  plugin.addTab(
    TabLocation.RESOURCE_DETAIL,
    {
      resource: ALL_WORKLOAD_TYPES,
    },
    {
      name:       'runtime-violations',
      labelKey:   'runtimeEnforcer.workloadViolations.tab.title',
      label:      'Runtime Violations',
      weight:     -6,
      showHeader: false,
      component:  () => import('./components/WorkloadRuntimeViolations.vue'),
    }
  );
}