<template>
  <span
    v-if="value"
    class="text-wrap"
  ><img
      v-if="modeIconImgSrc"
      :src="modeIconImgSrc"
      alt=""
      width="16"
      height="16"
      class="mode-icon"
    ><span class="mode-text" :class="value.toLowerCase()">{{ modetext }}</span></span>
  <span
    v-else
    class="text-muted"
  >-</span>
</template>

<script>
export default {
  name:  'ModeValue',
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
    modetext() {
      return this.t(`runtimeEnforcer.activePolicies.mode.${this.value.toLowerCase()}`);
    },
    modeIconImgSrc() {
      if (this.value === 'monitor') {
        return require('@runtime-enforcer/assets/img/monitor.svg');
      } else if (this.value === 'protect') {
        return require('@runtime-enforcer/assets/img/protect.svg');
      } else if (this.value === 'enforce') {
        return  null;
      }
    }
  }
};
</script>

<style lang="scss" scoped>
.text-wrap {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.mode-icon {
  margin-right: 8px;
}

.mode-text {
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: 14px;
  font-style: normal;
  font-weight: 500;
  line-height: 21px; /* 150% */
  &.monitor {
    color: #1F67DB;
  }
  &.protect {
    color: #007032;
  }
}
</style>
