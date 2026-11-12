<script>
import { Card } from '@components/Card';
import RcButton from '@components/RcButton/RcButton.vue';
import { PRODUCT_NAME } from '@runtime-enforcer/types/runtime-enforcer.ts';
import { TIMESTAMP } from '@shell/config/labels-annotations';
import RadioButton from '@components/Form/Radio/RadioButton.vue';
import { _EDIT } from '@shell/config/query-params';
import { DOCUMENTATION_URL, WORKLOAD_PREFIX, POLICY_LABEL_KEY, WORKLOAD_RESTART_TS_LABEL_KEY } from '@runtime-enforcer/types';
import RichTranslation from '@shell/components/RichTranslation.vue';
import SubtleLink from '@shell/components/SubtleLink.vue';
import WorkloadTag from '@runtime-enforcer/components/common/WorkloadTag.vue';
import { POD, WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';
import { waitFor } from '@shell/utils/async';

// How long auto removal waits for the old labelled pods to go away before giving up.
const LABELLED_PODS_TIMEOUT_MS = 60000;
const LABELLED_PODS_POLL_MS = 2000;

// Steve puts the HTTP status on a non-enumerable `_status`; the error body also carries `status`.
const statusOf = (err) => err?._status ?? err?.status;

// The WorkloadPolicy delete webhook answers 403 "cannot delete WorkloadPolicy ... still use it" while labelled pods run.
const isBlockedByLabelledPods = (err) => statusOf(err) === 403 && `${ err?.message }`.includes('still use it');
const podsUsingPolicy = (err) => `${ err?.message }`.match(/still use it: (.+)$/s)?.[1]?.trim();

// Same pods the webhook counts: it ignores finished (Succeeded/Failed) pods, e.g. completed CronJob runs.
const isRunning = (pod) => !['Succeeded', 'Failed'].includes(pod.status?.phase);

export default {
  emits: ['close'],

  components: {
    Card,
    RcButton,
    RadioButton,
    RichTranslation,
    SubtleLink,
    WorkloadTag,
  },

  props: {
    resources: {
      type:    Array,
      default: () => [],
    },
  },

  data() {
    return {
      deleteInProgress:      false,
      workloadRemovalOption: 'auto',
      _EDIT:                 _EDIT,
      DOCUMENTATION_URL,
      WORKLOAD_PREFIX,
    };
  },

  computed: {
    isBulk() {
      return this.resources.length > 1;
    },

    title() {
      return this.t(`runtimeEnforcer.activePolicies.deleteDialog.title.${ this.isBulk ? 'bulk' : 'single' }`);
    },

    confirmText() {
      return this.isBulk
        ? this.t('runtimeEnforcer.activePolicies.deleteDialog.confirm.bulk', { count: this.resources.length }, true)
        : this.t('runtimeEnforcer.activePolicies.deleteDialog.confirm.single', { name: this.resources[0]?.nameDisplay }, true);
    },
    manualRemovalText() {
      return this.t(`runtimeEnforcer.activePolicies.deleteDialog.manualRemoval.${ this.isBulk ? 'bulk' : 'single' }`);
    },
    manualDescriptionKey() {
      return `runtimeEnforcer.activePolicies.deleteDialog.manualRemoval.${ this.isBulk ? 'bulk' : 'single' }`;
    },
    workloadRemovalOptions() {
      return [
        {
          label: this.t(`runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.remove.${ this.isBulk ? 'bulk' : 'single' }`),
          value: 'auto',
        },
        {
          label: this.t(`runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.manual.${ this.isBulk ? 'bulk' : 'single' }`, {}, true),
          value: 'manual',
        },
      ];
    },
    deleteButtonText() {
      return this.workloadRemovalOption === 'auto'
        ? (
          this.isBulk
            ? `${this.t('runtimeEnforcer.activePolicies.deleteDialog.deletePolicy.bulk')} & ${this.t('runtimeEnforcer.activePolicies.deleteDialog.restartWorkload.bulk')}`
            : `${this.t('runtimeEnforcer.activePolicies.deleteDialog.deletePolicy.single')} & ${this.t('runtimeEnforcer.activePolicies.deleteDialog.restartWorkload.single')}`
        )
        : this.t('runtimeEnforcer.activePolicies.deleteDialog.delete');
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    async unlabelAndRedeployWorkload(workload, now) {
      if (!workload) {
        return;
      }

      const podTemplate = workload.spec?.jobTemplate?.spec?.template ?? workload.spec?.template;

      if (!podTemplate) {
        return;
      }

      const templateMetadata = podTemplate.metadata ??= {};
      const labels = templateMetadata.labels ??= {};

      if (!labels[POLICY_LABEL_KEY]) {
        return;
      }

      delete labels[POLICY_LABEL_KEY];

      if (workload.kind !== 'CronJob' && workload.kind !== 'Job' && workload.spec?.template) {
        const metadata = workload.spec.template.metadata ??= {};
        const annotations = metadata.annotations ??= {};

        annotations[TIMESTAMP] = now;
      }

      await workload.save({ force: true });
    },

    async waitForLabelledPodsToGo(resource) {
      // The backend rejects the delete while any running pod still carries the label,
      // so wait for the old pods to go rather than for the workload template to change.
      const selector = `${ POLICY_LABEL_KEY }=${ resource.metadata.name }`;
      const namespace = resource.metadata.namespace;

      await this.$store.dispatch('cluster/findMatching', {
        type: POD, selector, namespace
      });
      try {
        await waitFor(
          () => !this.$store.getters['cluster/matching'](POD, selector, namespace).some(isRunning),
          '',
          LABELLED_PODS_TIMEOUT_MS,
          LABELLED_PODS_POLL_MS
        );
      } catch {
        // Fall through on timeout: the delete either succeeds or the backend rejects it naming the pods still using the policy.
      }
    },

    async findWorkload(resource) {
      try {
        return await this.$store.dispatch('cluster/find', {
          type: WORKLOAD_KIND_TO_TYPE_MAPPING[resource.workloadRef?.workloadType],
          id:   `${ resource.metadata.namespace }/${ resource.workloadRef?.workloadName }`,
        });
      } catch (err) {
        // A deleted workload has no label left to remove, so the policy can still be deleted.
        if (statusOf(err) === 404) {
          return undefined;
        }
        throw err;
      }
    },

    async deletePolicy(resource) {
      if (this.workloadRemovalOption === 'auto') {
        const now = new Date().toISOString().replace(/\.\d+Z$/, 'Z');

        await this.unlabelAndRedeployWorkload(await this.findWorkload(resource), now);
        await this.waitForLabelledPodsToGo(resource);
      }
      await resource?.remove?.();
    },

    successGrowl(deleted) {
      const plurality = deleted.length > 1 ? 'bulk' : 'single';
      const deletedMessage = deleted.length > 1
        ? this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk', { count: deleted.length }, true)
        : this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single', { name: deleted[0]?.nameDisplay }, true);

      return {
        title:   this.t(`runtimeEnforcer.activePolicies.deleteDialog.growl.title.${ plurality }`),
        message: this.workloadRemovalOption === 'auto'
          ? `${ deletedMessage } ${ this.t(`runtimeEnforcer.activePolicies.deleteDialog.growl.autoRemoval.${ plurality }`, {}, true) }`
          : deletedMessage,
      };
    },

    errorGrowl(resource, err) {
      const title = this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.title.error');

      if (isBlockedByLabelledPods(err)) {
        const pods = podsUsingPolicy(err);
        const reason = pods ? this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.labelStillInUse', { name: resource.nameDisplay, pods }, true) : err.message;

        return {
          title,
          message: this.workloadRemovalOption === 'auto' ? `${ reason } ${ this.t('runtimeEnforcer.activePolicies.deleteDialog.growl.autoRestartHint') }` : reason,
          timeout: 0,
        };
      }

      return { title, message: err?.message };
    },

    async deletePolicies() {
      this.deleteInProgress = true;
      try {
        const resources = this.resources || [];
        const results = await Promise.allSettled(resources.map((resource) => this.deletePolicy(resource)));
        const deleted = resources.filter((_, i) => results[i].status === 'fulfilled');

        results.forEach((result, i) => {
          if (result.status === 'rejected') {
            this.$store.dispatch('growl/error', this.errorGrowl(resources[i], result.reason));
          }
        });

        if (!deleted.length) {
          return;
        }

        this.$store.dispatch('growl/success', this.successGrowl(deleted));
        this.$router.push({
          name:   `c-cluster-${ PRODUCT_NAME }-resource`,
          params: {
            cluster: this.$route.params.cluster,
            product: PRODUCT_NAME
          }
        });
        this.close();
      } finally {
        this.deleteInProgress = false;
      }
    },
  },
};
</script>

<template>
  <Card
    class="delete-policy-proposals-dialog-card"
    :show-highlight-border="false"
  >
    <template #title>
      <h4 class="text-default-text">
        {{ title }}
      </h4>
    </template>
    <template #body>
      <p
        class="confirm-text"
        v-clean-html="confirmText"
      />
      <div
        class="workload-removal-option-group"
        role="radiogroup"
        data-testid="workload-removal-radio"
      >
        <div>
          <RadioButton
            name="workloadRemovalOptions"
            :value="workloadRemovalOption"
            val="auto"
            :label="workloadRemovalOptions[0].label"
            :mode="_EDIT"
            :disabled="deleteInProgress"
            :use-body-text-color="true"
            @update:value="workloadRemovalOption = $event"
          >
            <template #label>
              {{ workloadRemovalOptions[0].label }}
              <i
                v-clean-tooltip="t('runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.remove.tooltip')"
                class="icon icon-info icon-lg option-tooltip-icon"
              />
            </template>
          </RadioButton>
        </div>

        <div>
          <RadioButton
            name="workloadRemovalOptions"
            :value="workloadRemovalOption"
            val="manual"
            :label="workloadRemovalOptions[1].label"
            :mode="_EDIT"
            :disabled="deleteInProgress"
            :use-body-text-color="true"
            @update:value="workloadRemovalOption = $event"
          >
            <template #label>
              <span v-clean-html="workloadRemovalOptions[1].label" />
              <i
                v-clean-tooltip="t('runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.manual.tooltip')"
                class="icon icon-info icon-lg option-tooltip-icon"
              />
            </template>

            <template #description>
              <template v-if="workloadRemovalOption === 'manual'">
                <p class="confirm-text-manual">
                  <RichTranslation :k="manualDescriptionKey">
                    <template #learnMore="{ content }">
                      <SubtleLink
                        :href="DOCUMENTATION_URL"
                        target="_blank"
                      >
                        {{ content }}
                      </SubtleLink>
                    </template>
                  </RichTranslation>
                </p>
                  <WorkloadTag
                    v-for="resource in resources"
                    :key="resource.metadata.uid"
                    class="mt-2"
                    :label="`${ WORKLOAD_PREFIX } ${ resource.metadata.name }`"
                  />
              </template>
            </template>
          </RadioButton>
        </div>
      </div>
    </template>
    <template #actions>
      <RcButton
        variant="link"
        size="large"
        :disabled="deleteInProgress"
        @click="close"
      >
        {{ t('runtimeEnforcer.policyProposal.deleteDialog.cancel') }}
      </RcButton>
      <RcButton
        variant="danger"
        size="large"
        left-icon="trash"
        class="ml-10 bg-danger"
        :disabled="deleteInProgress"
        @click="deletePolicies"
      >
        {{ deleteButtonText }}
      </RcButton>
    </template>
  </Card>
</template>

<style lang="scss" scoped>
.delete-policy-proposals-dialog-card {
  box-shadow: none;

  :deep(.card-actions) {
    justify-content: end;
  }

  .confirm-text-manual {
    margin: 0 0 16px;
    cursor: default;
  }

  .confirm-text {
    margin: 16px 0 24px;
  }

  .bg-danger {
    background-color: var(--error) !important;
  }
  .bg-danger:disabled {
    background-color: var(--rc-active-disabled-background) !important;
  }

  .workload-removal-option-group {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 16px;

    :deep(.radio-button-outer-container-description) {
      color: var(--body-text);
      font-size: 14px;
      margin-top: 16px;
    }

    .option-tooltip-icon {
      margin-left: 8px;
    }
  }
}
</style>
