<template>
  <RouterLink
    v-if="workloadValue"
    class="text-wrap"
    :to="workloadDetailLink"
  >
    {{ workloadValue }}
  </RouterLink>
  <span
    v-else
    class="text-muted"
  >-</span>
</template>

<script>
import { RESOURCE, PRODUCT_NAME } from '@runtime-enforcer/types';
export default {
  name:  'WorkloadRouteLink',
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
    workloadValue() {
      return this.value || this.row?.metadata?.ownerReferences?.[0]?.name || '';
    },
    workloadDetailLink() {
      const cluster = this.$route.params.cluster;

      return `/c/${ cluster }/${ PRODUCT_NAME }/${ this.row?.ownerWorkloadSteveType || '' }/${ this.row?.metadata?.namespace || '' }/${ this.workloadValue }`;
    }
  }
};
</script>

<style lang="scss" scoped>
.text-wrap {
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
