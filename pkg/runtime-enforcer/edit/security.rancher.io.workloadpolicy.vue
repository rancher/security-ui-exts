<template>
  <teleport to=".masthead .title">
    <div class="custom-masthead-subheader">
      <span v-if="namespace" class="meta-item">
        <span class="meta-label">{{ t("resourceDetail.masthead.namespace") }}:</span>
        <router-link :to="namespaceLocation" class="meta-value">
          {{ namespace }}
        </router-link>
      </span>

      <span v-if="workloadName" class="meta-item">
        <span class="meta-label">{{ t("runtimeEnforcer.policyProposal.masthead.workload") }}:</span>
        <router-link v-if="workloadLocation" :to="workloadLocation" class="meta-value">
          {{ workloadName }}
        </router-link>
        <span v-else class="meta-value">{{ workloadName }}</span>
      </span>

      <span v-if="creationTimestamp" class="meta-item">
        <span class="meta-label">{{ t("resourceDetail.masthead.age") }}:</span>
        <LiveDate class="live-date meta-value" :value="creationTimestamp" />
      </span>
    </div>
  </teleport>

  <CruResource
      :mode="mode"
      :resource="value"
      :errors="errors"
      :validation-passed="isValid"
      :can-yaml="false"
      @finish="savePolicy"
      @cancel="cancel"
  >
    <div class="active-policy-edit">
      <Banner
          v-for="(err, idx) in errors"
          :key="idx"
          color="error"
          :label="err"
      />

      <NameNsDescription
          :value="value"
          :mode="mode"
          name-label="runtimeEnforcer.activePolicies.columns.policy"
          descriptionPlaceholder="runtimeEnforcer.activePolicy.descriptionPlaceholder"
      />

      <div class="row mb-20">
        <div class="col span-3">
          <LabeledInput
              :value="workloadName"
              :label="t('runtimeEnforcer.policyProposal.masthead.workload')"
              :mode="mode"
              :disabled="true"
              :required="true"
          />
        </div>
        <div class="col span-3">
          <LabeledInput
              :value="workloadType"
              :label="t('runtimeEnforcer.policyProposal.masthead.workloadType')"
              :mode="mode"
              :disabled="true"
              :required="true"
          />
        </div>
      </div>

      <!-- Mode Selector -->
      <div class="row mt-20 mb-20">
        <div class="col span-12">
          <RadioGroup
              v-model:value="spec.mode"
              name="policy-mode"
              :mode="mode"
              :options="modeRadioOptions"
              :row="true"
          />
        </div>
      </div>

      <div class="containers-section mt-30">
        <div class="containers-title-row mb-15">
          <h3 class="m-0">
            {{ t('runtimeEnforcer.policyProposal.containers.title') }}
          </h3>
        </div>

        <div class="row">
          <div class="col span-12">
            <Tabbed :side-tabs="true">
              <Tab
                  v-for="(c, cIdx) in containerList"
                  :key="c.name || cIdx"
                  :name="c.name"
                  :label="`${c.name} (${c.executables.length})`"
                  :show-header="false"
              >
                <div class="container-content custom-content-bg p-20">
                  <div class="row mb-20">
                    <div class="col span-6">
                      <LabeledInput
                          :value="c.name"
                          :label="t('runtimeEnforcer.policyProposal.containerName')"
                          :mode="mode"
                          :disabled="true"
                          :required="true"
                      />
                    </div>

                    <div class="col span-6">
                      <LabeledInput
                          :value="c.image"
                          :label="t('runtimeEnforcer.policyProposal.containers.table.image')"
                          :mode="mode"
                          :disabled="true"
                          :required="true"
                      />
                    </div>
                  </div>

                  <div class="executables-header mb-10 d-flex align-center">
                    <label class="text-bold m-0">
                      {{ t('runtimeEnforcer.policyProposal.allowedExecutables') }}
                    </label>
                    <i class="icon icon-info ml-5 text-muted" />
                  </div>

                  <!-- Executables Rows -->
                  <div
                      v-for="(exec, eIdx) in c.executables"
                      :key="eIdx"
                      class="executable-row row mb-10"
                  >
                    <div class="col span-6">
                      <LabeledInput
                          :value="exec.path"
                          :placeholder="t('runtimeEnforcer.policyProposal.executablePlaceholder')"
                          :mode="mode"
                          @update:value="updateExecutablePath(c.name, eIdx, $event)"
                      />
                    </div>

                    <div class="col span-6 align-vertical-center">
                      <a
                          class="text-link cursor-pointer"
                          @click="removeExecutable(c.name, eIdx)"
                      >
                        {{ t('generic.remove') }}
                      </a>
                    </div>
                  </div>

                  <div class="row mt-10">
                    <div class="col span-6">
                      <a
                          class="text-link cursor-pointer px-12"
                          @click="addExecutable(c.name)"
                      >
                        {{ t('runtimeEnforcer.policyProposal.addExecutable') }}
                      </a>
                    </div>
                  </div>
                </div>
              </Tab>
            </Tabbed>
          </div>
        </div>
      </div>
    </div>
  </CruResource>
</template>

<script>
import CruResource from '@shell/components/CruResource';
import { LabeledInput } from '@components/Form/LabeledInput';
import NameNsDescription from '@shell/components/form/NameNsDescription';
import Tabbed from '@shell/components/Tabbed';
import Tab from '@shell/components/Tabbed/Tab';
import CreateEditView from '@shell/mixins/create-edit-view';
import Banner from '@components/Banner/Banner';
import RadioGroup from '@components/Form/Radio/RadioGroup';
import { POLICY_MODE } from '@runtime-enforcer/types';
import { NAMESPACE, WORKLOAD_KIND_TO_TYPE_MAPPING } from '@shell/config/types';

export default {
  name: 'WorkloadPolicyEdit',

  components: {
    CruResource,
    LabeledInput,
    NameNsDescription,
    Tabbed,
    Tab,
    Banner,
    RadioGroup,
  },

  mixins: [CreateEditView],

  props: {
    value: {
      type:     Object,
      required: true
    },
    mode: {
      type:     String,
      required: true
    }
  },

  data() {
    return {
      errors:        [],
      ownerWorkload: null,
    };
  },

  async fetch() {
    const loadPromises = Object.values(WORKLOAD_KIND_TO_TYPE_MAPPING).map((type) =>
        this.$store.dispatch('cluster/findAll', { type })
    );

    await Promise.allSettled(loadPromises);
  },
  mounted() {
    document.body.classList.add('re-custom-policy-edit');
  },
  beforeUnmount() {
    document.body.classList.remove('re-custom-policy-edit');
  },
  computed: {
    namespace() {
      return this.value?.metadata?.namespace || null;
    },
    creationTimestamp() {
      return this.value?.metadata?.creationTimestamp || null;
    },
    namespaceLocation() {
      return {
        name: 'c-cluster-product-resource-id',
        params: {
          cluster: this.$route.params.cluster,
          product: 'explorer',
          resource: NAMESPACE,
          id: this.namespace,
        },
      };
    },
    workloadName() {
      return this.value.workloadRef?.workloadName || '';
    },
    workloadType() {
      return this.value.workloadRef?.workloadType || '';
    },
    ownerWorkloadSteveType() {
      return WORKLOAD_KIND_TO_TYPE_MAPPING[this.workloadType] || (this.workloadType ? `apps.${ this.workloadType.toLowerCase() }` : 'apps.deployment');
    },
    workloadLocation() {
      if (this.value.workloadRef?.workloadLocation) {
        return this.value.workloadRef.workloadLocation;
      }

      if (!this.workloadName || !this.namespace) {
        return null;
      }

      return {
        name:   'c-cluster-product-resource-id',
        params: {
          cluster:  this.$route.params.cluster,
          product:  'explorer',
          resource: this.ownerWorkloadSteveType,
          id:       `${ this.namespace }/${ this.workloadName }`,
        },
      };
    },
    spec() {
      if (!this.value.spec) {
        this.value.spec = {};
      }
      if (!this.value.spec.mode) {
        this.value.spec.mode = POLICY_MODE.PROTECT;
      }

      return this.value.spec;
    },
    modeRadioOptions() {
      return [
        {
          label: this.t('runtimeEnforcer.activePolicies.mode.protect'),
          value: POLICY_MODE.PROTECT,
        },
        {
          label: this.t('runtimeEnforcer.activePolicies.mode.monitor'),
          value: POLICY_MODE.MONITOR,
        },
      ];
    },

    containerImages() {
      const refImages = this.value.workloadRef?.imageMap;
      if (refImages && Object.keys(refImages).length > 0) {
        return refImages;
      }
    },

    containerList() {
      const rules = this.spec.rulesByContainer || {};

      return Object.keys(rules).map((containerName) => {
        const containerRules = rules[containerName] || {};
        const allowed = containerRules.executables?.allowed || [];

        return {
          name:        containerName,
          image:       containerRules.image || this.containerImages?.[containerName] || this.t('generic.none'),
          executables: allowed.map((path) => ({
            path
          }))
        };
      });
    },

    isValid() {
      return !!this.value?.metadata?.name;
    }
  },

  methods: {
    ensureRulesPath(containerName) {
      if (!this.value.spec) {
        this.value.spec = {};
      }
      if (!this.value.spec.rulesByContainer) {
        this.value.spec.rulesByContainer = {};
      }
      if (!this.value.spec.rulesByContainer[containerName]) {
        this.value.spec.rulesByContainer[containerName] = {};
      }
      if (!this.value.spec.rulesByContainer[containerName].executables) {
        this.value.spec.rulesByContainer[containerName].executables = {};
      }
      if (!this.value.spec.rulesByContainer[containerName].executables.allowed) {
        this.value.spec.rulesByContainer[containerName].executables.allowed = [];
      }

      return this.value.spec.rulesByContainer[containerName].executables.allowed;
    },

    addExecutable(containerName) {
      const allowed = this.ensureRulesPath(containerName);

      allowed.push('');
    },

    updateExecutablePath(containerName, execIndex, val) {
      const allowed = this.ensureRulesPath(containerName);

      allowed.splice(execIndex, 1, val);
    },

    removeExecutable(containerName, execIndex) {
      const allowed = this.ensureRulesPath(containerName);

      allowed.splice(execIndex, 1);
    },

    validateForm() {
      const errors = [];
      const rules = this.spec.rulesByContainer || {};

      Object.keys(rules).forEach((containerName) => {
        const allowed = rules[containerName]?.executables?.allowed || [];

        for (let i = 0; i < allowed.length; i++) {
          const path = (allowed[i] || '').trim();

          if (!path) {
            errors.push(this.t('runtimeEnforcer.policyProposal.errors.emptyPath', { container: containerName, index: i + 1 }));
          } else if (!path.startsWith('/')) {
            errors.push(this.t('runtimeEnforcer.policyProposal.errors.invalidPath', { path, container: containerName }));
          }
        }
      });

      return errors;
    },

    async savePolicy(buttonDone) {
      this.errors = [];
      const rules = this.spec.rulesByContainer || {};

      Object.keys(rules).forEach((containerName) => {
        if (rules[containerName]?.executables?.allowed) {
          rules[containerName].executables.allowed = rules[containerName].executables.allowed
              .map((p) => p.trim())
              .filter(Boolean);
        }
      });

      const validationErrors = this.validateForm();

      if (validationErrors.length) {
        this.errors = validationErrors;
        buttonDone(false);

        return;
      }

      try {
        await this.value.save();
        buttonDone(true);
        this.done();
      } catch (err) {
        const apiError = err?.message || err?._statusText || err;

        this.errors = [apiError];
        buttonDone(false);
      }
    },

    cancel() {
      this.done();
    }
  }
};
</script>

<style lang="scss">
/* Hide native shell subheader only on this edit page */
body.re-custom-policy-edit {
  .masthead .subheader:not(.custom-masthead-subheader),
  .masthead .badge-state {
    display: none !important;
  }
}

.custom-masthead-subheader {
  display: flex !important;
  flex-direction: row !important;
  flex-wrap: wrap !important;
  align-items: center !important;
  gap: 6px 20px !important;
  color: var(--input-label, rgb(108, 111, 118)) !important;
  font-family: Lato, arial, helvetica, sans-serif !important;
  font-size: 14px !important;
  line-height: 16.1px !important;
  margin: 5px 0 !important;

  .meta-item {
    display: inline-flex !important;
    align-items: center !important;
    gap: 4px !important;
    white-space: nowrap !important;
    max-width: 450px !important;
  }

  .meta-label {
    color: var(--input-label, rgb(108, 111, 118)) !important;
    font-weight: 400 !important;
  }

  .meta-value {
    color: var(--link, #3d98d3) !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;

    &.live-date {
      color: var(--body-text, #141419) !important;
    }
  }
}
</style>

<style lang="scss" scoped>
.active-policy-edit {
  .custom-content-bg {
    background-color: var(--nav-bg, #f4f5f8);
    border: 1px solid var(--border);
    border-radius: var(--border-radius);
  }

  .executable-row {
    display: flex;
    align-items: center;
    width: 100%;
  }

  .align-vertical-center {
    display: flex;
    align-items: center;
    height: 54px;
  }

  .cursor-pointer {
    cursor: pointer;
  }

  .px-12 {
    padding-left: 12px;
    padding-right: 12px;
  }
}
</style>