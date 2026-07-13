<script setup lang="ts">
import { computed, ref, watch } from 'vue';

type WizardStep = {
  name: string;
  ready?: boolean;
  hidden?: boolean;
  label?: string;
};

const props = withDefaults(defineProps<{
  initStepIndex?: number;
  showTitle?: boolean;
  steps: WizardStep[];
}>(), {
  initStepIndex: 0,
  showTitle:     true,
});

const emit = defineEmits(['next']);

const activeStep = ref<WizardStep | null>(null);

watch(
  () => [props.steps, props.initStepIndex],
  () => {
    activeStep.value = props.steps?.[props.initStepIndex] || null;
  },
  { immediate: true }
);

const activeStepIndex = computed(() => {
  return props.steps.findIndex((s) => s.name === activeStep.value?.name);
});

const activeStepName = computed(() => {
  return activeStep.value?.name || '';
});

const activeStepLabel = computed(() => {
  return activeStep.value?.label || '';
});

const isAvailable = (step: WizardStep | null | undefined) => {
  if (!step) {
    return false;
  }

  const idx = props.steps.findIndex((s) => s.name === step.name);

  if (idx === 0) {
    return false;
  }

  for (let i = 0; i < idx; i++) {
    if (props.steps[i].ready === false) {
      return false;
    }
  }

  return true;
};

const goToStep = (number: number, confirmedReady?: boolean, fromNav?: boolean) => {
  if (number < 1) {
    return;
  }

  if (number === 1 && fromNav) {
    return;
  }

  const selected = props.steps[number - 1];

  if (!selected || (!confirmedReady && !isAvailable(selected) && number !== 1)) {
    return;
  }

  activeStep.value = selected;
  emit('next', { step: selected });
};

defineExpose({ goToStep });
</script>

<template>
  <div style="width: 100%">
    <div class="header mt-20 mb-20">
      <div class="title">
        <template v-if="showTitle">
          <div class="product">
            <div class="subtitle mr-20">
              <h2 class="mb-0">
                Runtime Enforcer
              </h2>
            </div>
          </div>
        </template>

        <div
          v-if="steps.length > 1"
          class="subtitle"
        >
          <h2 class="mb-0">
            Step {{ activeStepIndex + 1 }}
          </h2>
          <slot name="bannerSubtext">
            <span class="subtext">{{ activeStepLabel }}</span>
          </slot>
        </div>
      </div>

      <template v-if="steps.length > 1">
        <div class="step-sequence">
          <ul
            class="steps"
            tabindex="0"
          >
            <template
              v-for="(step, idx) in steps"
              :key="step.name + 'li'"
            >
              <li
                :id="step.name"
                :class="{
                  step: true,
                  active: step.name === activeStepName,
                  disabled: !isAvailable(step),
                }"
                role="presentation"
              >
                <span
                  :aria-controls="'step' + idx + 1"
                  :aria-selected="step.name === activeStepName"
                  role="tab"
                  class="controls"
                  @click.prevent="goToStep(idx + 1, true)"
                >
                  <span
                    class="icon icon-lg"
                    :class="{
                      'icon-dot': step.name === activeStepName,
                      'icon-dot-open': step.name !== activeStepName,
                    }"
                  />
                  <span>
                    {{ step.label }}
                  </span>
                </span>
              </li>
              <div
                v-if="idx !== steps.length - 1"
                :key="step.name"
                class="divider"
              />
            </template>
          </ul>
        </div>
      </template>
    </div>

    <slot
      name="stepContainer"
      :active-step="activeStep"
    >
      <template v-for="step in steps">
        <div
          v-if="step.name === activeStepName || step.hidden"
          :key="step.name"
          class="step-container"
          :class="{ hide: step.name !== activeStepName && step.hidden }"
        >
          <slot
            :step="step"
            :name="step.name"
          />
        </div>
      </template>
    </slot>
  </div>
</template>

<style lang="scss" scoped>
.header {
  display: flex;

  & .title {
    display: flex;
    flex-basis: 30%;
    align-items: center;

    & .product {
      display: flex;
      align-items: center;
    }

    & .product-image {
      display: flex;
      min-width: 40px;
      min-height: 40px;
      margin: 10px 10px 10px 0;
      overflow: hidden;

      .logo {
        max-width: 40px;
        max-height: 50px;
      }
    }

    .subtitle {
      display: flex;
      flex-direction: column;
      justify-content: center;
      margin-right: 24px;
      min-width: 80px;

      & .subtext {
        font-size: 0.9em;
        color: var(--text-secondary);
      }
    }
  }
}

.step-sequence {
  flex: 1;
  min-height: 60px;
  display: flex;
  width: 100%;

  .steps {
    flex: 1;
    margin: 0 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    list-style-type: none;
    padding: 0;

    &:focus {
      outline: none;
      box-shadow: none;
    }

    & li.step {
      display: flex;
      flex-direction: row;
      flex-grow: 1;
      align-items: center;

      & > span > span:last-of-type {
        padding-bottom: 0;
      }

      &:last-of-type {
        flex-grow: 0;
      }

      & .controls {
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 40px;
        overflow: visible;
        padding-top: 15px;

        & > span {
          padding-bottom: 5px;
          margin-bottom: 5px;
          white-space: nowrap;
        }
      }

      &.active .controls {
        color: var(--primary);
      }

      &:not(.disabled) {
        & .controls:hover > * {
          color: var(--primary) !important;
          cursor: pointer;
        }
      }

      &:not(.active) {
        & .controls > * {
          color: var(--input-disabled-text);
          text-decoration: none;
        }
      }
    }

    & .divider {
      flex-basis: 100%;
      border-top: 1px solid var(--border);
      position: relative;
      height: 1px;
      bottom: 8px;
    }
  }
}

.step-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
</style>
