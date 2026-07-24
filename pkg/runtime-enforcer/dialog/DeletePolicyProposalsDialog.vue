<script>
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import RcButton from '@components/RcButton/RcButton.vue';
import { findBy } from '@shell/utils/array';
import { PRODUCT_NAME } from '@runtime-enforcer/types/runtime-enforcer.ts';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { TIMESTAMP } from '@shell/config/labels-annotations';

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

    confirmText() {
      return this.isBulk
        ? this.t('runtimeEnforcer.policyProposal.deleteDialog.confirm.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.policyProposal.deleteDialog.confirm.single', { name: this.resources[0]?.nameDisplay, workload: this.resources[0]?.metadata?.ownerReferences?.[0]?.name }, true);
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async redeployWorkload(resource) {
      try {
        const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

        const workload = await this.$store.dispatch('cluster/find', {
          type: resource.ownerWorkloadSteveType,
          id:   `${ resource.metadata.namespace }/${ resource.metadata.ownerReferences?.[0]?.name }`,
        });


        const metadata = workload.spec.template.metadata ??= {};
        const annotations = metadata.annotations ??= {};

        annotations[TIMESTAMP] = now;

        await workload.save();

        this.close();
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
      }
    },

    async deletePolicies() {
      this.deleteInProgress = true;
      await Promise.all((this.resources || []).map(async (resource) => {
        await resource?.remove?.();
        await this.redeployWorkload(resource);
      }));

      this.deleteInProgress = false;

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
        {{ deleteButtonText }}
      </RcButton>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.delete-policy-proposals-dialog-card {
  box-shadow: none;
  border-radius: var(--border-radius);

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
