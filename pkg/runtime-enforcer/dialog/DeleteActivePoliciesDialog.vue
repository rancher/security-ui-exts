<script>
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import RcButton from '@components/RcButton/RcButton.vue';
import { PRODUCT_NAME } from '@runtime-enforcer/types/runtime-enforcer.ts';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { TIMESTAMP } from '@shell/config/labels-annotations';
import RadioButton from '@components/Form/Radio/RadioButton.vue';
import { _EDIT } from '@shell/config/query-params';
import { DOCUMENTATION_URL, WORKLOAD_PREFIX, POLICY_LABEL_KEY } from '@runtime-enforcer/types';
import RcTag from '@components/Pill/RcTag/RcTag.vue';
import CopyToClipboard from '@shell/components/Resource/Detail/CopyToClipboard.vue';
import RichTranslation from '@shell/components/RichTranslation.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';

export default {
  emits: ['close'],

  components: {
    Card,
    Banner,
    RcButton,
    RadioButton,
    RcTag,
    CopyToClipboard,
    RichTranslation,
    SubtleLink,
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
    manualDescriptionKey() {
      return `runtimeEnforcer.activePolicies.deleteDialog.manualRemoval.${ this.isBulk ? 'bulk' : 'single' }`;
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
          label: this.t(`runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.manual.${ this.isBulk ? 'bulk' : 'single' }`, {}, true),
          value: 'manual',
        },
      ];
    },
    deleteButtonText() {
      return this.workloadRemovalOption === 'auto'
        ? (
          this.isBulk
            ? `${this.t('runtimeEnforcer.activePolicies.deleteDialog.deletePolicy.bulk')} & ${this.t('runtimeEnforcer.activePolicies.deleteDialog.restartWorkload.bulk')}`
            : `${this.t('runtimeEnforcer.activePolicies.deleteDialog.deletePolicy.single')} & ${this.t('runtimeEnforcer.activePolicies.deleteDialog.restartWorkload.single')}`
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
        ? this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.title.bulk')
        : this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.title.single');
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async unlabelAndRedeployWorkload(resource) {
      try {
        const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

        //Todo: Keep this block as place holder until the workload type and workload name are got in active policy data
        // const workload = await this.$store.dispatch('cluster/find', {
        //   type: WORKLOAD_KIND_TO_TYPE_MAPPING[resource.metadata?.ownerReferences?.[0]?.kind],
        //   id:   `${ resource.metadata.namespace }/${ resource.metadata.ownerReferences?.[0]?.name }`,
        // });

        // if (!workload) {
        //   return;
        // }
        // const podTemplate = workload.spec?.jobTemplate?.spec?.template ?? workload.spec?.template;

        // if (!podTemplate) {
        //   return;
        // }

        // const templateMetadata = podTemplate.metadata ??= {};
        // const labels = templateMetadata.labels ??= {};

        // delete labels[POLICY_LABEL_KEY];

        // const metadata = workload.spec.template.metadata ??= {};
        // const annotations = metadata.annotations ??= {};

        // annotations[TIMESTAMP] = now;

        // await workload.save();

        //Todo-end

      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
      }
    },

    async deletePolicies() {
      this.deleteInProgress = true;
      await Promise.all((this.resources || []).map(async (resource) => {
        const resourceBackup = { ...resource };

        await resource?.remove?.();
        if (this.workloadRemovalOption === 'auto') {
          await this.unlabelAndRedeployWorkload(resourceBackup);
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
      <div
        class="workload-removal-option-group"
        role="radiogroup"
        data-testid="workload-removal-radio"
      >
        <div>
          <RadioButton
            name="workloadRemovalOptions"
            :value="workloadRemovalOption"
            val="keep"
            :label="workloadRemovalOptions[0].label"
            :mode="_EDIT"
            :use-body-text-color="true"
            @update:value="workloadRemovalOption = $event"
          >
            <template #label>
              {{ workloadRemovalOptions[0].label }}
              <i
                v-clean-tooltip="t('runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.keep.tooltip')"
                class="icon icon-info icon-lg option-tooltip-icon"
              />
            </template>
          </RadioButton>
        </div>

        <div>
          <RadioButton
            name="workloadRemovalOptions"
            :value="workloadRemovalOption"
            val="auto"
            :label="workloadRemovalOptions[1].label"
            :mode="_EDIT"
            :use-body-text-color="true"
            @update:value="workloadRemovalOption = $event"
          >
            <template #label>
              {{ workloadRemovalOptions[1].label }}
              <i
                v-clean-tooltip="t('runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.remove.tooltip')"
                class="icon icon-info icon-lg option-tooltip-icon"
              />
            </template>
          </RadioButton>
        </div>

        <div>
          <RadioButton
            name="workloadRemovalOptions"
            :value="workloadRemovalOption"
            val="manual"
            :label="workloadRemovalOptions[2].label"
            :mode="_EDIT"
            :use-body-text-color="true"
            @update:value="workloadRemovalOption = $event"
          >
            <template #label>
              <span v-clean-html="workloadRemovalOptions[2].label" />
              <i
                v-clean-tooltip="t('runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.manual.tooltip')"
                class="icon icon-info icon-lg option-tooltip-icon"
              />
            </template>

            <template #description>
              <template v-if="workloadRemovalOption === 'manual'">
                <p class="confirm-text-manual">
                  <RichTranslation :k="manualDescriptionKey">
                    <template #learnMore="{ content }">
                      <SubtleLink
                        :href="DOCUMENTATION_URL"
                        target="_blank"
                      >
                        {{ content }}
                      </SubtleLink>
                    </template>
                  </RichTranslation>
                </p>
                <div
                  v-for="resource in resources"
                  :key="resource.metadata.uid"
                  class="mt-2"
                >
                  <RcTag
                    class="tag-row"
                    :highlight="false"
                  >
                    <div class="tag-data">{{ WORKLOAD_PREFIX }} {{ resource.metadata.name }}</div>
                  </RcTag>
                  <CopyToClipboard class="cp-board" :value="`${ WORKLOAD_PREFIX } ${ resource.metadata.name }`" />
                </div>
              </template>
            </template>
          </RadioButton>
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

  :deep(.card-actions) {
    justify-content: end;
  }

  .banner {
    margin: 16px 0 24px;
  }

  .confirm-text-manual {
    margin: 0 0 16px;
    cursor: default;
  }

  .confirm-text {
    margin: 0 0 24px;
  }

  .bg-danger {
    background-color: var(--error) !important;
  }
  .bg-danger:disabled {
    background-color: var(--rc-active-disabled-background) !important;
  }

  .workload-removal-option-group {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 16px;

    :deep(.radio-button-outer-container-description) {
      color: var(--body-text);
      font-size: 14px;
      margin-top: 16px;
    }

    .option-tooltip-icon {
      margin-left: 8px;
    }
  }

  .cp-board {
    margin-left: -8px;
    right: 0;
    top: 0;
  }
  .tag-row {
    display: inline-flex;
    align-items: center;
    background-color: var(--rc-active-disabled-background);
    border: 1px solid var(--rc-active-disabled-background);
    border-radius: 4px;
    margin: 6px 0;
    cursor: default;
  }
  .tag-data {
    display: inline-flex;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    max-width: calc(100%);
    line-height: 21px;
    font-size: 13px;
    font-weight: 400;
    align-items: center;
  }
}
</style>
