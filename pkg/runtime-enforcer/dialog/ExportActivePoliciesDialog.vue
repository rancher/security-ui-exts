<script>
import { Card } from '@components/Card';
import RcButton from '@components/RcButton/RcButton.vue';
import { downloadFile } from '@shell/utils/download';

export default {
  emits: ['close'],

  components: {
    Card,
    RcButton,
  },

  props: {
    resources: {
      type:    Array,
      default: () => [],
    },
  },

  computed: {
    isBulk() {
      return this.resources.length > 1;
    },

    title() {
      return this.t(`runtimeEnforcer.activePolicies.exportDialog.title.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    confirmText() {
      return this.isBulk
        ? this.t('runtimeEnforcer.activePolicies.exportDialog.confirm.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.activePolicies.exportDialog.confirm.single', { name: this.resources[0]?.nameDisplay }, true);
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    // Single export produces one YAML file named after the policy. Bulk export also produces
    // a single YAML file, but with all selected policies as separate documents joined by '---'.
    // Each policy's YAML is fetched and cleaned of Steve-added fields, mirroring the base
    // model's download()/downloadBulk().
    async exportPolicies() {
      const yamls = await Promise.all(this.resources.map(async(resource) => {
        const value = await resource.followLink('view', { headers: { accept: 'application/yaml' } });

        return resource.cleanForDownload(value.data);
      }));

      const yaml = yamls.join('---\n');
      const fileName = this.isBulk ? 'active-policies.yaml' : `${ this.resources[0]?.metadata?.name || this.resources[0]?.nameDisplay }.yaml`;

      await downloadFile(fileName, yaml, 'application/yaml');

      this.close();
    },
  },
};
</script>

<template>
  <Card
    class="export-active-policies-dialog-card"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ title }}
      </h4>
    </template>
    <template #body>
      <p
        class="confirm-text"
        v-clean-html="confirmText"
      />
    </template>
    <template #actions>
      <RcButton
        variant="link"
        size="large"
        @click="close"
      >
        {{ t('runtimeEnforcer.activePolicies.exportDialog.cancel') }}
      </RcButton>
      <RcButton
        variant="primary"
        size="large"
        left-icon="download"
        class="ml-10"
        @click="exportPolicies"
      >
        {{ t('runtimeEnforcer.activePolicies.exportDialog.export') }}
      </RcButton>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.export-active-policies-dialog-card {
  box-shadow: none;

  :deep(.card-actions) {
    justify-content: end;
  }

  .confirm-text {
    margin: 0;
  }
}
</style>
