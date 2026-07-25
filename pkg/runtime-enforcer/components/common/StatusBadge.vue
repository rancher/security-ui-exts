<template>
  <div
    class="badge"
    :class="statusClass"
  >
    <div
      ref="trigger"
      class="text-with-pop"
      @mouseenter="checkPosition"
    >
      <div
        v-if="status"
        class="text"
        :class="statusClass"
      >
        {{ t(`runtimeEnforcer.activePolicies.status.${status.toLowerCase()}`) }}
      </div>
      <div
        class="message-hover-overlay"
        :class="{ 'show-top': showOnTop }"
      >
        <div class="title">
          {{ t('runtimeEnforcer.activePolicies.status.popup.nodes', { count: nodesInfo.totalNodes }) }}
        </div>
        <div class="message-wrap" v-if="nodesInfo.failedNodes > 0">
          <div
            :class="`dot badge-failed`"
          ></div>
          <div class="message">
            {{ nodesInfo.failedNodes }} {{ t('runtimeEnforcer.activePolicies.status.popup.failed', { count: nodesInfo.failedNodes }) }}
          </div>
        </div>
        <div class="message-wrap" v-if="nodesInfo.transitioningNodes > 0">
          <div
            :class="`dot badge-transitioning`"
          ></div>
          <div class="message">
            {{ nodesInfo.transitioningNodes }} {{ t('runtimeEnforcer.activePolicies.status.popup.transitioning', { count: nodesInfo.transitioningNodes }) }}
          </div>
        </div>
        <div class="message-wrap" v-if="nodesInfo.successfulNodes > 0">
          <div
            :class="`dot badge-ready`"
          ></div>
          <div class="message">
            {{ nodesInfo.successfulNodes }} {{ t('runtimeEnforcer.activePolicies.status.popup.ready', { count: nodesInfo.successfulNodes }) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { POLICY_STATUS } from '@runtime-enforcer/types';
export default {
  name:  'StatusBadge',
  props: {
    status: {
      type:    String,
      default: ''
    },
    nodesInfo: {
      type:    Object,
      default: () => ({})
    }
  },
  computed: {
    statusClass() {
      switch (this.status) {
      case POLICY_STATUS.TRANSITIONING:
        return 'transitioning';
      case POLICY_STATUS.READY:
        return 'ready';
      case POLICY_STATUS.FAILED:
        return 'failed';
      default:
        return 'none';
      }
    }
  }
};
</script>

<style lang="scss" scoped>
  @import '../../styles/_variables.scss';

  .badge {
    /* layout */
    display: inline-block;
    padding: 1px 8px;
    align-items: center;
    /* style */
    border-radius: 30px;

    &.transitioning {
      background: $transitioning-bg-color;
      color: $transitioning-color;
      body.theme-dark & {
        color: $transitioning-color;
      }
    }

    &.ready {
      background: $ready-bg-color;
      color: $ready-color;
      body.theme-dark & {
        color:$ready-color;
      }
    }

    &.failed{
      background: $failed-bg-color;
      color: white;
    }

    .text {
      display: -webkit-box;
      -webkit-box-orient: vertical;
      line-clamp: 1;
      overflow: hidden;
      white-space: nowrap;
      font-family: Lato;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      line-height: 19px;
      &.none {
        color: var(--muted);
      }
    }
  }
  .message-hover-overlay {
    position: absolute;
    top: calc(100% + 10px);
    left: -10px;
    background: var(--popover-bg);
    border: 1px solid var(--popover-border);
    padding: 16px;
    z-index: 100;
    width: 360px;
    word-wrap: break-word;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    .title {
      font-weight: 600;
      font-size: 16px;
      color: var(--body-text);
      margin-bottom: 12px;
    }
    .message {
      color: var(--body-text);
      font-size: 14px;

      white-space: pre-wrap;
      word-break: break-word;
    }
  }
  .message-hover-overlay.show-top {
    top: auto;
    bottom: calc(100% + 10px);
    margin-bottom: 8px;
  }
  .text-with-pop {
    cursor: pointer;
    position: relative;
    display: inline-block;
    &:hover .message-hover-overlay {
      display: block;
    }
    /* Define CSS variables on the root element of this component */
    --status-bg-transitioning: #{$transitioning-color};
    --status-bg-ready: #{$ready-color};
    --status-bg-failed: #{$failed-bg-color};
    --status-bg-none: #FFFFFF;

    .message-hover-overlay {
      display: none;
    }
  }
  .message-wrap {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin: 2px 0;
    .dot {
      width: 8px;
      height: 8px;
      margin-top: 4px;
      min-width: 8px;
      border-radius: 50%;
      border-width: 1px;
      border-style: solid;
      &.badge-transitioning {
        background-color: var(--status-bg-transitioning);
        border-color: var(--status-bg-transitioning);
      }
      &.badge-ready {
        background-color: var(--status-bg-ready);
        border-color: var(--status-bg-ready);
      }
      &.badge-failed {
        background-color: var(--status-bg-failed);
        border-color: var(--status-bg-failed);
      }
      &.none {
        background-color: var(--status-bg-none);
        border-color: #DCDEE4;
      }
    }
    .message {
      color: var(--body-text);
      font-size: 14px;
      word-break: break-word;
    }
  }
</style>
