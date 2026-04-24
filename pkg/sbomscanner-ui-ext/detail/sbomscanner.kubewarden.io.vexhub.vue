<script setup lang="ts">
import DetailPage from '@shell/components/Resource/Detail/Page.vue';
import TitleBar from '@shell/components/Resource/Detail/TitleBar/index.vue';
import Metadata from '@shell/components/Resource/Detail/Metadata/index.vue';
import Date from '@shell/components/formatter/Date.vue';
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';
import UriExternalLink from '@sbomscanner-ui-ext/formatters/UriExternalLink.vue';
import ExpandableDescription from '@sbomscanner-ui-ext/components/common/ExpandableDescription.vue';
import { computed } from 'vue';

const store = useStore();
const { t } = useI18n(store);
const props = defineProps<{
  value: any
}>();

const vexhub = props.value;

const defaultMastheadProps = computed(() => {
  return {
    titleBarProps: {
      resource:          vexhub,
      resourceName:      vexhub?.metadata?.name ?? '',
      resourceTypeLabel: t('imageScanner.vexManagement.title'),
      resourceTo:        vexhub?.listLocation,
      badge:             {
        color: vexhub?.spec?.enabled ? ('bg-success' as 'bg-success') : ('bg-error' as 'bg-error'),
        label: t(`imageScanner.enum.status.${vexhub?.spec?.enabled ? 'enabled' : 'disabled'}`)
      },
      actionMenuResource: vexhub,
      showViewOptions:    false
    },
    metadataProps: {
      resource:               vexhub,
      identifyingInformation: [
        {
          label:         'URI',
          value:         vexhub?.spec?.url ?? '',
          valueOverride: {
            component: UriExternalLink,
            props:     { value: vexhub?.spec?.url ?? '' }
          }
        },
        {
          label: 'Created by',
          value: Number(vexhub?.metadata?.generation) === 1 ? 'Rancher' : 'Manual entry'
        },
        {
          label: 'Last sync',
          value: undefined, // TODO: Add last sync time when backend supports it
        },
        {
          label:         'Updated',
          value:         vexhub?.metadata?.creationTimestamp ?? '',
          valueOverride: {
            component: Date,
            props:     { value: vexhub?.metadata?.creationTimestamp ?? '' }
          }
        }
      ],
      annotations: [],
      labels:      []
    }
  };
});
</script>

<template>
  <DetailPage>
    <template #top-area>

      <TitleBar v-bind="defaultMastheadProps.titleBarProps">
        <template #additional-actions>
          <button
              v-if="value?.toggle"
              data-testid="detail-explore-button"
              type="button"
              class="btn role-primary actions"
              @click="value.toggle.invoke()"
          >
            <i :class="`icon ${value.toggle.icon}`"></i>
            {{ value.toggle.label }}
          </button>
        </template>
      </TitleBar>

      <ExpandableDescription
          v-if="vexhub?.description"
          :text="vexhub.description"
          :lines="3"
          class="vex-description"
      />

      <div class="metadata-wrapper">
        <Metadata
            class="masthead"
            v-bind="defaultMastheadProps.metadataProps"
        />
      </div>

    </template>
  </DetailPage>
</template>

<style lang="scss" scoped>
.btn.actions {
  gap: 12px;
}

.vex-description {
  max-width: calc(100% - 350px);
  margin-top: 4px;
  margin-bottom: 24px;
}

.metadata-wrapper {
  margin-top: 16px;
  margin-bottom: 24px;
}

/* Hide empty labels and annotations section */
/* TODO: Remove when rancher provides option in their masthead component */
.masthead:deep(.labels-and-annotations-empty) {
  display: none;
}
</style>