<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import PaginatedResourceTable from '@shell/components/PaginatedResourceTable';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { RESOURCE, type WorkloadPolicyProposal } from '@runtime-enforcer/types';
import { getPolicyProposalHeaders, getContainerTableHeaders } from '@runtime-enforcer/config/policy-proposals-table';
import RcButton from '@components/RcButton/RcButton.vue';
import _ from 'lodash';
import { PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';
import { WORKLOAD_KINDS } from '@shell/config/types';
import SortableTable from '@shell/components/SortableTable';

const DOCUMENTATION_URL = 'https://documentation.suse.com/cloudnative/security/latest/en/runtime-enforcer/index.html';

const store = useStore();

const t = (key: string, ...args: any[]) => {
  const translate = store.getters['i18n/t'];

  return typeof translate === 'function' ? translate(key, ...args) : key;
};

function getAnyFilterOption() {
  return {
    value: 'any',
    label: t('runtimeEnforcer.policyProposals.filters.any')
  };
}

const filters = ref({
  policySearch:   '',
  workloadSearch: '',
  workloadType:   getAnyFilterOption(),
});

const debouncedFilters = ref({ ...filters.value });

const selectedRows = ref<WorkloadPolicyProposal[]>([]);
const useQueryParamsForSimpleFiltering = false;

watch(
  filters,
  _.debounce((newFilters) => {
    debouncedFilters.value = { ...newFilters };
  }, 500),
  { deep: true }
);

const schema = computed(() => store.getters['cluster/schemaFor'](RESOURCE.POLICY_PROPOSALS));

const canPromote = computed(() => !!schema.value?.canCreate);

const headers = computed(() => getPolicyProposalHeaders({ canPromote: canPromote.value }));

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

function getWorkloadOwnerReference(row: WorkloadPolicyProposal) {
  return row?.metadata?.ownerReferences?.[0];
}

function getWorkloadName(row: WorkloadPolicyProposal) {
  return getWorkloadOwnerReference(row)?.name || t('runtimeEnforcer.policyProposals.fallback.na');
}

function getWorkloadType(row: WorkloadPolicyProposal) {
  return getWorkloadOwnerReference(row)?.kind || t('runtimeEnforcer.policyProposals.fallback.na');
}

const subHeaders = getContainerTableHeaders();

function onSelectionChange(selected: WorkloadPolicyProposal[]) {
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

function filterRowsLocal(rows: WorkloadPolicyProposal[]) {
  const currentFilters = debouncedFilters.value;
  const workloadTypeFilterValue = filterSelectionValue(currentFilters.workloadType);

  return rows.filter((row) => {
    const policy = row?.metadata?.name || '';
    const workloadName = getWorkloadName(row);
    const workloadType = getWorkloadType(row);

    const policyMatch = !currentFilters.policySearch || policy.toLowerCase().includes(currentFilters.policySearch.toLowerCase());
    const workloadMatch = !currentFilters.workloadSearch || workloadName.toLowerCase().includes(currentFilters.workloadSearch.toLowerCase());
    const workloadTypeMatch = workloadTypeFilterValue === 'any' || workloadType === workloadTypeFilterValue;

    return policyMatch && workloadMatch && workloadTypeMatch;
  });
}

function filterRowsApi(pagination: any) {
  const currentFilters = debouncedFilters.value;
  const workloadTypeFilterValue = filterSelectionValue(currentFilters.workloadType);

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

  const content = JSON.stringify(selectedRows.value, null, 2);
  const blob = new Blob([content], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');

  anchor.href = url;
  anchor.download = 'workload-policy-proposals.json';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}
</script>

<template>
  <div class="policy-proposals-page">

    <Banner
      color="info"
      class="policy-info-banner"
    >
      <span class="banner-text">
        {{ t('runtimeEnforcer.policyProposals.banner.text') }}
        <a
          :href="DOCUMENTATION_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="doc-link"
        >
          {{ t('runtimeEnforcer.policyProposals.banner.documentation') }}
        </a>
      </span>
    </Banner>

    <div class="filters-grid">
      <div class="filter-group">
        <label class="filter-label">{{ t('runtimeEnforcer.policyProposals.filters.policy') }}</label>
        <input
          v-model="filters.policySearch"
          type="text"
          class="form-control"
          :placeholder="t('runtimeEnforcer.policyProposals.filters.searchByName')"
        >
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t('runtimeEnforcer.policyProposals.filters.workload') }}</label>
        <input
          v-model="filters.workloadSearch"
          type="text"
          class="form-control"
          :placeholder="t('runtimeEnforcer.policyProposals.filters.searchByName')"
        >
      </div>

      <div class="filter-group">
        <label class="filter-label">{{ t('runtimeEnforcer.policyProposals.filters.workloadType') }}</label>
        <LabeledSelect
          v-model:value="filters.workloadType"
          :options="workloadTypeOptions"
          :close-on-select="true"
          :multiple="false"
        />
      </div>
    </div>

    <PaginatedResourceTable
      ref="proposalTable"
      table-key="runtime-enforcer-policy-proposals-figma-columns"
      :headers="headers"
      :schema="schema"
      :namespaced="true"
      :groupable="false"
      :table-actions="true"
      :row-actions="true"
      :search="false"
      :sub-expandable="true"
      :sub-rows="true"
      :sub-expand-column="true"
      :has-advanced-filtering="false"
      :key-field="'id'"
      :local-filter="filterRowsLocal"
      :api-filter="filterRowsApi"
      :use-query-params-for-simple-filtering="useQueryParamsForSimpleFiltering"
      @selection="onSelectionChange"
    >
      <template #header-left>
        <div class="table-top-left">
          <RcButton
            variant="primary"
            size="medium"
            :disabled="!selectedRows.length"
          >
            <i class="icon icon-upgrade-alt"></i>
            {{ t('runtimeEnforcer.policyProposals.actions.promote') }}
          </RcButton>
          <RcButton
            variant="primary"
            size="medium"
            :disabled="!selectedRows.length"
            @click="exportSelected"
          >
            <i class="icon icon-download"></i>
            {{ t('runtimeEnforcer.policyProposals.actions.export') }}
          </RcButton>
          <RcButton
            variant="primary"
            size="medium"
            :disabled="!selectedRows.length"
          >
            <i class="icon icon-delete"></i>
            {{ t('runtimeEnforcer.policyProposals.actions.delete') }}
          </RcButton>
          <div
            v-if="selectedRows.length"
            class="selected-count"
          >
            {{ selectedRows.length }} {{ t('runtimeEnforcer.policyProposals.selectedCount', { count: selectedRows.length }, true) }}
          </div>
        </div>
      </template>
      <template
        #sub-row="{ row, fullColspan }"
      >
        <tr class="sub-row">
          <td :colspan="fullColspan">
            <SortableTable
              class="sub-table"
              :rows="row.childrenRec"
              :search="false"
              :headers="subHeaders"
              :row-actions="false"
              :table-actions="false"
              :key-field="'id'"
            />
          </td>
        </tr>
      </template>
    </PaginatedResourceTable>
  </div>
</template>

<style scoped lang="scss">
  .policy-proposals-page {
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
    height: 40px;//32px;
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
