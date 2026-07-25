<script>
import StatusBadge from '@runtime-enforcer/components/common/StatusBadge';
export default {
  components: { StatusBadge },
  props:      {
    value: {
      type:     String,
      required: true
    },
    row: {
      type:    Object,
      default: () => ({})
    }
  },
};
</script>

<template>
  <StatusBadge :status="value.toLowerCase()" :nodesInfo="{
    totalNodes:         row.status?.totalNodes || 0,
    successfulNodes:    row.status?.successfulNodes || 0,
    transitioningNodes: row.status?.transitioningNodes || 0,
    failedNodes:        row.status?.failedNodes || 0,
  }" />
</template>
