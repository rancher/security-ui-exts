<script setup>
import { computed, useStore } from '@runtime-enforcer/utils/vue-imports';
import { useRouter } from 'vue-router';
import { RESOURCE } from '@runtime-enforcer/types';
import InstallView from '@runtime-enforcer/components/InstallView';
import { PRODUCT_NAME } from '@runtime-enforcer/types';

const store = useStore();
const router = useRouter();

const hasSchema = computed(() => {
  const schema = store.getters['cluster/schemaFor'](RESOURCE.POLICY_PROPOSALS);

  if (schema) {
    router.push({
      name:   `c-cluster-${ PRODUCT_NAME }-resource`,
      params: {
        resource: RESOURCE.POLICY_PROPOSALS,
        cluster:  router.currentRoute.value.params.cluster,
        product:  PRODUCT_NAME
      }
    });
  }

  return !!schema;
});
</script>

<template>
  <div>
    <InstallView
      v-if="!hasSchema"
    />
  </div>
</template>
