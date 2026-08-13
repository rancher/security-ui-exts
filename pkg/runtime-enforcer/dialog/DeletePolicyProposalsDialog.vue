<script>
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import RcButton from '@components/RcButton/RcButton.vue';
import { PRODUCT_NAME } from '@runtime-enforcer/types';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { TIMESTAMP } from '@shell/config/labels-annotations';
import { WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';

export default {
  emits: ['close'],

  components: {
    Card,
    Banner,
    RcButton,
  },

  props: {
    resources: {
      type:    Array,
      default: () => [],
    },
  },

  data() {
    return {
      deleteInProgress: false,
    };
  },

  computed: {
    isBulk() {
      return this.resources.length > 1;
    },

    title() {
      return this.t(`runtimeEnforcer.policyProposal.deleteDialog.title.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    bannerText() {
      return this.t(`runtimeEnforcer.policyProposal.deleteDialog.banner.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    deleteButtonText() {
      return this.isBulk
        ? this.t('runtimeEnforcer.policyProposal.deleteDialog.delete.bulk')
        : this.t('runtimeEnforcer.policyProposal.deleteDialog.delete.single');
    },

    restartWorkloadText() {
      return this.isBulk
        ? this.t('runtimeEnforcer.policyProposal.deleteDialog.restartWorkload.bulk')
        : this.t('runtimeEnforcer.policyProposal.deleteDialog.restartWorkload.single');
    },

    confirmText() {
      return this.isBulk
        ? this.t('runtimeEnforcer.policyProposal.deleteDialog.confirm.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.policyProposal.deleteDialog.confirm.single', { name: this.resources[0]?.nameDisplay, workload: this.resources[0]?.metadata?.ownerReferences?.[0]?.name }, true);
    },

    growlMessage() {
      return this.isBulk
        ? this.t('runtimeEnforcer.policyProposal.deleteDialog.growl.bulk', { count: this.resources.length })
        : this.t('runtimeEnforcer.policyProposal.deleteDialog.growl.single', { name: this.resources[0]?.nameDisplay });
    },

    growlTitle() {
      return this.isBulk
        ? this.t('runtimeEnforcer.policyProposal.deleteDialog.growl.title.bulk')
        : this.t('runtimeEnforcer.policyProposal.deleteDialog.growl.title.single');
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async redeployWorkload(resource) {
      try {
        const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

        //Keep this log for debugging some special workload type, like CronJob
        console.log('Fetch the workload based on type:', resource);

        const workload = await this.$store.dispatch('cluster/find', {
          type: WORKLOAD_KIND_TO_TYPE_MAPPING[resource.metadata?.ownerReferences?.[0]?.kind],
          id:   `${ resource.metadata.namespace }/${ resource.metadata.ownerReferences?.[0]?.name }`,
        });

        //Keep this log for debugging some special workload type, like CronJob
        console.log('After fetching, the workload is:', workload);

        if (!workload) {
          return;
        }

        const podTemplate = workload.spec?.jobTemplate?.spec?.template ?? workload.spec?.template;

        if (!podTemplate) {
          return;
        }

        const metadata = podTemplate.metadata ??= {};
        const annotations = metadata.annotations ??= {};

        annotations[TIMESTAMP] = now;

        await workload.save();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
      }
    },

    async deletePolicies() {
      this.deleteInProgress = true;
      await Promise.all((this.resources || []).map(async (resource) => {
        const resourceBackup = { ...resource };
        await resource?.remove?.();
        await this.redeployWorkload(resourceBackup);
      }));

      this.deleteInProgress = false;

      this.$store.dispatch('growl/success', { title: this.growlTitle, message: this.growlMessage });

      this.$router.push({
        name:   `c-cluster-${ PRODUCT_NAME }-resource`,
        params: {
          cluster: this.$route.params.cluster,
          product: PRODUCT_NAME
        }
      });
      this.close();
    },
  },
};
</script>

<template>
  <Card
    class="delete-policy-proposals-dialog-card"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ title }}
      </h4>
    </template>
    <template #body>
      <Banner
        class="banner"
        color="info"
      >
        {{ bannerText }}
      </Banner>
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
        {{ t('runtimeEnforcer.policyProposal.deleteDialog.cancel') }}
      </RcButton>
      <RcButton
        variant="danger"
        size="large"
        left-icon="trash"
        class="ml-10 bg-danger"
        :disabled="deleteInProgress"
        @click="deletePolicies"
      >
        {{ deleteButtonText }} & {{ restartWorkloadText }}
      </RcButton>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.delete-policy-proposals-dialog-card {
  box-shadow: none;

  :deep(.card-actions) {
    justify-content: end;
  }

  .banner {
    margin: 16px 0 24px;
  }

  .confirm-text {
    margin: 0 0 16px;
  }

  .bg-danger {
    background-color: var(--error) !important;
  }
  .bg-danger:disabled {
    background-color: var(--rc-active-disabled-background) !important;
  }
}
</style>
