<template>
  <span v-if="row.executables?.length">
    <span
      v-for="executable in row.executables"
      :key="executable"
      class="executable-pill"
    >
      {{ executable }}
    </span>
  </span>
  <span
    v-else
    class="text-muted"
  >-</span>
</template>

<script>
export default {
  name:  'ExecutableLabels',
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
.executable-pill {
  display: inline-block;
  padding: 2px 8px;
  margin: 2px 4px 2px 0;
  border-radius: 4px;
  background: var(--tag-bg);
  color: var(--tag-primary);
  font-size: 13px;
}
</style>
