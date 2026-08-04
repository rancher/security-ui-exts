<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
// import { useRoute } from 'vue-router';
import { getCurrentInstance } from 'vue';
import { useStore } from 'vuex';
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import RcButton from '@components/RcButton/RcButton.vue';
import { useI18n } from '@shell/composables/useI18n';
import { NAMESPACE } from '@shell/config/types';
import RancherMeta from '@common/components/RancherMeta.vue';
import { MetadataProperty } from '@common/types';
import ResourceTabs from '@shell/components/form/ResourceTabs';
import Tab from '@shell/components/Tabbed/Tab';
import { PRODUCT_NAME, RESOURCE } from '@runtime-enforcer/types';
import ActionMenu from '@shell/components/ActionMenuShell.vue';
import StatusBadge from '@runtime-enforcer/components/common/StatusBadge.vue';
import ExpandableDescription from '@common/components/ExpandableDescription.vue';
import AllowedExecutablesTable from "@runtime-enforcer/components/AllowedExecutablesTable.vue";


const props = defineProps<{
  value: any;
}>();

const policy = props.value;

const store = useStore();
// const route = useRoute();
const instance = getCurrentInstance();
const route = instance?.proxy?.$route as any;
const i18n = useI18n(store);

const canUpdate = computed(() => policy.canUpdate);

const ownerWorkload = ref<any>(null);

onMounted(async() => {
  //ToDo: Prepare to get wroklaod info from backend data
});

const namespaceRoute = computed(() => ({
  name:   'c-cluster-product-resource-id',
  params: {
    product:  'explorer',
    cluster:  route.params.cluster,
    resource: NAMESPACE,
    id:       policy.metadata?.namespace,
  },
}));

const modetext = computed(() => {
  return i18n.t(`runtimeEnforcer.activePolicies.mode.${policy.spec.mode.toLowerCase()}`);
});

const modeIconImgSrc = computed(() => {
  if (policy.spec.mode === 'monitor') {
    return require('@runtime-enforcer/assets/img/monitor.svg');
  } else if (policy.spec.mode === 'protect') {
    return require('@runtime-enforcer/assets/img/protect.svg');
  } else if (policy.spec.mode === 'enforce') {
    return null;
  }
});

const metaProperties = computed<MetadataProperty[]>(() => [
  {
    type:  'route',
    label: i18n.t('runtimeEnforcer.activePolicy.masthead.namespace'),
    value: policy.metadata?.namespace,
    route: namespaceRoute.value,
  },
  {
    type:  ownerWorkload.value ? 'route' : 'text',
    label: i18n.t('runtimeEnforcer.activePolicy.masthead.workload'),
    value: '',//policy.workload,
    route: ownerWorkload.value?.detailLocation,
  },
  {
    type:  'text',
    label: i18n.t('runtimeEnforcer.activePolicy.masthead.workloadType'),
    value: '',//policy.workloadType,
  },
  {
    type:   'icon',
    label:  i18n.t('runtimeEnforcer.activePolicy.masthead.mode'),
    value:  modetext.value,
    imgSrc: modeIconImgSrc.value,
  },
  {
    type:  'text',
    label: i18n.t('runtimeEnforcer.activePolicy.masthead.violations'),
    value: `${ policy.activeViolationCount ?? 0 }`,
  },
  {
    type:  'text',
    label: i18n.t('runtimeEnforcer.activePolicy.masthead.occurrences'),
    value: policy.violationCount ?? 0,
  },
  {
    type:  'text',
    label: i18n.t('runtimeEnforcer.activePolicy.masthead.nodes'),
    value: policy.status?.totalNodes ?? 0,
  },
  {
    type:  'text',
    label: i18n.t('runtimeEnforcer.activePolicy.masthead.executables'),
    value: policy.executables.length,
  },
  {
    type:  'date',
    label: i18n.t('runtimeEnforcer.activePolicy.masthead.age'),
    value: policy.metadata?.creationTimestamp,
  },
]);
</script>

<template>
  <DetailPage>
    <template #top-area>
      <div class="header">
        <div class="resource-header">
          <h1
            class="resource-header-name-state"
            style="margin-bottom: 4px;"
          >
            <RouterLink
              class="resource-link"
              :to="`/c/${$route.params.cluster}/${ PRODUCT_NAME }/${RESOURCE.ACTIVE_POLICIES}`"
            >
              {{ t('runtimeEnforcer.activePolicy.label') }}:
            </RouterLink>
            <span class="resource-header-name">
              {{ $route.params.id }}
            </span>
            <StatusBadge
              style="margin-left: 12px"
              :status="policy?.metadata?.state?.name"
            />
          </h1>
          <ExpandableDescription
              v-if="policy?.description"
              :text="policy.description"
              :lines="3"
          />
        </div>
        <div class="resource-header-actions">
          <RcButton
            v-if="canUpdate"
            variant="primary"
            left-icon="refresh"
            size="large"
            @click="policy.changeMode()"
          >
            {{ i18n.t('runtimeEnforcer.activePolicy.action.changeMode') }}
          </RcButton>
          <ActionMenu
            button-variant="multiAction"
            :resource="policy"
            data-testid="masthead-action-menu"
            :button-aria-label="t('component.resource.detail.titleBar.ariaLabel.actionMenu', { resource: RESOURCE.ACTIVE_POLICIES })"
          />
        </div>
      </div>
      <RancherMeta :properties="metaProperties"/>
    </template>
    <template #bottom-area>
     <ResourceTabs
      :value="policy"
      mode="view"
      :need-related="false"
      :needEvents="false"
      @update:value="$emit('input', $event)"
    >
      <Tab
        name="nodesEnforcement"
        :weight="30"
        :label="t('runtimeEnforcer.activePolicy.tabs.nodesEnforcement')"
      >
      </Tab>
      <Tab
        name="allowedExecutables"
        :weight="20"
        :label="t('runtimeEnforcer.activePolicy.tabs.allowedExecutables')"
      >
        <AllowedExecutablesTable
            :rules-by-container="policy.spec?.rulesByContainer"
            :container-images="containerImages"
        />
      </Tab>
      <Tab
        name="violations"
        :weight="20"
        :label="t('runtimeEnforcer.activePolicy.tabs.violations')"
      >
      </Tab>
    </ResourceTabs>
    </template>
  </DetailPage>
</template>

<style lang="scss" scoped>
.executable-pill {
  display: inline-block;
  padding: 2px 8px;
  margin: 2px 4px 2px 0;
  border-radius: 4px;
  background: var(--tag-bg);
  color: var(--tag-primary);
  font-size: 13px;
}
.rc-button.variant-multi-action {
  height: 32px !important;
}
:deep(.bottom-area) {
  margin-top: 0 !important;
}

.header {
      /* layout */
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 24px;
      align-self: stretch;
      /* style */
      border-radius: 6px;
      min-width: 740px;
      padding-top: 10px;

      .resource-header {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: flex-start;
        gap: 4px;
        flex: 1 0 0;
        max-width: calc(100% - 350px);

        .resource-header-name-state {
          display: flex;
          align-items: center;
          max-width: 100%;

          .resource-header-name {
            display: inline-block;
            flex: 1;
            white-space: nowrap;
            overflow-x: hidden;
            overflow-y: clip;
            text-overflow: ellipsis;
            margin-left: 4px;
          }
        }

        .resource-header-description {
          /* layout */
          display: flex;
          max-width: 900px;
          height: 21px;
          flex-direction: column;
          justify-content: center;
          /* typography */
          overflow: hidden;
          color: var(--disabled-text);
          text-overflow: ellipsis;
          white-space: nowrap;
          font-family: Lato;
          font-size: 14px;
          font-style: normal;
          font-weight: 400;
          line-height: 21px; /* 150% */
        }
      }

      .resource-header-actions {
        display: flex;
        align-items: center;
        gap: 16px;

        &:deep() button[data-testid="masthead-action-menu"] {
          border-radius: 4px;
          width: 35px;
          height: 40px;

          display: inline-flex;
          flex-direction: row;
          justify-content: center;
          align-items: center;
        }
      }
    }

</style>
