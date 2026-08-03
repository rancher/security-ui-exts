<script>
import { mapGetters } from 'vuex';
import { Card } from '@components/Card';
import { Banner } from '@components/Banner';
import YamlEditor from '@shell/components/YamlEditor';
import FileSelector from '@shell/components/form/FileSelector';
import AsyncButton from '@shell/components/AsyncButton';
import LabeledSelect from '@shell/components/form/LabeledSelect';
import SortableTable from '@shell/components/SortableTable';
import { sortBy } from '@shell/utils/sort';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { NAMESPACE } from '@shell/config/types';
import { NAME as NAME_COL, TYPE, NAMESPACE as NAMESPACE_COL, AGE } from '@shell/config/table-headers';
import RcButton from '@components/RcButton/RcButton.vue';

export default {
  emits: ['close', 'onReadyYamlEditor'],

  components: {
    AsyncButton,
    Banner,
    Card,
    YamlEditor,
    FileSelector,
    LabeledSelect,
    SortableTable,
    RcButton
  },

  props: {
    defaultNamespace: {
      type:    String,
      default: undefined
    },
  },

  async fetch() {
    this.allNamespaces = (await this.$store.dispatch('cluster/findAll', { type: NAMESPACE, opt: { url: 'namespaces' } })) || [];

    if (this.selectedNamespace === undefined) {
      const defaultNamespace = 'default';
      const hasAccessToDefaultNamespace = this.allNamespaces.some((ns) => ns.name === defaultNamespace);

      this.selectedNamespace = hasAccessToDefaultNamespace ? defaultNamespace : this.allNamespaces[0]?.name;
    }
  },

  mounted() {
    //Override the parent layer (Dialog) from Card component for the border radius
    const parent = document.querySelector('.import-dialog-card')?.closest('.modal-container');

    parent?.classList.add('import-dialog-container');

    if (parent) {
      parent.style.borderRadius = '8px';
    }
  },

  data() {
    return {
      currentYaml:       '',
      allNamespaces:     [],
      errors:            null,
      rows:              null,
      done:              false,
      selectedNamespace: this.defaultNamespace,
    };
  },

  computed: {
    ...mapGetters(['currentCluster']),

    namespaceOptions() {
      const out = this.allNamespaces.map((obj) => {
        return {
          label: obj.name,
          value: obj.name,
        };
      });

      return sortBy(out, 'label');
    },

    headers() {
      return [
        TYPE,
        NAME_COL,
        NAMESPACE_COL,
        AGE
      ];
    },
  },

  methods: {
    close() {
      this.$emit('close');
    },

    onFileSelected(value) {
      const component = this.$refs.yamleditor;

      if (component) {
        this.errors = null;
        component.updateValue(value);
      }
    },

    async importYaml(btnCb) {
      try {
        this.errors = [];

        const res = await this.currentCluster.doAction('apply', {
          yaml:             this.currentYaml,
          defaultNamespace: this.selectedNamespace,
        });

        btnCb(true);

        this.rows = res;
        this.done = true;
      } catch (err) {
        this.errors = exceptionToErrorsArray(err);
        this.done = false;
        btnCb(false);
      }
    },

    rowClick(e) {
      if ( e.target.tagName === 'A' ) {
        this.close();
      }
    },

    onReadyYamlEditor(arg) {
      this.$emit('onReadyYamlEditor', arg);
    }
  },
};
</script>

<template>
  <Card
    :show-highlight-border="false"
    data-testid="import-yaml"
    class="import-dialog-card"
  >
    <template #title>
      <div style="display: block; width: 100%;">
        <template v-if="done">
          <h4 data-testid="import-yaml-success">
            {{ t('import.success', {count: rows.length}) }}
          </h4>
        </template>
        <template v-else>
          <h4 v-t="'import.title'" />
          <!-- Added import instruction banner -->
          <Banner
            class="import-instruction-banner"
            color="info"
          >
            <span class="banner-text">
              {{ t('runtimeEnforcer.activePolicies.import.instruction') }}
            </span>
          </Banner>
          <div class="row">
            <div class="col span-6">
              <FileSelector
                role="button"
                :aria-label="t('generic.readFromFileArea', { area: t('import.title') })"
                class="btn role-secondary pull-left medium"
                :label="t('generic.readFromFile')"
                @selected="onFileSelected"
              />
            </div>
            <!-- Changed the layout of the namespace select -->
            <div class="col span-6 namespace-col">
              <label>{{ t('runtimeEnforcer.activePolicy.masthead.namespace') }}</label>
              <LabeledSelect
                class="namespace-select"
                v-model:value="selectedNamespace"
                :options="namespaceOptions"
                mode="edit"
              />
            </div>
          </div>
        </template>
      </div>
    </template>
    <template #body>
      <template v-if="done">
        <div class="results">
          <SortableTable
            :rows="rows"
            :headers="headers"
            mode="view"
            key-field="_key"
            :search="false"
            :paging="true"
            :row-actions="false"
            :table-actions="false"
            :sub-rows-description="false"
            @rowClick="rowClick"
          />
        </div>
      </template>
      <YamlEditor
        v-else
        ref="yamleditor"
        v-model:value="currentYaml"
        class="yaml-editor"
        @onReady="onReadyYamlEditor"
      />
      <Banner
        v-for="(err, i) in errors"
        :key="i"
        color="error"
        :label="err"
      />
    </template>
    <template #actions>
      <div
        v-if="done"
        class="text-center"
        style="width: 100%"
      >
        <button
          :aria-label="t('generic.close')"
          role="button"
          type="button"
          class="btn role-primary"
          data-testid="import-yaml-close"
          @click="close"
        >
          {{ t('generic.close') }}
        </button>
      </div>
      <!-- Changed the style of the buttons -->
      <div
        v-else
        class="text-right"
        style="width: 100%"
      >
        <RcButton
          variant="link"
          size="large"
          @click="close"
        >
          {{ t('generic.cancel') }}
        </RcButton>
        <AsyncButton
          v-if="!done"
          icon="icon-upload"
          class="import-btn"
          mode="import"
          :disabled="!currentYaml.length"
          data-testid="import-yaml-import-action"
          :aria-label="t('import.title')"
          @click="importYaml"
        />
      </div>
    </template>
  </Card>
</template>

<style lang='scss' scoped>
  $min: 50vh;
  $max: 50vh;

  .yaml-editor {
    flex: 1;
    min-height: $min;
    max-height: $max;

    :deep() .code-mirror {
      .CodeMirror {
        position: initial;
      }

      .CodeMirror,
      .CodeMirror-scroll,
      .CodeMirror-gutters {
        min-height: $min;
        max-height: $max;
      }
    }
  }

  //Override the class style from Card component for the box shadow
  .import-dialog-card {
    box-shadow: none !important;
  }

  .import-instruction-banner {
    margin: 16px 0 24px 0;
  }

  .medium {
    height: 32px !important;
    min-height: 32px !important;
  }

  .namespace-select {
    max-width: 300px;
  }

  .namespace-col {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;

    label {
      margin: 0;
      white-space: nowrap;
    }
  }

  .import-btn {
    padding-left: 16px;
    padding-right: 16px;
  }
</style>
