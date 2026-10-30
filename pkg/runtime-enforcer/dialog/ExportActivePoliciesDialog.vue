<script>
import jsyaml from 'js-yaml';
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

  data() {
    return { exportInProgress: false };
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
    async exportPolicies() {
      const key = 'runtimeEnforcer.activePolicies.exportDialog.growl';

      this.exportInProgress = true;
      try {
        const yaml = this.resources
          .map((resource) => jsyaml.dump(resource.toExportResource()))
          .join('---\n');

        const fileName = this.isBulk ? 'active-policies.yaml' : `${ this.resources[0]?.metadata?.name || this.resources[0]?.nameDisplay }.yaml`;

        await downloadFile(fileName, yaml, 'application/yaml');

        this.$store.dispatch('growl/success', {
          title:   this.t(`${ key }.title.${ this.isBulk ? 'bulk' : 'single' }`, {}, true),
          message: this.isBulk
            ? this.t(`${ key }.message.bulk`, { count: this.resources.length }, true)
            : this.t(`${ key }.message.single`, { name: this.resources[0]?.nameDisplay }, true),
        });
        this.close();
      } catch (err) {
        this.$store.dispatch('growl/error', { title: this.t(`${ key }.title.error`, {}, true), message: err.message });
      } finally {
        this.exportInProgress = false;
      }
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
        :disabled="exportInProgress"
        @click="close"
      >
        {{ t('runtimeEnforcer.activePolicies.exportDialog.cancel') }}
      </RcButton>
      <RcButton
        variant="primary"
        size="large"
        left-icon="download"
        class="ml-10"
        :disabled="exportInProgress"
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
