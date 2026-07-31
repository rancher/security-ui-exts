<script>
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import RcButton from '@components/RcButton/RcButton.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import RadioButton from '@components/Form/Radio/RadioButton.vue';
import RcTag from '@components/Pill/RcTag/RcTag.vue';
import CopyToClipboard from '@shell/components/Resource/Detail/CopyToClipboard.vue';
import RichTranslation from '@shell/components/RichTranslation.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import { _EDIT } from '@shell/config/query-params';
import {
  PRODUCT_NAME, POLICY_MODE, APPLY_MODE, WORKLOAD_PREFIX, DOCUMENTATION_URL
} from '../types/runtime-enforcer';
import { applyPromoteLabel, snapshotProposal, runPromoteFollowUps } from '../utils/promote';

export default {
  emits: ['close'],

  components: {
    Card,
    Banner,
    RcButton,
    LabeledSelect,
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
      step:              1,
      targetMode:        POLICY_MODE.MONITOR,
      applyOption:       APPLY_MODE.AUTOMATIC,
      promoteInProgress: false,
      _EDIT,
      APPLY_MODE,
      WORKLOAD_PREFIX,
      DOCUMENTATION_URL,
    };
  },

  computed: {
    isBulk() {
      return this.resources.length > 1;
    },

    title() {
      const key = this.step === 1 ? 'title' : 'applyStep.title';

      return this.t(`runtimeEnforcer.policyProposal.promoteDialog.${ key }.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    bannerText() {
      const key = this.step === 1 ? 'banner' : 'applyStep.banner';

      return this.t(`runtimeEnforcer.policyProposal.promoteDialog.${ key }.${ this.isBulk ? 'bulk' : 'single' }`, { name: this.resources[0]?.workload }, true);
    },

    confirmText() {
      return this.isBulk
        ? this.t('runtimeEnforcer.policyProposal.promoteDialog.confirm.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.policyProposal.promoteDialog.confirm.single', { name: this.resources[0]?.nameDisplay, workload: this.resources[0]?.workload }, true);
    },

    modeOptions() {
      return [
        { value: POLICY_MODE.MONITOR, label: this.t('runtimeEnforcer.policyProposal.promoteDialog.mode.monitor') },
        { value: POLICY_MODE.PROTECT, label: this.t('runtimeEnforcer.policyProposal.promoteDialog.mode.protect') },
      ];
    },

    automaticOptionLabel() {
      return this.t(`runtimeEnforcer.policyProposal.promoteDialog.applyStep.options.automatic.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    manualOptionLabel() {
      return this.t(`runtimeEnforcer.policyProposal.promoteDialog.applyStep.options.manual.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    manualDescriptionKey() {
      return `runtimeEnforcer.policyProposal.promoteDialog.applyStep.manualDescription.${ this.isBulk ? 'bulk' : 'single' }`;
    },

    growlTitle() {
      return this.isBulk
        ? this.t('runtimeEnforcer.policyProposal.promoteDialog.growl.title.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.policyProposal.promoteDialog.growl.title.single', { name: this.resources[0]?.nameDisplay }, true);
    },

    growlMessage() {
      const base = this.isBulk
        ? this.t('runtimeEnforcer.policyProposal.promoteDialog.growl.base.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.policyProposal.promoteDialog.growl.base.single', {}, true);

      const suffixKey = this.applyOption === APPLY_MODE.AUTOMATIC ? 'automatic' : 'manual';
      const suffix = this.t(`runtimeEnforcer.policyProposal.promoteDialog.growl.${ suffixKey }.${ this.isBulk ? 'bulk' : 'single' }`, {}, true);

      return `${ base } ${ suffix }`;
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    continueToApplyStep() {
      this.step = 2;
    },

    async finish() {
      this.promoteInProgress = true;

      try {
        await Promise.all(this.resources.map((resource) => applyPromoteLabel(resource)));
      } catch (err) {
        this.promoteInProgress = false;
        this.$store.dispatch('growl/fromError', { title: this.t('runtimeEnforcer.policyProposal.promoteDialog.errorTitle'), err });

        return;
      }

      const autoApply = this.applyOption === APPLY_MODE.AUTOMATIC;

      this.resources.forEach((resource) => {
        runPromoteFollowUps(this.$store, snapshotProposal(resource), {
          targetMode: this.targetMode,
          autoApply,
        });
      });

      this.$store.dispatch('growl/success', { title: this.growlTitle, message: this.growlMessage });

      if (!this.isBulk) {
        this.$router.push({
          name:   `c-cluster-${ PRODUCT_NAME }-resource`,
          params: { cluster: this.$route.params.cluster, product: PRODUCT_NAME },
        });
      }

      this.promoteInProgress = false;
      this.close();
    },
  },
};
</script>

<template>
  <Card
    class="promote-policy-dialog-card"
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
        :color="step === 1 ? 'info' : 'warning'"
      >
        <span v-clean-html="bannerText" />
      </Banner>

      <template v-if="step === 1">
        <p
          class="confirm-text"
          v-clean-html="confirmText"
        />
        <LabeledSelect
          class="mode-select"
          v-model:value="targetMode"
          :options="modeOptions"
        />
      </template>

      <template v-else>
        <div
          class="apply-option-group"
          role="radiogroup"
          data-testid="apply-option-radio"
        >
          <div>
            <RadioButton
              name="applyOptions"
              :value="applyOption"
              :val="APPLY_MODE.AUTOMATIC"
              :label="automaticOptionLabel"
              :mode="_EDIT"
              :use-body-text-color="true"
              @update:value="applyOption = $event"
            >
              <template #label>
                {{ automaticOptionLabel }}
                <i
                  v-clean-tooltip="t('runtimeEnforcer.policyProposal.promoteDialog.applyStep.options.automatic.tooltip')"
                  class="icon icon-info icon-lg option-tooltip-icon"
                />
              </template>
            </RadioButton>
          </div>

          <div>
            <RadioButton
              name="applyOptions"
              :value="applyOption"
              :val="APPLY_MODE.MANUAL"
              :label="manualOptionLabel"
              :mode="_EDIT"
              :use-body-text-color="true"
              @update:value="applyOption = $event"
            >
              <template #label>
                {{ manualOptionLabel }}
                <i
                  v-clean-tooltip="t('runtimeEnforcer.policyProposal.promoteDialog.applyStep.options.manual.tooltip')"
                  class="icon icon-info icon-lg option-tooltip-icon"
                />
              </template>

              <template #description>
                <template v-if="applyOption === APPLY_MODE.MANUAL">
                  <p class="confirm-text">
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
    </template>
    <template #actions>
      <RcButton
        v-if="step === 1"
        variant="link"
        size="large"
        @click="close"
      >
        {{ t('runtimeEnforcer.policyProposal.promoteDialog.cancel') }}
      </RcButton>
      <RcButton
        v-if="step === 1"
        variant="primary"
        size="large"
        class="ml-10"
        @click="continueToApplyStep"
      >
        <i class="icon icon-upgrade-alt"></i>
        {{ t('runtimeEnforcer.policyProposal.promoteDialog.promoteAndContinue') }}
      </RcButton>
      <RcButton
        v-else
        variant="primary"
        size="large"
        class="ml-10"
        :disabled="promoteInProgress"
        @click="finish"
      >
        {{ t('runtimeEnforcer.policyProposal.promoteDialog.finish') }}
      </RcButton>
    </template>
  </Card>
</template>


<style lang="scss" scoped>
.promote-policy-dialog-card {
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

  .mode-select {
    margin-top: 16px;
    margin-bottom: 20px;
  }

  .apply-option-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
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

  .tag-row {
    display: inline-flex;
    align-items: center;
    background-color: var(--rc-active-disabled-background);
    border: 1px solid var(--rc-active-disabled-background);
    border-radius: 4px;
    margin: 6px 0;
  }

  .cp-board {
    margin-left: -4px;
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
