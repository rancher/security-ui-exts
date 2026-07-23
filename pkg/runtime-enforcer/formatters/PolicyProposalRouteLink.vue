<template>
  <RouterLink
    v-if="policyProposalValue"
    class="text-wrap"
    :to="policyProposalDetailLink"
  >
    {{ policyProposalValue }}
  </RouterLink>
  <span
    v-else
    class="text-muted"
  >-</span>
</template>

<script>
import { RESOURCE, PRODUCT_NAME } from '@runtime-enforcer/types';
export default {
  name:  'PolicyProposalRouteLink',
  props: {
    value: {
      type:    String,
      default: ''
    },
    row: {
      type:    Object,
      default: () => ({})
    }
  },
  computed: {
    policyProposalValue() {
      return this.value || this.row?.metadata?.name || '';
    },
    policyProposalDetailLink() {
      const cluster = this.$route.params.cluster;

      return `/c/${ cluster }/${ PRODUCT_NAME }/${ RESOURCE.POLICY_PROPOSALS }/${ this.row?.metadata?.namespace || '' }%2F${ this.policyProposalValue }`;
    }
  },
};
</script>

<style lang="scss" scoped>
.text-wrap {
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
