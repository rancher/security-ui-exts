<script setup>
import { computed, useStore } from '@runtime-enforcer/utils/vue-imports';
import { useRouter } from 'vue-router';
import { watch } from 'vue';
import { RESOURCE } from '@runtime-enforcer/types';
import InstallView from '@runtime-enforcer/components/InstallView';
import { PRODUCT_NAME } from '@runtime-enforcer/types';

const store = useStore();
const router = useRouter();

const hasSchema = computed(() => !!store.getters['cluster/schemaFor'](RESOURCE.POLICY_PROPOSALS));

// Replace rather than push: this page only exists to forward to Active Policies, so
// leaving it in the history means going back lands here and forwards again immediately.
watch(hasSchema, (schema) => {
  if (schema) {
    router.replace({
      name:   `c-cluster-${ PRODUCT_NAME }-resource`,
      params: {
        resource: RESOURCE.ACTIVE_POLICIES,
        cluster:  router.currentRoute.value.params.cluster,
        product:  PRODUCT_NAME
      }
    });
  }
}, { immediate: true });
</script>

<template>
  <div>
    <InstallView
      v-if="!hasSchema"
    />
  </div>
</template>
