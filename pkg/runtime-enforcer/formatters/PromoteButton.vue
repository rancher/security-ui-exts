<template>
  <RcButton
    variant="secondary"
    size="medium"
    @click="promoteFn()"
  >
    <i class="icon icon-upgrade-alt"></i>
    {{ t('runtimeEnforcer.policyProposals.actions.promote') }}
  </RcButton>
</template>

<script>
import RcButton from '@components/RcButton/RcButton.vue';
export default {
  name:  'PromoteButton',
  components: { RcButton },
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:    Object,
      default: () => ({})
    },
    promoteFn: {
      type:    Function,
      required: true
    }
  }
};
</script>

<style lang="scss" scoped>
</style>
