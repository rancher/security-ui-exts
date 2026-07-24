<template>
  <RouterLink
    v-if="namespaceValue"
    class="text-wrap"
    :to="namespaceDetailLink"
  >
    {{ namespaceValue }}
  </RouterLink>
  <span
    v-else
    class="text-muted"
  >-</span>
</template>

<script>
export default {
  name:  'NamespaceRouteLink',
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
    namespaceValue() {
      return this.value || this.row?.metadata?.namespace || '';
    },
    namespaceDetailLink() {
      const cluster = this.$route.params.cluster;

      return `/c/${ cluster }/explorer/namespace/${ this.namespaceValue }`;
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
