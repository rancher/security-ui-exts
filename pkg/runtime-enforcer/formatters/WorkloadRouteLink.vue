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
import { PRODUCT_NAME } from '@runtime-enforcer/types';
import { WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';
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

      return `/c/${ cluster }/${ PRODUCT_NAME }/${ this.row?.ownerWorkloadSteveType || WORKLOAD_KIND_TO_TYPE_MAPPING[this.row?.workloadRef.workloadType || ''] || '' }/${ this.row?.metadata?.namespace || '' }/${ this.workloadValue }`;
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
