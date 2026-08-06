<script setup lang="ts">
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import SortableTable from '@shell/components/SortableTable';

const props = defineProps<{
  rulesByContainer: Record<string, any>;
  imageMap?: Record<string, string>;
}>();

const store = useStore();
const i18n = useI18n(store);

const rows = computed(() => {
  const rules = props.rulesByContainer || {};
  const items: Array<{ id: string; executable: string; container: string; image: string }> = [];

  Object.entries(rules).forEach(([containerName, containerRules]: [string, any]) => {
    const allowed = containerRules?.executables?.allowed || [];
    const image = props.imageMap?.[containerName] || '';

    allowed.forEach((execPath: string, index: number) => {
      items.push({
        id:          `${containerName}-${index}-${execPath}`,
        executable:  execPath,
        container:   containerName,
        image,
      });
    });
  });

  return items;
});

const headers = computed(() => [
  {
    name:  'executable',
    value: 'executable',
    label: i18n.t('runtimeEnforcer.activePolicy.allowedExecutables.table.executable'),
    sort:  'executable',
  },
  {
    name:  'container',
    value: 'container',
    label: i18n.t('runtimeEnforcer.activePolicy.allowedExecutables.table.container'),
    sort:  'container',
  },
  {
    name:  'image',
    value: 'image',
    label: i18n.t('runtimeEnforcer.activePolicy.allowedExecutables.table.image'),
    sort:  'image',
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
    <template #col:executable="{ row }">
      <td>
        <span class="executable-pill">
          {{ row.executable }}
        </span>
      </td>
    </template>

    <template #col:image="{ row }">
      <td>
        <span v-if="row.image">image: {{ row.image }}</span>
        <span v-else class="text-muted">-</span>
      </td>
    </template>
  </SortableTable>
</template>

<style lang="scss" scoped>
.executable-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--tag-bg);
  color: var(--tag-primary);
  font-size: 13px;
  font-family: monospace;
}
</style>