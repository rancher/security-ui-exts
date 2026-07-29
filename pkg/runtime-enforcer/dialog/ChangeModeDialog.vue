<script>
import jsyaml from 'js-yaml';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import RcButton from '@components/RcButton/RcButton.vue';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import { downloadFile } from '@shell/utils/download';
import { POLICY_MODE } from '../types/runtime-enforcer';

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
  },

  data() {
    return { targetMode: POLICY_MODE.MONITOR };
  },

  computed: {
    isBulk() {
      return this.resources.length > 1;
    },

    allSameMode() {
      return this.resources.every((r) => r.spec.mode === this.resources[0]?.spec.mode);
    },
    showModeSelect() {
      return this.isBulk && !this.allSameMode;
    },

    transitionDirection() {
      if (this.resources[0].spec.mode === POLICY_MODE.MONITOR) {
        return {
          from: POLICY_MODE.MONITOR,
          to:   POLICY_MODE.PROTECT,
        };
      } else if (this.resources[0].spec.mode === POLICY_MODE.PROTECT) {
        return {
          from: POLICY_MODE.PROTECT,
          to:   POLICY_MODE.MONITOR,
        };
      }
    },

    modeOptions() {
      return [
        { value: POLICY_MODE.MONITOR, label: this.t('runtimeEnforcer.policyProposal.exportDialog.mode.monitor') },
        { value: POLICY_MODE.PROTECT, label: this.t('runtimeEnforcer.policyProposal.exportDialog.mode.protect') },
      ];
    },

    title() {
      return this.t(`runtimeEnforcer.activePolicies.changeModeDialog.title.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    bannerText() {
      return this.t(`runtimeEnforcer.activePolicies.changeModeDialog.banner.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    confirmText() {
      return this.isBulk
        ? (this.allSameMode ?
          this.t('runtimeEnforcer.activePolicies.changeModeDialog.confirm.bulkSame', { count: this.resources.length }, true)
          : this.t('runtimeEnforcer.activePolicies.changeModeDialog.confirm.bulk', { count: this.resources.length }, true))
        : this.t('runtimeEnforcer.activePolicies.changeModeDialog.confirm.single', { name: this.resources[0]?.nameDisplay }, true);
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    modeIconImgSrc(mode) {
      if (mode === 'monitor') {
        return require('@runtime-enforcer/assets/img/monitor.svg');
      } else if (mode === 'protect') {
        return require('@runtime-enforcer/assets/img/protect.svg');
      } else if (mode === 'enforce') {
        return  null;
      }
    },

    arrowImgSrc() {
      return require('@runtime-enforcer/assets/img/arrow-right.svg');
    },

    modetext(mode) {
      return this.t(`runtimeEnforcer.activePolicies.mode.${mode.toLowerCase()}`);
    },

    changeMode() {
      const targetMode = this.isBulk ? this.targetMode : this.transitionDirection.to;

      this.resources.forEach((resource) => {
        resource.spec.mode = targetMode;
        resource.save();
      });
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
        class="export-banner"
        color="info"
      >
        {{ bannerText }}
      </Banner>
      <p
        v-clean-html="confirmText"
      />
      <LabeledSelect
        v-if="showModeSelect"
        class="export-mode-select"
        v-model:value="targetMode"
        :options="modeOptions"
      />
      <div v-else class="mode-change-direction">
        <span
          class="text-wrap"
        ><img
            :src="modeIconImgSrc(transitionDirection.from)"
            alt=""
            width="16"
            height="16"
            class="mode-icon"
          ><span class="mode-text" :class="transitionDirection.from.toLowerCase()">{{ modetext(transitionDirection.from) }}</span></span>
        <img
          :src="arrowImgSrc()"
          alt=""
          width="16"
          height="16"
          class="mode-icon"
        >
        <span
          class="text-wrap"
        ><img
            :src="modeIconImgSrc(transitionDirection.to)"
            alt=""
            width="16"
            height="16"
            class="mode-icon"
          ><span class="mode-text" :class="transitionDirection.to.toLowerCase()">{{ modetext(transitionDirection.to) }}</span></span>
      </div>
    </template>
    <template #actions>
      <RcButton
        variant="link"
        size="large"
        @click="close"
      >
        {{ t('runtimeEnforcer.activePolicies.changeModeDialog.cancel') }}
      </RcButton>
      <RcButton
        variant="primary"
        size="large"
        left-icon="refresh"
        class="ml-10"
        @click="changeMode"
      >
        {{ t('runtimeEnforcer.activePolicies.changeModeDialog.changeMode') }}
      </RcButton>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.export-policy-dialog-card {
  box-shadow: none;
  border-radius: var(--border-radius);

  :deep(.card-actions) {
    justify-content: end;
  }

  .export-banner {
    margin: 16px 0 24px;
  }

  .mode-change-direction {
    margin-top: 8px;
    margin-bottom: 20px;
  }

  .export-mode-select {
    margin-top: 16px;
    margin-bottom: 20px;
  }
  .text-wrap {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    white-space: nowrap;
  }

  .mode-icon {
    margin-right: 8px;
  }

  .mode-text {
    overflow: hidden;
    text-overflow: ellipsis;
    font-family: Lato;
    font-size: 14px;
    font-style: normal;
    font-weight: 500;
    line-height: 21px; /* 150% */
    &.monitor {
      color: #1F67DB;
    }
    &.protect {
      color: #007032;
    }
  }
}
</style>
