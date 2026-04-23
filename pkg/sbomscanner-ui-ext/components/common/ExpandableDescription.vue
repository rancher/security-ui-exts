<script>
export default {
  name: 'ExpandableDescription',
  props: {
    text: {
      type: String,
      required: true,
      default: ''
    },
    lines: {
      type: Number,
      default: 3
    }
  },
  data() {
    return {
      isExpanded: false,
      isTruncatable: false,
    };
  },
  watch: {
    text() {
      this.checkTruncation();
    }
  },
  mounted() {
    this.checkTruncation();
    window.addEventListener('resize', this.checkTruncation);
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.checkTruncation);
  },
  methods: {
    checkTruncation() {
      this.$nextTick(() => {
        const el = this.$refs.content;
        if (!el) return;

        // If the total scrollable height is greater than the clamped visible height,
        // it means the text exceeds the 3-line limit.
        this.isTruncatable = el.scrollHeight > el.clientHeight;
      });
    },
    expand() {
      this.isExpanded = true;
    }
  }
};
</script>

<template>
  <div class="expandable-description">
    <div
        ref="content"
        class="content-text"
        :class="{ 'clamped': !isExpanded, 'expanded': isExpanded }"
        :style="{ '--line-clamp': lines }"
    >
      {{ text }}
    </div>

    <span
        v-if="!isExpanded && isTruncatable"
        class="read-more-btn"
        @click="expand"
    >
      {{ t('imageScanner.general.readMore') }}
    </span>
  </div>
</template>

<style lang="scss" scoped>
.expandable-description {
  position: relative;
  width: 100%;
  display: block;
}

.content-text {
  color: var(--disabled-text);
  font-family: 'Lato', sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 21px;

  /* Smooth slide-down transition */
  transition: max-height 0.4s ease-in-out;
  overflow: hidden;

  &.clamped {
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: var(--line-clamp, 3);
    /* Calculate exact max-height: 21px line-height * 3 lines */
    max-height: calc(21px * var(--line-clamp, 3));
  }

  &.expanded {
    /* Arbitrarily large max-height to allow the slide-down transition to complete */
    max-height: 2000px;
  }
}

.read-more-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  color: var(--disabled-text);
  text-decoration: underline;
  cursor: pointer;

  /* Use a gradient to fade over the text smoothly, hiding the native CSS ellipsis */
  background: linear-gradient(to right, transparent, var(--body-bg) 24px, var(--body-bg) 100%);
  padding-left: 24px;

  &:hover {
    text-decoration: none;
  }
}
</style>