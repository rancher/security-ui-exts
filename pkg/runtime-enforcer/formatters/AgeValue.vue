<template>
  <LiveDate
    v-if="value"
    :value="value"
    class="text-wrap"
  />
  <span
    v-else
    class="text-muted"
  >-</span>
</template>

<script>
export default {
  name:  'AgeValue',
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
};
</script>

<style lang="scss" scoped>
.text-wrap {
  overflow-wrap: anywhere;
  word-break: break-word;
}
</style>
