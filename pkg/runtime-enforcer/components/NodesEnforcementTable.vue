<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import SortableTable from '@shell/components/SortableTable';
import StatusBadge from '@runtime-enforcer/components/common/StatusBadge.vue';
import * as dayjsImport from 'dayjs';
import * as utcImport from 'dayjs/plugin/utc';

const dayjs = (dayjsImport as any).default || dayjsImport;
const utc = (utcImport as any).default || utcImport;

dayjs.extend(utc);

interface PolicyStatus {
  code: string;
  message?: string;
  timestamp?: string | number | Date;
}

interface PolicyNodeStatusRow {
  id: string;
  status: string;
  since: string;
  node: string;
  issueCode: string;
  message: string;
}

const props = defineProps<{
  status?: {
    nodesWithIssues?: Record<string, PolicyStatus>;
    nodesTransitioning?: string[];
    totalNodes?: number;
    successfulNodes?: number;
    failedNodes?: number;
    transitioningNodes?: number;
    phase?: string;
  };
}>();

const store = useStore();
const { t } = useI18n(store);

const formatDate = (dateVal?: string | number | Date) => {
  if (!dateVal) {
    return '-';
  }
  const parsed = dayjs.utc(dateVal);

  return parsed.isValid() ? parsed.format('MMM DD, YYYY hh:mm A') : '-';
};

const rows = computed<PolicyNodeStatusRow[]>(() => {
  const items: PolicyNodeStatusRow[] = [];
  const status = props.status || {};

  // 1. Process Failed / Missing Nodes from nodesWithIssues map
  if (status.nodesWithIssues) {
    Object.entries(status.nodesWithIssues).forEach(([nodeName, nodeStatus]) => {
      items.push({
        id:        `failed-${nodeName}`,
        status:    nodeStatus.code || 'Failed',
        since:     formatDate(nodeStatus.timestamp),
        node:      nodeName,
        issueCode: nodeStatus.code || '-',
        message:   nodeStatus.message || '-',
      });
    });
  }

  // 2. Process Transitioning Nodes
  if (status.nodesTransitioning) {
    status.nodesTransitioning.forEach((nodeName) => {
      items.push({
        id:        `transitioning-${nodeName}`,
        status:    'Transitioning',
        since:     '-',
        node:      nodeName,
        issueCode: '-',
        message:   '-',
      });
    });
  }

  // 3. Fallback/Synthetic rows for Ready Nodes
  const knownIssueCount = items.length;
  const total = status.totalNodes || 0;
  const readyCount = status.successfulNodes ?? Math.max(0, total - knownIssueCount);

  for (let i = 0; i < readyCount; i++) {
    items.push({
      id:        `ready-node-${i}`,
      status:    'Ready',
      since:     '-',
      node:      `node-${i + 1}`,
      issueCode: '-',
      message:   '-',
    });
  }

  return items;
});

const headers = computed(() => [
  {
    name:  'status',
    value: 'status',
    label: t('runtimeEnforcer.activePolicy.nodesEnforcement.table.status'),
    sort:  'status',
    width: 120,
  },
  {
    name:  'since',
    value: 'since',
    label: t('runtimeEnforcer.activePolicy.nodesEnforcement.table.since'),
    sort:  'since',
    width: 180,
  },
  {
    name:  'node',
    value: 'node',
    label: t('runtimeEnforcer.activePolicy.nodesEnforcement.table.node'),
    sort:  'node',
    width: 180,
  },
  {
    name:  'issueCode',
    value: 'issueCode',
    label: t('runtimeEnforcer.activePolicy.nodesEnforcement.table.issueCode'),
    sort:  'issueCode',
    width: 200,
  },
  {
    name:  'message',
    value: 'message',
    label: t('runtimeEnforcer.activePolicy.nodesEnforcement.table.message'),
    sort:  'message',
  },
]);
</script>

<template>
  <SortableTable
      key-field="id"
      :rows="rows"
      :headers="headers"
      :table-actions="false"
      :row-actions="false"
      :search="false"
      :paging="false"
  >
    <template #col:status="{ row }">
      <td>
        <StatusBadge :status="row.status.toLowerCase()" />
      </td>
    </template>

    <template #col:since="{ row }">
      <td>
        <span v-if="row.since !== '-'" class="text-muted">
          {{ row.since }}
        </span>
        <span v-else class="text-muted">-</span>
      </td>
    </template>

    <template #col:issueCode="{ row }">
      <td>
        <span :class="{ 'text-error font-mono': row.issueCode !== '-' }">
          {{ row.issueCode }}
        </span>
      </td>
    </template>

    <template #col:message="{ row }">
      <td>
        <span
            v-if="row.message && row.message !== '-'"
            v-clean-tooltip="row.message"
            class="message-text"
        >
          {{ row.message }}
        </span>
        <span v-else class="text-muted">-</span>
      </td>
    </template>
  </SortableTable>
</template>

<style lang="scss" scoped>
.font-mono {
  font-family: monospace;
}

.text-error {
  color: var(--error);
}

.message-text {
  display: inline-block;
  max-width: 450px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>