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
  since?: string | number | Date;
}

interface PolicyNodeStatus extends PolicyStatus {
  nodeName: string;
}

interface PolicyNodeStatusRow {
  id: string;
  status: string;
  since: string;
  node: string;
  message: string;
}

const props = defineProps<{
  status?: {
    nodesWithIssues?: Record<string, PolicyStatus>;
    nodesTransitioning?: PolicyNodeStatus[];
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

  if (status.nodesWithIssues) {
    Object.entries(status.nodesWithIssues).forEach(([nodeName, nodeStatus]) => {
      items.push({
        id:      `failed-${nodeName}`,
        status:  'Failed',
        since:   formatDate(nodeStatus.since),
        node:    nodeName,
        message: nodeStatus.message || '-',
      });
    });
  }

  if (status.nodesTransitioning) {
    status.nodesTransitioning.forEach((nodeStatus) => {
      const nodeName = typeof nodeStatus === 'string' ? nodeStatus : nodeStatus.nodeName;
      const sinceVal = typeof nodeStatus === 'string' ? undefined : nodeStatus.since;

      items.push({
        id:      `transitioning-${nodeName}`,
        status:  'Transitioning',
        since:   formatDate(sinceVal),
        node:    nodeName,
        message: nodeStatus.message || '-',
      });
    });
  }

  const knownIssueCount = items.length;
  const total = status.totalNodes || 0;
  const readyCount = status.successfulNodes ?? Math.max(0, total - knownIssueCount);

  for (let i = 0; i < readyCount; i++) {
    items.push({
      id:      `ready-node-${i}`,
      status:  'Ready',
      since:   '-',
      node:    `node-${i + 1}`,
      message: '-',
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
    width: 140,
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
.message-text {
  display: inline-block;
  max-width: 450px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>