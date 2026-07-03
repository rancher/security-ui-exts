<script setup>
import { computed, useStore } from '@runtime-enforcer/utils/vue-imports';
import { RESOURCE } from '@runtime-enforcer/types';
import InstallView from '@runtime-enforcer/components/InstallView';
import PolicyProposals from './PolicyProposals.vue';

const store = useStore();

const hasSchema = computed(() => {
  return store.getters['cluster/schemaFor'](RESOURCE.POLICY_PROPOSALS);
});
</script>

<template>
  <div>
    <InstallView
      v-if="!hasSchema"
    />
    <PolicyProposals v-else />
  </div>
</template>
