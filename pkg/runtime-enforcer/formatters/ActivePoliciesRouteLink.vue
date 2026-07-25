<template>
  <RouterLink
    v-if="activePoliciesValue"
    class="text-wrap"
    :to="activePoliciesDetailLink"
  >
    {{ activePoliciesValue }}
  </RouterLink>
  <span
    v-else
    class="text-muted"
  >-</span>
</template>

<script>
import { RESOURCE, PRODUCT_NAME } from '@runtime-enforcer/types';
export default {
  name:  'ActivePoliciesRouteLink',
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
    activePoliciesValue() {
      return this.value || this.row?.metadata?.name || '';
    },
    activePoliciesDetailLink() {
      const cluster = this.$route.params.cluster;

      return `/c/${ cluster }/${ PRODUCT_NAME }/${ RESOURCE.ACTIVE_POLICIES }/${ this.row?.metadata?.namespace || '' }%2F${ this.activePoliciesValue }`;
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
