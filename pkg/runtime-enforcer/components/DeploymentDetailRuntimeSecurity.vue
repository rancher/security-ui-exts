<template>
  <div v-if="workload" class="deployment-runtime-security-container">
    <div class="separator-line" />
    <div class="deployment-runtime-security-row">
      <span class="detail-label">
        {{ t('runtimeEnforcer.tableColumns.runtimeSecurity.header') }}
      </span>
      <div class="detail-value">
        <RuntimeSecurityCell :row="workload" />
      </div>
    </div>
  </div>
</template>

<script>
import RuntimeSecurityCell from '../formatters/RuntimeSecurityCell.vue';

export default {
  name: 'DeploymentDetailRuntimeSecurity',
  components: {
    RuntimeSecurityCell,
  },
  props: {
    value: {
      type: Object,
      default: () => null,
    },
    resource: {
      type: Object,
      default: () => null,
    },
  },
  computed: {
    workload() {
      return this.value || this.resource;
    },
  },
};
</script>

<style lang="scss" scoped>
.deployment-runtime-security-container {
  width: 100%;

  .separator-line {
    width: 100%;
    height: 1px;
    background-color: var(--border, #dcdee4);
    margin-top: 16px;
    margin-bottom: 16px;
  }

  .deployment-runtime-security-row {
    display: flex;
    align-items: center;
    margin-bottom: 4px;
    font-family: Lato, sans-serif;
    font-size: 14px;
    line-height: 21px;

    .detail-label {
      color: var(--text-muted, #6c6c76);
      width: 160px;       /* Match standard Rancher metadata label width */
      min-width: 160px;
      font-weight: 400;
    }

    .detail-value {
      display: inline-flex;
      align-items: center;
    }
  }
}
</style>