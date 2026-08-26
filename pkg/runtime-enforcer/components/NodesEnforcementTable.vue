<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import SortableTable from '@shell/components/SortableTable';
import StatusBadge from '@runtime-enforcer/components/common/StatusBadge.vue';
import type { PolicyStatus, PolicyNodeStatus } from '@runtime-enforcer/types';
import * as dayjsImport from 'dayjs';
import * as utcImport from 'dayjs/plugin/utc';

const dayjs = (dayjsImport as any).default || dayjsImport;
const utc = (utcImport as any).default || utcImport;

dayjs.extend(utc);

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
      const isMissing = nodeStatus.code?.toLowerCase() === 'missing';

      items.push({
        id:      `issue-${ nodeName }`,
        status:  isMissing ? 'Missing' : 'Failed',
        since:   formatDate(nodeStatus.since),
        node:    nodeName,
        message: nodeStatus.message || '-',
      });
    });
  }

  if (status.nodesTransitioning) {
    status.nodesTransitioning.forEach((nodeStatus) => {
      items.push({
        id:      `transitioning-${nodeStatus.nodeName}`,
        status:  'Transitioning',
        since:   formatDate(nodeStatus.since),
        node:    nodeStatus.nodeName || '-',
        message: nodeStatus.message || '-',
      });
    });
  }

  // Ready nodes are only ever reported as a count by the backend - individual
  // node names are not tracked for nodes without issues - so we render a
  // single aggregate row instead of fabricating per-node rows.
  const readyCount = status.successfulNodes || 0;

  if (readyCount > 0) {
    items.push({
      id:      'ready-nodes',
      status:  'Ready',
      since:   '-',
      node:    '-',
      message: `${ readyCount } ${ t('runtimeEnforcer.activePolicy.nodesEnforcement.readyMessage', { count: readyCount }, true) }`,
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