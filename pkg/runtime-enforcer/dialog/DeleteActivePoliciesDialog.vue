<script>
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import RcButton from '@components/RcButton/RcButton.vue';
import { PRODUCT_NAME } from '@runtime-enforcer/types/runtime-enforcer.ts';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { TIMESTAMP } from '@shell/config/labels-annotations';
import RadioGroup from '@components/Form/Radio/RadioGroup.vue';
import { _EDIT } from '@shell/config/query-params';
import { DOCUMENTATION_URL, WORKLOAD_PREFIX } from '@runtime-enforcer/types';
import RcTag from '@components/Pill/RcTag/RcTag.vue';
import CopyToClipboard from '@shell/components/Resource/Detail/CopyToClipboard.vue';

export default {
  emits: ['close'],

  components: {
    Card,
    Banner,
    RcButton,
    RadioGroup,
    RcTag,
    CopyToClipboard,
  },

  props: {
    resources: {
      type:    Array,
      default: () => [],
    },
  },

  data() {
    return {
      deleteInProgress:      false,
      workloadRemovalOption: 'keep',
      _EDIT:                 _EDIT,
      DOCUMENTATION_URL,
      WORKLOAD_PREFIX,
    };
  },

  computed: {
    isBulk() {
      return this.resources.length > 1;
    },

    title() {
      return this.t(`runtimeEnforcer.activePolicies.deleteDialog.title.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    bannerText() {
      return this.t(`runtimeEnforcer.activePolicies.deleteDialog.banner.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    confirmText() {
      return this.isBulk
        ? this.t('runtimeEnforcer.activePolicies.deleteDialog.confirm.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.activePolicies.deleteDialog.confirm.single', { name: this.resources[0]?.nameDisplay }, true);
    },
    manualRemovalText() {
      return this.t(`runtimeEnforcer.activePolicies.deleteDialog.manualRemoval.${ this.isBulk ? 'bulk' : 'single' }`);
    },
    workloadRemovalOptions() {
      return [
        {
          label: this.t(`runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.keep.${ this.isBulk ? 'bulk' : 'single' }`),
          value: 'keep',
        },
        {
          label: this.t(`runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.remove.${ this.isBulk ? 'bulk' : 'single' }`),
          value: 'auto',
        },
        {
          label: this.t(`runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.manual.${ this.isBulk ? 'bulk' : 'single' }`),
          value: 'manual',
        },
      ];
    },
    deleteButtonText() {
      return this.workloadRemovalOption === 'auto'
        ? (
          this.isBulk
            ? this.t('runtimeEnforcer.activePolicies.deleteDialog.deleteWithWorkloadRemoval.bulk')
            : this.t('runtimeEnforcer.activePolicies.deleteDialog.deleteWithWorkloadRemoval.single')
        )
        : this.t('runtimeEnforcer.activePolicies.deleteDialog.delete');
    },
    growlMessage() {
      switch (this.workloadRemovalOption) {
      case 'keep':
        return this.isBulk
          ? this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk')
          : this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single', { name: this.resources[0]?.nameDisplay });
      case 'auto':
        return this.isBulk
          ? `${this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk')} ${this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.autoRemoval.bulk')}`
          : `${this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single', { name: this.resources[0]?.nameDisplay })} ${this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.autoRemoval.single')}`;
      case 'manual':
        return this.isBulk
          ? `${this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk')} ${this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.manualRemoval.bulk')}`
          : `${this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single', { name: this.resources[0]?.nameDisplay })} ${this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.manualRemoval.single')}`;
      }
    },
    growlTitle() {
      return this.isBulk
        ? this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.title.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.title.single', { name: this.resources[0]?.nameDisplay }, true);
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

      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
      }
    },

    async deletePolicies() {
      this.deleteInProgress = true;
      await Promise.all((this.resources || []).map(async (resource) => {
        await resource?.remove?.();
        if (this.workloadRemovalOption === 'auto') {
          await this.redeployWorkload(resource);
        }
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
      <RadioGroup
          class="mb-16"
          v-model:value="workloadRemovalOption"
          :mode="_EDIT"
          :options="workloadRemovalOptions"
          name="workloadRemovalOptions"
          data-testid="workload-removal-radio"
        />
      <span
        class="confirm-text"
      >
        {{ t(`runtimeEnforcer.activePolicies.deleteDialog.manualRemoval.${ this.isBulk ? 'bulk' : 'single' }`) }}
        <a
          :href="DOCUMENTATION_URL"
          target="_blank"
          rel="noopener noreferrer"
          class="doc-link"
        >
          {{ t('runtimeEnforcer.activePolicies.deleteDialog.learnMore') }}
        </a>
      </span>
      <div class="tag-group">
        <div
          v-for="resource in resources"
          :key="resource.metadata.uid"
          class="mt-2"
        >
          <RcTag
            :type="type"
            class="tag-row"
            :highlight="false"
          >
            <div class="tag-data">{{WORKLOAD_PREFIX}} {{ resource.metadata.name }}</div>
          </RcTag>
          <CopyToClipboard class="cp-board" :value="`${ WORKLOAD_PREFIX } ${ resource.metadata.name }`" />
        </div>
      </div>
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
  .mb-16 {
    margin-bottom: 16px;
  }

  .tag-row {
    display: inline-flex;
    align-items: center;
  }

  .cp-board {
    margin-left: -4px;
    right: 0;
    top: 0;
  }
  .tag-group {
    max-height: calc(100vh - 780px);
    overflow-y: auto;
  }
  .tag-row {
    background-color: var(--rc-active-disabled-background);
    border: 1px solid var(--rc-active-disabled-background);
    border-radius: 4px;
    margin: 6px 0;
  }
  .tag-data {
    display: inline-flex;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: calc(100%);
    line-height: 21px;
    font-family: Lato;
    font-size: 13px;
    font-weight: 400;
    align-items: center;
  }
}
</style>
