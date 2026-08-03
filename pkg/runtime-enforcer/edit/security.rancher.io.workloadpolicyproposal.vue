<template>
  <CruResource
      :mode="mode"
      :resource="value"
      :errors="errors"
      :validation-passed="isValid"
      :can-yaml="false"
      @finish="saveProposal"
      @cancel="cancel"
  >
    <div class="policy-proposal-edit">

      <Banner
          v-for="(err, idx) in errors"
          :key="idx"
          color="error"
          :label="err"
      />

      <NameNsDescription
          :value="value"
          :mode="mode"
          name-label="runtimeEnforcer.policyProposal.policyName"
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
                    <i
                        class="icon icon-info ml-5 text-muted"
                        v-clean-tooltip="t('runtimeEnforcer.policyProposal.allowedExecutablesTooltip')"
                    />
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
                          class="text-primary cursor-pointer text-bold"
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

export default {
  name: 'WorkloadPolicyProposalEdit',

  components: {
    CruResource,
    LabeledInput,
    NameNsDescription,
    Tabbed,
    Tab,
    Banner
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
      errors:                   [],
      ownerWorkload:            null,
    };
  },

  async fetch() {
    if (!this.value.ownerWorkloadSteveType || !this.value.workload) {
      return;
    }

    try {
      this.ownerWorkload = await this.$store.dispatch('cluster/find', {
        type: this.value.ownerWorkloadSteveType,
        id:   `${ this.value.metadata.namespace }/${ this.value.workload }`,
      });
    } catch (err) {
      await this.$store.dispatch('growl/fromError', { err }, { root: true });
    }
  },

  computed: {
    spec() {
      if (!this.value.spec) {
        this.value.spec = {};
      }

      return this.value.spec;
    },

    ownerRef() {
      return this.value.metadata?.ownerReferences?.[0] || {};
    },

    workloadName() {
      return this.ownerRef.name || this.spec.workload || '';
    },

    workloadType() {
      return this.ownerRef.kind || this.spec.workloadType || '';
    },

    containerImages() {
      const containers = this.ownerWorkload?.spec?.template?.spec?.containers
          || this.ownerWorkload?.spec?.jobTemplate?.spec?.template?.spec?.containers
          || [];

      return containers.reduce((acc, container) => {
        acc[container.name] = container.image;

        return acc;
      }, {});
    },

    containerList() {
      const rules = this.spec.rulesByContainer || {};

      return Object.keys(rules).map((containerName) => {
        const containerRules = rules[containerName] || {};
        const allowed = containerRules.executables?.allowed || [];

        return {
          name:        containerName,
          image:       this.containerImages[containerName] || this.t('generic.none'),
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

        // Clean up empty strings or validate paths
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

    async saveProposal(buttonDone) {
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
/* Unscoped style to target the parent layout's masthead badge */
.masthead .badge-state {
  display: none !important;
}
</style>

<style lang="scss" scoped>
.policy-proposal-edit {

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
}
</style>