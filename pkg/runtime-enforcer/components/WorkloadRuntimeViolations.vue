<template>
  <div v-if="boundPolicy" class="workload-runtime-violations">
    <div class="banner-row mb-24">
      <Banner color="info" class="policy-info-banner">
        <span class="banner-text">
          <span>{{ t('runtimeEnforcer.workloadViolations.banner.prefix') }} </span>
          <router-link :to="policyDetailLocation" class="policy-link">
            {{ policyName }}
          </router-link>
          <span> {{ t('runtimeEnforcer.workloadViolations.banner.middle') }} </span>
          <strong class="mode-text">{{ modeLabel }}</strong>
          <span> {{ t('runtimeEnforcer.workloadViolations.banner.suffix') }} </span>
          <SubtleLink
              :href="DOCUMENTATION_URL"
              target="_blank"
              :open-in-new-tab-label="t('generic.opensInNewTab')"
              class="doc-link"
          >
            {{ t('runtimeEnforcer.workloadViolations.banner.documentation') }}
          </SubtleLink>
          <span>.</span>
        </span>
      </Banner>
    </div>

    <SortableTable
        key-field="id"
        :rows="rows"
        :headers="headers"
        :table-actions="false"
        :row-actions="false"
        :search="false"
        :paging="true"
        :default-sort-by="'occurrences'"
        :default-sort-order="'desc'"
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

      <template #col:lastObservedTimestamp="{ row }">
        <td>
          <LiveDate
              v-if="row.lastObservedTimestamp"
              :value="row.lastObservedTimestamp"
              add-suffix
          />
          <span v-else class="text-muted">-</span>
        </td>
      </template>

      <template #col:firstObservedTimestamp="{ row }">
        <td>
          <LiveDate
              v-if="row.firstObservedTimestamp"
              :value="row.firstObservedTimestamp"
          />
          <span v-else class="text-muted">-</span>
        </td>
      </template>
    </SortableTable>
  </div>

  <div v-else class="unprotected-banner p-20 text-muted">
    {{ t('runtimeEnforcer.workloadViolations.unprotected') }}
  </div>
</template>

<script>
import Banner from '@components/Banner/Banner.vue';
import RichTranslation from '@shell/components/RichTranslation.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import SortableTable from '@shell/components/SortableTable';
import LiveDate from '@shell/components/formatter/LiveDate.vue';
import { RESOURCE, PRODUCT_NAME, POLICY_MODE, DOCUMENTATION_URL } from '../types/runtime-enforcer';
import { findBoundPolicy } from '../utils/workload-policy';

export default {
  name: 'WorkloadRuntimeViolations',
  components: {
    Banner,
    RichTranslation,
    SubtleLink,
    SortableTable,
    LiveDate,
  },
  props: {
    value: {
      type:    Object,
      default: () => ({}),
    },
    resource: {
      type:    Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      DOCUMENTATION_URL,
    };
  },
  async fetch() {
    const existing = this.$store.getters['cluster/all']?.(RESOURCE.ACTIVE_POLICIES);
    if (!existing || !existing.length) {
      try {
        await this.$store.dispatch('cluster/findAll', { type: RESOURCE.ACTIVE_POLICIES });
      } catch {
        // Handle fetch error gracefully
      }
    }
  },
  computed: {
    workload() {
      return this.value?.metadata ? this.value : this.resource;
    },
    cluster() {
      return this.$route.params.cluster || this.$store.getters['currentCluster']?.id || 'local';
    },
    boundPolicy() {
      const allPolicies = this.$store.getters['cluster/all']?.(RESOURCE.ACTIVE_POLICIES) || [];
      return findBoundPolicy(this.workload, allPolicies);
    },
    policyName() {
      return this.boundPolicy?.metadata?.name || '';
    },
    policyNamespace() {
      return this.boundPolicy?.metadata?.namespace || this.workload?.metadata?.namespace || '';
    },
    mode() {
      return this.boundPolicy?.spec?.mode?.toLowerCase() || '';
    },
    modeLabel() {
      if (this.mode === POLICY_MODE.PROTECT) {
        return this.t('runtimeEnforcer.activePolicies.mode.protect');
      }
      if (this.mode === POLICY_MODE.MONITOR) {
        return this.t('runtimeEnforcer.activePolicies.mode.monitor');
      }
      return this.mode || '';
    },
    imageMap() {
      const podTemplate = this.workload?.spec?.jobTemplate?.spec?.template ?? this.workload?.spec?.template ?? this.workload;
      const containers = podTemplate?.spec?.containers || [];

      return containers.reduce((acc, container) => {
        if (container?.name) {
          acc[container.name] = container.image || '';
        }
        return acc;
      }, {});
    },
    rows() {
      const violations = this.boundPolicy?.status?.violations || [];
      return violations.map((violation, index) => {
        const containerName = violation.containerName || '';
        const executablePath = violation.executablePath || '';

        return {
          id:                     `${ containerName }-${ executablePath }-${ index }`,
          executable:             executablePath || '-',
          occurrences:            violation.occurrences ?? '-',
          container:              containerName || '-',
          image:                  this.imageMap?.[containerName] || '',
          node:                   violation.nodeName || '-',
          lastObservedTimestamp:  violation.lastObservedTimestamp,
          firstObservedTimestamp: violation.firstObservedTimestamp,
          containerName,
          executablePath,
        };
      });
    },
    headers() {
      return [
        {
          name:     'executable',
          value:    'executable',
          label:    this.t('runtimeEnforcer.activePolicy.violations.table.executable'),
          sort:     'executable',
          width:    260,
        },
        {
          name:     'occurrences',
          value:    'occurrences',
          label:    this.t('runtimeEnforcer.activePolicy.violations.table.occurrences'),
          sort:     'occurrences',
          width:    110,
        },
        {
          name:     'container',
          value:    'container',
          label:    this.t('runtimeEnforcer.activePolicy.violations.table.container'),
          sort:     'container',
          width:    160,
        },
        {
          name:     'image',
          value:    'image',
          label:    this.t('runtimeEnforcer.activePolicy.violations.table.image'),
          sort:     'image',
          width:    180,
        },
        {
          name:     'node',
          value:    'node',
          label:    this.t('runtimeEnforcer.activePolicy.violations.table.node'),
          sort:     'node',
          width:    130,
        },
        {
          name:     'lastObservedTimestamp',
          value:    'lastObservedTimestamp',
          label:    this.t('runtimeEnforcer.activePolicy.violations.table.lastOccurrence'),
          sort:     'lastObservedTimestamp',
          width:    140,
        },
        {
          name:     'firstObservedTimestamp',
          value:    'firstObservedTimestamp',
          label:    this.t('runtimeEnforcer.activePolicy.violations.table.age'),
          sort:     'firstObservedTimestamp',
          width:    100,
        },
      ];
    },
    policyDetailLocation() {
      return {
        name:   'c-cluster-product-resource-namespace-id',
        params: {
          cluster:   this.cluster,
          product:   PRODUCT_NAME,
          resource:  RESOURCE.ACTIVE_POLICIES,
          namespace: this.policyNamespace,
          id:        this.policyName,
        },
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.workload-runtime-violations {
  display: flex;
  flex-direction: column;
  width: 100%;
}

.banner-row {
  width: 100%;

  :deep(.banner.info) {
    margin: 0;
    display: flex;
    align-items: center;
  }

  .banner-text {
    display: inline-block;
    font-size: 14px;
    line-height: 20px;
    color: var(--body-text);

    .policy-link {
      font-weight: 600;
      color: var(--body-text);
      text-decoration: underline;

      &:hover {
        color: var(--link);
      }
    }

    .mode-text {
      font-weight: 600;
    }

    .doc-link {
      color: var(--body-text);
      text-decoration: underline;

      &:hover {
        color: var(--link);
      }
    }
  }
}

.mb-24 {
  margin-bottom: 24px;
}

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