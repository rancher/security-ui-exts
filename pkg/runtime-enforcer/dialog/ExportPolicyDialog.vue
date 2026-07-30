<script>
import jsyaml from 'js-yaml';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import RcButton from '@components/RcButton/RcButton.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { downloadFile } from '@shell/utils/download';
import { POLICY_MODE, RESOURCE } from '../types/runtime-enforcer';

export default {
  emits: ['close'],

  components: {
    Card,
    Banner,
    RcButton,
    LabeledSelect,
  },

  props: {
    resources: {
      type:    Array,
      default: () => [],
    },
    type: {
      type:    String,
      default: RESOURCE.POLICY_PROPOSALS,
    },
  },

  data() {
    return {
      targetMode: POLICY_MODE.MONITOR,
      RESOURCE,
    };
  },

  computed: {
    isBulk() {
      console.log('type', this.type);
      return this.resources.length > 1;
    },

    modeOptions() {
      return [
        { value: POLICY_MODE.MONITOR, label: this.t('runtimeEnforcer.policyProposal.exportDialog.mode.monitor') },
        { value: POLICY_MODE.PROTECT, label: this.t('runtimeEnforcer.policyProposal.exportDialog.mode.protect') },
      ];
    },

    title() {
      return this.t(`runtimeEnforcer.policyProposal.exportDialog.title.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    bannerText() {
      return this.t(`runtimeEnforcer.policyProposal.exportDialog.banner.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    confirmText() {
      return this.type === RESOURCE.POLICY_PROPOSALS ? (this.isBulk
        ? this.t('runtimeEnforcer.policyProposal.exportDialog.confirm.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.policyProposal.exportDialog.confirm.single', { name: this.resources[0]?.nameDisplay }, true)) : (this.isBulk
        ? this.t('runtimeEnforcer.activePolicies.exportDialog.confirm.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.activePolicies.exportDialog.confirm.single', { name: this.resources[0]?.nameDisplay }, true)
      );
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    // Single export produces one YAML file named after the proposal. Bulk export also produces
    // a single YAML file, but with all selected proposals as separate documents joined by '---'.
    async exportPolicies() {
      const yaml = this.resources
        .map((resource) => jsyaml.dump(this.type === RESOURCE.POLICY_PROPOSALS ? resource.toActivePolicyResource(this.targetMode) : resource))
        .join('---\n');

      const fileName = this.isBulk ? 'active-policies.yaml' : `${ this.resources[0]?.metadata?.name || this.resources[0]?.nameDisplay }.yaml`;

      await downloadFile(fileName, yaml, 'application/yaml');

      this.close();
    },
  },
};
</script>

<template>
  <Card
    class="export-policy-dialog-card"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ title }}
      </h4>
    </template>
    <template #body>
      <Banner
        v-if="type === RESOURCE.POLICY_PROPOSALS"
        class="export-banner"
        color="info"
      >
        {{ bannerText }}
      </Banner>
      <p
        class="export-confirm-text"
        v-clean-html="confirmText"
      />
      <LabeledSelect
        class="export-mode-select"
        v-model:value="targetMode"
        :options="modeOptions"
      />
    </template>
    <template #actions>
      <RcButton
        variant="link"
        size="large"
        @click="close"
      >
        {{ t('runtimeEnforcer.policyProposal.exportDialog.cancel') }}
      </RcButton>
      <RcButton
        variant="primary"
        size="large"
        left-icon="download"
        class="ml-10"
        @click="exportPolicies"
      >
        {{ t('runtimeEnforcer.policyProposal.exportDialog.export') }}
      </RcButton>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.export-policy-dialog-card {
  box-shadow: none;

  :deep(.card-actions) {
    justify-content: end;
  }

  .export-banner {
    margin: 16px 0 24px;
  }

  .export-confirm-text {
    margin: 0 0 16px;
  }

  .export-mode-select {
    margin-bottom: 20px;
  }
}
</style>
