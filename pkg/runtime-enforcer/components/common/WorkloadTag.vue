<template>
  <div class="workload-row">
    <RcTag
      class="tag-row"
      :highlight="false"
    >
      <div class="tag-data">{{ label }}</div>
    </RcTag>
    <CopyToClipboard
      class="cp-board"
      :value="label"
    />
  </div>
</template>

<script>
import RcTag from '@components/Pill/RcTag/RcTag.vue';
import CopyToClipboard from '@shell/components/Resource/Detail/CopyToClipboard.vue';

export default {
  name: 'WorkloadTag',

  components: { RcTag, CopyToClipboard },

  props: {
    label: {
      type:     String,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.workload-row {
  position: relative;
  display: inline-flex;
  align-items: center;
  margin: 6px 0;
}

.tag-row {
  display: inline-flex;
  align-items: center;
  background-color: var(--rc-active-disabled-background);
  border: 1px solid var(--rc-active-disabled-background);
  border-radius: 4px;
}

.tag-data {
  display: inline-flex;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: calc(100%);
  line-height: 21px;
  font-size: 13px;
  font-weight: 400;
  align-items: center;
}

.cp-board {
  position: fixed;
  top: -100vh;
  right: -8px;
}

.workload-row:hover .cp-board,
.workload-row:focus-within .cp-board,
.cp-board:hover,
.cp-board:focus-visible {
  position: absolute;
  top: -6px;
}

.workload-row:hover .tag-data,
.workload-row:focus-within .tag-data {
  padding-right: 22px;
}
</style>
