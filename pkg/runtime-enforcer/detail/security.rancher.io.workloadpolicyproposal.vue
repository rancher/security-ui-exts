<script setup lang="ts">
import { computed, h, onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useStore } from 'vuex';
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import { useDefaultTitleBarProps } from '@shell/components/Resource/Detail/TitleBar/composables';
import SortableTable from '@shell/components/SortableTable';
import RcButton from '@components/RcButton/RcButton.vue';
import { useI18n } from '@shell/composables/useI18n';
import { NAMESPACE } from '@shell/config/types';
import RancherMeta from '@common/components/RancherMeta.vue';
import { MetadataProperty } from '@common/types';

const props = defineProps<{
  value: any;
}>();

const proposal = props.value;

const store = useStore();
const route = useRoute();
const i18n = useI18n(store);

const defaultTitleBarProps = useDefaultTitleBarProps(proposal);

// TitleBar additionalActions (label/variant/size/onClick) has no icon support
// so the Promote button needs to be rebuilt from the same action data.
const additionalActionsBar = () => h(
  'div',
  { class: 'additional-actions' },
  (proposal.detailPageAdditionalActions || []).map((action: any, index: number) => h(RcButton, {
    key:      `additional-action-${ index }`,
    variant:  action.variant,
    size:     action.size,
    leftIcon: action.icon,
    onClick:  action.onClick,
  }, () => action.label))
);

// UX design has no status badge - useDefaultTitleBarProps() always constructs one (there's
// no upstream getter to suppress it), so strip it back out here.
const titleBarProps = computed(() => {
  const { badge, additionalActions, ...rest } = defaultTitleBarProps.value;

  return { ...rest, additionalActions: additionalActionsBar };
});

const ownerWorkload = ref<any>(null);

onMounted(async() => {
  if (!proposal.ownerWorkloadSteveType || !proposal.workload) {
    return;
  }

  try {
    ownerWorkload.value = await store.dispatch('cluster/find', {
      type: proposal.ownerWorkloadSteveType,
      id:   `${ proposal.namespace }/${ proposal.workload }`,
    });
  } catch {
    // Owner workload may have been deleted since the proposal was created - the Workload field
    // and Image column will just render as plain text/blank.
  }
});

const namespaceRoute = computed(() => ({
  name:   'c-cluster-product-resource-id',
  params: {
    product:  'explorer',
    cluster:  route.params.cluster,
    resource: NAMESPACE,
    id:       proposal.namespace,
  },
}));

const metaProperties = computed<MetadataProperty[]>(() => [
  {
    type:  'route',
    label: i18n.t('runtimeEnforcer.policyProposal.masthead.namespace'),
    value: proposal.namespace,
    route: namespaceRoute.value,
  },
  {
    type:  ownerWorkload.value ? 'route' : 'text',
    label: i18n.t('runtimeEnforcer.policyProposal.masthead.workload'),
    value: proposal.workload,
    route: ownerWorkload.value?.detailLocation,
  },
  {
    type:  'text',
    label: i18n.t('runtimeEnforcer.policyProposal.masthead.workloadType'),
    value: proposal.workloadType,
  },
  {
    type:  'text',
    label: i18n.t('runtimeEnforcer.policyProposal.masthead.containers'),
    value: `${ proposal.containerCount }`,
  },
  {
    type:  'text',
    label: i18n.t('runtimeEnforcer.policyProposal.masthead.executables'),
    value: `${ proposal.executableCount }`,
  },
  {
    type:  'date',
    label: i18n.t('runtimeEnforcer.policyProposal.masthead.age'),
    value: proposal.metadata?.creationTimestamp,
  },
]);

const containerImages = computed<Record<string, string>>(() => {
  const containers = ownerWorkload.value?.spec?.template?.spec?.containers
    || ownerWorkload.value?.spec?.jobTemplate?.spec?.template?.spec?.containers
    || [];

  return containers.reduce((acc: Record<string, string>, container: any) => {
    acc[container.name] = container.image;

    return acc;
  }, {});
});

const containerRows = computed(() => proposal.containerNames.map((name: string) => {
  const executables = proposal.rulesByContainer[name]?.executables?.allowed || [];

  return {
    container:       name,
    image:           containerImages.value[name],
    executableCount: executables.length,
    executables,
  };
}));

const containerHeaders = computed(() => [
  {
    name:  'container',
    value: 'container',
    label: i18n.t('runtimeEnforcer.policyProposal.containers.table.container'),
    sort:  'container',
    width: 240,
  },
  {
    name:  'image',
    value: 'image',
    label: i18n.t('runtimeEnforcer.policyProposal.containers.table.image'),
    sort:  'image',
    width: 240,
  },
  {
    name:  'executableCount',
    value: 'executableCount',
    label: i18n.t('runtimeEnforcer.policyProposal.containers.table.executables'),
    sort:  'executableCount',
    width: 120,
  },
  {
    name:   'executables',
    value:  'executables',
    label:  '\u00A0',
    sort:   false,
    search: false,
  },
]);
</script>

<template>
  <DetailPage>
    <template #top-area>
      <TitleBar v-bind="titleBarProps" />
      <RancherMeta :properties="metaProperties" />
    </template>
    <template #bottom-area>
      <h3 class="mmb-6">
        {{ i18n.t('runtimeEnforcer.policyProposal.containers.title') }}
      </h3>
      <SortableTable
        key-field="container"
        :rows="containerRows"
        :headers="containerHeaders"
        :table-actions="false"
        :row-actions="false"
        :search="false"
        :paging="false"
      >
        <template #col:image="{ row }">
          <td>
            <span v-if="row.image">image: {{ row.image }}</span>
          </td>
        </template>
        <template #col:executables="{ row }">
          <td>
            <span
              v-for="executable in row.executables"
              :key="executable"
              class="executable-pill"
            >
              {{ executable }}
            </span>
          </td>
        </template>
      </SortableTable>
    </template>
  </DetailPage>
</template>

<style lang="scss" scoped>
.executable-pill {
  display: inline-block;
  padding: 2px 8px;
  margin: 2px 4px 2px 0;
  border-radius: 4px;
  background: var(--tag-bg);
  color: var(--tag-primary);
  font-size: 13px;
}
</style>
