<script>
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import RcButton from '@components/RcButton/RcButton.vue';
import { allowExecutables } from '../utils/allow';

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
    targets: {
      type:    Array,
      default: () => [],
    },
  },

  data() {
    return { allowInProgress: false };
  },

  computed: {
    policy() {
      return this.resources[0];
    },

    isBulk() {
      return this.targets.length > 1;
    },

    title() {
      return this.t(`runtimeEnforcer.activePolicy.allowDialog.title.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    bannerText() {
      return this.t(`runtimeEnforcer.activePolicy.allowDialog.banner.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    confirmText() {
      return this.isBulk
        ? this.t('runtimeEnforcer.activePolicy.allowDialog.confirm.bulk', { count: this.targets.length }, true)
        : this.t('runtimeEnforcer.activePolicy.allowDialog.confirm.single', { path: this.targets[0]?.executablePath }, true);
    },

    growlTitle() {
      return this.isBulk
        ? this.t('runtimeEnforcer.activePolicy.allowDialog.growl.title.bulk')
        : this.t('runtimeEnforcer.activePolicy.allowDialog.growl.title.single');
    },

    growlMessage() {
      return this.isBulk
        ? this.t('runtimeEnforcer.activePolicy.allowDialog.growl.message.bulk', { count: this.targets.length }, true)
        : this.t('runtimeEnforcer.activePolicy.allowDialog.growl.message.single', { path: this.targets[0]?.executablePath }, true);
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async finish() {
      this.allowInProgress = true;

      try {
        await allowExecutables(this.policy, this.targets);
      } catch (err) {
        this.allowInProgress = false;
        this.$store.dispatch('growl/fromError', { title: this.t('runtimeEnforcer.activePolicy.allowDialog.errorTitle'), err });

        return;
      }

      this.$store.dispatch('growl/success', { title: this.growlTitle, message: this.growlMessage });
      this.allowInProgress = false;
      this.close();
    },
  },
};
</script>

<template>
  <Card
    class="allow-executable-dialog-card"
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
        {{ t('runtimeEnforcer.activePolicy.allowDialog.cancel') }}
      </RcButton>
      <RcButton
        variant="primary"
        size="large"
        class="ml-10"
        :disabled="allowInProgress"
        @click="finish"
      >
        <i class="icon icon-plus"></i>
        {{ t('runtimeEnforcer.activePolicy.allowDialog.allow') }}
      </RcButton>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.allow-executable-dialog-card {
  box-shadow: none;

  :deep(.card-actions) {
    justify-content: end;
  }

  .banner {
    margin: 16px 0 24px;
  }

  .confirm-text {
    margin: 0;
  }
}
</style>
