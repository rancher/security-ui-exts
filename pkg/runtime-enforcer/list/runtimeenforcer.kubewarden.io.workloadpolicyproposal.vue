<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import Banner from '@components/Banner/Banner.vue';
import PaginatedResourceTable from '@common/components/customized/PaginatedResourceTable.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import RichTranslation from '@shell/components/RichTranslation.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { DOCUMENTATION_URL, RESOURCE, type WorkloadPolicyProposal } from '@runtime-enforcer/types';
import { getPolicyProposalHeaders, getContainerTableHeaders } from '@runtime-enforcer/config/policy-proposals-table';
import RcButton from '@components/RcButton/RcButton.vue';
import _ from 'lodash';
import { WORKLOAD_KINDS } from '@shell/config/types';
import SortableTable from '@common/components/customized/SortableTable';
import { WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';
import { FilterArgs, PaginationFilterField, PaginationParamFilter } from '@shell/types/store/pagination.types';

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
const proposalTable = ref<any>(null);
const useQueryParamsForSimpleFiltering = false;

watch(
  filters,
  _.debounce((newFilters) => {
    debouncedFilters.value = { ...newFilters };
  }, 500),
  { deep: true }
);

const schema = computed(() => store.getters['cluster/schemaFor'](RESOURCE.POLICY_PROPOSALS));
const schema4ActivePolicies = computed(() => store.getters['cluster/schemaFor'](RESOURCE.ACTIVE_POLICIES));

const canPromote = computed(() => !!schema4ActivePolicies.value?.canCreate);

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

function promoteSelected() {
  if (!selectedRows.value.length) {
    return;
  }

  store.dispatch('cluster/promptModal', {
    component:  'PromotePolicyDialog',
    resources:  Array.isArray(selectedRows.value) ? [...selectedRows.value] : [selectedRows.value],
    modalWidth: '640',
  });
}

function exportSelected() {
  if (!selectedRows.value.length) {
    return;
  }
  store.dispatch('cluster/promptModal', {
    component:  'ExportPolicyProposalsDialog',
    resources:  Array.isArray(selectedRows.value) ? selectedRows.value : [selectedRows.value],
    modalWidth: '640',
  });
}

function deleteSelected() {
  if (!selectedRows.value.length) {
    return;
  }

  store.dispatch('cluster/promptModal', {
    component:  'DeletePolicyProposalsDialog',
    resources:  Array.isArray(selectedRows.value) ? [...selectedRows.value] : [selectedRows.value],
    modalWidth: '640',
  });
}

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

  const opt = {
    force,
    pagination: new FilterArgs({
      filters: PaginationParamFilter.createMultipleFields(page.map((r: any) => new PaginationFilterField({
        field: 'id',
        value: `${ r.metadata.namespace }/${ r.metadata.name }`
      }))),
    })
  };
  const workloadResource = WORKLOAD_KIND_TO_TYPE_MAPPING[page[0]?.metadata?.ownerReferences?.[0]?.kind];
  const workload = await store.dispatch(`cluster/findPage`, { type: workloadResource, opt });

  return workload;
}
</script>

<template>
  <div class="policy-proposals-page">

    <Banner
      color="info"
      class="policy-info-banner"
    >
      <span class="banner-text">
        <RichTranslation :k="'runtimeEnforcer.policyProposals.banner.text'">
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
          size="medium"
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
            @click="promoteSelected"
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
            @click="deleteSelected"
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
      <template #header-right="{ expandAll, collapseAll }">
        <div class="table-top-right">
          <div
            role="button"
            class="expand-collapse-btn"
            @click="expandAll"
          >
            {{ t('runtimeEnforcer.policyProposals.actions.expandAll') }}
          </div> |
          <div
            role="button"
            class="expand-collapse-btn"
            @click="collapseAll"
          >
            {{ t('runtimeEnforcer.policyProposals.actions.collapseAll') }}
          </div>
        </div>
      </template>
      <template #sub-row="{ row, fullColspan }">
        <tr class="ss-sub-row">
          <td :colspan="fullColspan">
            <SortableTable
              class="sub-table"
              :rows="row.childrenRec"
              :search="false"
              :headers="subHeaders"
              :row-actions="false"
              :table-actions="false"
              :key-field="'id'"
            >
              <template #col:image="{ row }">
                <td>
                  <span
                    v-if="row.image"
                    class="image-wrap"
                  >
                    {{ row.image }}
                  </span>
                  <span v-else class="text-muted">-</span>
                </td>
              </template>
            </SortableTable>
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

  .table-top-right {
    flex: auto;
    display: flex;
    align-items: center;
    justify-content: end;
    gap: 12px;
  }

  .expand-collapse-btn {
    cursor: pointer;
    color: var(--primary);
    font-size: 14px;
    font-weight: 400;
  }
  .image-wrap {
    display: inline-block;
    max-width: 100%;
    overflow-wrap: anywhere;
  }

</style>
