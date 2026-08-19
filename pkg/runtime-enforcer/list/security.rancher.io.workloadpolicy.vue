<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { DOCUMENTATION_URL, RESOURCE, type WorkloadPolicy } from '@runtime-enforcer/types';
import { getActivePoliciesHeaders } from '@runtime-enforcer/config/policy-proposals-table';
import RcButton from '@components/RcButton/RcButton.vue';
import _ from 'lodash';
import { WORKLOAD_KINDS } from '@shell/config/types';
import RichTranslation from '@shell/components/RichTranslation.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';
import { PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import ImportDialog from '@runtime-enforcer/components/rancher-overwritten/ImportDialog.vue';

const store = useStore();

const t = (key: string, ...args: any[]) => {
  const translate = store.getters['i18n/t'];

  return typeof translate === 'function' ? translate(key, ...args) : key;
};

function getAnyFilterOption() {
  return {
    value: 'any',
    label: t('runtimeEnforcer.activePolicies.filters.any')
  };
}

const filters = ref({
  policySearch:   '',
  workloadSearch: '',
  workloadType:   getAnyFilterOption(),
  mode:           getAnyFilterOption(),
  status:         getAnyFilterOption(),
});

const debouncedFilters = ref({ ...filters.value });

const selectedRows = ref<WorkloadPolicy[]>([]);
const useQueryParamsForSimpleFiltering = false;

watch(
  filters,
  _.debounce((newFilters) => {
    debouncedFilters.value = { ...newFilters };
  }, 500),
  { deep: true }
);

const schema = computed(() => store.getters['cluster/schemaFor'](RESOURCE.ACTIVE_POLICIES));

const headers = computed(() => getActivePoliciesHeaders());

const workloadTypeOptions = computed(() => {
  const workloadTypes = Object.values(WORKLOAD_KINDS).map((kind) => ({
    value: kind,
    label: kind,
  }));

  return [
    getAnyFilterOption(),
    ...workloadTypes
  ];
});

const modeOptions = computed(() => [
  getAnyFilterOption(),
  { value: 'monitor', label: t('runtimeEnforcer.activePolicies.mode.monitor') },
  { value: 'protect', label: t('runtimeEnforcer.activePolicies.mode.protect') },
]);

const statusOptions = computed(() => [
  getAnyFilterOption(),
  { value: 'transitioning', label: t('runtimeEnforcer.activePolicies.status.transitioning') },
  { value: 'ready', label: t('runtimeEnforcer.activePolicies.status.ready') },
  { value: 'failed', label: t('runtimeEnforcer.activePolicies.status.failed') },
]);

function getWorkloadOwnerReference(row: WorkloadPolicy) {
  return row?.metadata?.ownerReferences?.[0];
}

function getWorkloadName(row: WorkloadPolicy) {
  return getWorkloadOwnerReference(row)?.name || t('runtimeEnforcer.activePolicies.fallback.na');
}

function getWorkloadType(row: WorkloadPolicy) {
  return getWorkloadOwnerReference(row)?.kind || t('runtimeEnforcer.activePolicies.fallback.na');
}

function onSelectionChange(selected: WorkloadPolicy[]) {
  selectedRows.value = selected || [];
}

function filterSelectionValue(selection: unknown) {
  if (typeof selection === 'string') {
    return selection;
  }

  if (selection && typeof selection === 'object' && 'value' in selection) {
    return String((selection as { value?: string }).value || '');
  }

  return '';
}

function filterRowsLocal(rows: WorkloadPolicy[]) {
  const currentFilters = debouncedFilters.value;
  const workloadTypeFilterValue = filterSelectionValue(currentFilters.workloadType);
  const modeFilterValue = filterSelectionValue(currentFilters.mode);
  const statusFilterValue = filterSelectionValue(currentFilters.status);

  return rows.filter((row) => {
    const policy = row?.metadata?.name || '';
    const workloadName = getWorkloadName(row);
    const workloadType = getWorkloadType(row);
    const mode = row?.spec?.mode || '';
    const status = row?.status?.phase || '';

    const policyMatch = !currentFilters.policySearch || policy.toLowerCase().includes(currentFilters.policySearch.toLowerCase());
    const workloadMatch = !currentFilters.workloadSearch || workloadName.toLowerCase().includes(currentFilters.workloadSearch.toLowerCase());
    const workloadTypeMatch = workloadTypeFilterValue === 'any' || workloadType === workloadTypeFilterValue;
    const modeMatch = modeFilterValue === 'any' || mode.toLowerCase() === modeFilterValue.toLowerCase();
    const statusMatch = statusFilterValue === 'any' || status.toLowerCase() === statusFilterValue.toLowerCase();

    return policyMatch && workloadMatch && workloadTypeMatch && modeMatch && statusMatch;
  });
}

function filterRowsApi(pagination: any) {
  const currentFilters = debouncedFilters.value;
  const workloadTypeFilterValue = filterSelectionValue(currentFilters.workloadType);
  const modeFilterValue = filterSelectionValue(currentFilters.mode);
  const statusFilterValue = filterSelectionValue(currentFilters.status);

  const colFields = [
    {
      field:  'metadata.name',
      value:  currentFilters.policySearch,
      equals: true,
      exact:  false,
    },
    {
      field:  'metadata.ownerReferences.0.name',
      value:  currentFilters.workloadSearch,
      equals: true,
      exact:  false,
    },
    {
      field:  'metadata.ownerReferences.0.kind',
      value:  workloadTypeFilterValue === 'any' ? '' : workloadTypeFilterValue,
      equals: true,
      exact:  false,
    },
    {
      field:  'spec.mode',
      value:  modeFilterValue === 'any' ? '' : modeFilterValue,
      equals: true,
      exact:  false,
    },
    {
      field:  'status.phase',
      value:  statusFilterValue === 'any' ? '' : statusFilterValue,
      equals: true,
      exact:  false,
    },
  ];

  const colFilter = PaginationParamFilter.createMultipleFields(
    colFields.map((field) => new PaginationFilterField(field))
  );

  pagination.filters.push(colFilter);

  return pagination;
}

function exportSelected() {
  if (!selectedRows.value.length) {
    return;
  }
  store.dispatch('cluster/promptModal', {
    component:  'ExportActivePoliciesDialog',
    resources:  Array.isArray(selectedRows.value) ? selectedRows.value : [selectedRows.value],
    modalWidth: '640',
  });
}

function deleteSelected() {
  if (!selectedRows.value.length) {
    return;
  }

  store.dispatch('cluster/promptModal', {
    component:  'DeleteActivePoliciesDialog',
    resources:  Array.isArray(selectedRows.value) ? selectedRows.value : [selectedRows.value],
    modalWidth: '640',
  });
}

function changeModeSelected() {
  if (!selectedRows.value.length) {
    return;
  }

  store.dispatch('cluster/promptModal', {
    component:  'ChangeModeDialog',
    resources:  Array.isArray(selectedRows.value) ? selectedRows.value : [selectedRows.value],
    modalWidth: '640',
  });
};

async function fetchSecondaryResources({ canPaginate }: { canPaginate: boolean }) {
  if (canPaginate) {
    return;
  }

  return Promise.all(
    Object.values(WORKLOAD_KIND_TO_TYPE_MAPPING).map((workloadType) =>
      store.dispatch(`cluster/findAll`, { type: workloadType })
    )
  );
}

async function fetchPageSecondaryResources({ force, page }: { force: any; page: any[] }) {
  if (!page?.length) {
    return;
  }

  return Promise.all(
    Object.values(WORKLOAD_KIND_TO_TYPE_MAPPING).map((workloadType) =>
      store.dispatch(`cluster/findAll`, { type: workloadType })
    )
  );
}

function importYaml() {
  store.dispatch('cluster/promptModal', {
    component:      'ImportDialog',
    modalWidth:     '960px',
    height:         'auto',
    styles:         'max-height: 90vh;',
    componentProps: { cluster: store.state.cluster.currentCluster }
  });
}
</script>

<template>
  <div class="active-policies-page">
    <RcButton
      style="position: absolute; top: -64px; right: 0;"
      variant="primary"
      left-icon="upload"
      size="large"
      @click="importYaml()"
    >
      {{ t('runtimeEnforcer.activePolicies.actions.importYaml') }}
    </RcButton>

    <Banner
      color="info"
      class="policy-info-banner"
    >
      <span class="banner-text">
        <RichTranslation :k="'runtimeEnforcer.activePolicies.banner.text'">
          <template #documentation="{ content }">
            <SubtleLink
              :href="DOCUMENTATION_URL"
              target="_blank"
              :open-in-new-tab-label="t('generic.opensInNewTab')"
            >
              {{ content }}
            </SubtleLink>
          </template>
        </RichTranslation>
      </span>
    </Banner>

    <div class="filters-grid">
      <div class="filter-group">
        <label class="filter-label">{{ t('runtimeEnforcer.activePolicies.filters.policy') }}</label>
        <input
          v-model="filters.policySearch"
          type="text"
          class="form-control"
          :placeholder="t('runtimeEnforcer.activePolicies.filters.searchByName')"
        >
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t('runtimeEnforcer.activePolicies.filters.workload') }}</label>
        <input
          v-model="filters.workloadSearch"
          type="text"
          class="form-control"
          :placeholder="t('runtimeEnforcer.activePolicies.filters.searchByName')"
        >
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t('runtimeEnforcer.activePolicies.filters.workloadType') }}</label>
        <LabeledSelect
          v-model:value="filters.workloadType"
          :options="workloadTypeOptions"
          :close-on-select="true"
          :multiple="false"
          size="medium"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t('runtimeEnforcer.activePolicies.filters.mode') }}</label>
        <LabeledSelect
          v-model:value="filters.mode"
          :options="modeOptions"
          :close-on-select="true"
          :multiple="false"
          size="medium"
        />
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t('runtimeEnforcer.activePolicies.filters.status') }}</label>
        <LabeledSelect
          v-model:value="filters.status"
          :options="statusOptions"
          :close-on-select="true"
          :multiple="false"
          size="medium"
        />
      </div>
    </div>

    <PaginatedResourceTable
      table-key="runtime-enforcer-active-policies-figma-columns"
      :headers="headers"
      :schema="schema"
      :namespaced="true"
      :groupable="false"
      :table-actions="true"
      :row-actions="true"
      :search="false"
      :has-advanced-filtering="false"
      :key-field="'id'"
      :local-filter="filterRowsLocal"
      :api-filter="filterRowsApi"
      :fetch-secondary-resources="fetchSecondaryResources"
      :fetch-page-secondary-resources="fetchPageSecondaryResources"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      @selection="onSelectionChange"
    >
      <template #header-left>
        <div class="table-top-left">
          <RcButton
            variant="primary"
            size="medium"
            :disabled="!selectedRows.length"
            @click="changeModeSelected"
          >
            <i class="icon icon-refresh"></i>
            {{ t('runtimeEnforcer.activePolicies.actions.changeMode') }}
          </RcButton>
          <RcButton
            variant="primary"
            size="medium"
            :disabled="!selectedRows.length"
            @click="exportSelected"
          >
            <i class="icon icon-download"></i>
            {{ t('runtimeEnforcer.activePolicies.actions.export') }}
          </RcButton>
          <RcButton
            variant="primary"
            size="medium"
            :disabled="!selectedRows.length"
            @click="deleteSelected"
          >
            <i class="icon icon-delete"></i>
            {{ t('runtimeEnforcer.activePolicies.actions.delete') }}
          </RcButton>
          <div
            v-if="selectedRows.length"
            class="selected-count"
          >
            {{ selectedRows.length }} {{ t('runtimeEnforcer.activePolicies.selectedCount', { count: selectedRows.length }, true) }}
          </div>
        </div>
      </template>
    </PaginatedResourceTable>
  </div>
</template>

<style scoped lang="scss">
  .active-policies-page {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 24px;
    min-height: 100%;
  }

  .page-title {
    margin: 0;
    font-size: 32px;
    font-weight: 600;
    line-height: 1.1;
  }

  .policy-info-banner {
    margin: 0;
  }

  .banner-text {
    display: inline;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
  }

  .doc-link {
    color: var(--link);
    font-weight: 600;
    text-decoration: underline;
  }

  .doc-link:hover {
    color: var(--body-text);
  }

  .filters-grid {
    display: flex;
    gap: 16px;
  }

  .filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
    flex: 1;
  }

  .filter-label {
    font-size: 13px;
    color: var(--body-text);
  }

  .form-control {
    height: 32px;
    box-sizing: border-box;
    border: 1px solid var(--border);
    border-radius: 4px;
    padding: 0 10px;
    font-size: 13px;
    width: 100%;
  }

  .table-top-left {
    display: flex;
    align-items: center;
    justify-content: start;
    gap: 12px;
  }

  .table-btn {
    height: 40px;
  }

  .selected-count {
    font-weight: 400;
  }

</style>
