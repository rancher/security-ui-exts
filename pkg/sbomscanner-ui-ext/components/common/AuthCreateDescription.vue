<script setup lang="ts">
import RichTranslation from '@shell/components/RichTranslation.vue';

defineProps<{ secretCreateUrl: string }>();
defineEmits<{ (e: 'refresh'): void }>();
</script>

<template>
  <div>
    <p class="m-0 mb-5">
      <RichTranslation :k="'imageScanner.registries.configuration.cru.authentication.createDescription1'">
        <template #secret="{ content }">
          <a :href="secretCreateUrl" target="_blank">{{ content }}</a>
        </template>
      </RichTranslation>
    </p>
    <p class="m-0">
      <RichTranslation :k="'imageScanner.registries.configuration.cru.authentication.createDescription2'">
        <template #refresh="{ content }">
          <a href="#" @click.prevent="$emit('refresh')">{{ content }}</a>
        </template>
      </RichTranslation>
    </p>
  </div>
</template>
