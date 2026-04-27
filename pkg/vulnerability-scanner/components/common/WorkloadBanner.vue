<script setup lang="ts">
import { Banner } from '@rancher/components';
import RichTranslation from '@shell/components/RichTranslation.vue';
</script>

<template>
  <Banner color="info" class="vul-banner">
    <RichTranslation :k="'imageScanner.general.workloadBanner.text'">
      <template #product="{ content }">
        <a href="/" target="_blank" rel="noopener noreferrer" class="text-underline">{{ content }}</a>
      </template>
      <template #documentation="{ content }">
        <a href="/" class="text-underline" rel="noopener noreferrer" target="_blank">
          {{ content }}<i class="icon icon-external-link icon-underline"></i>
        </a>
      </template>
    </RichTranslation>
  </Banner>
</template>

<style lang="scss" scoped>
.text-underline {
  color: var(--body-text);
  border-bottom: 0.65px solid var(--body-text);
  &:hover {
    text-decoration: none;
  }
}
.icon-underline {
  font-size: 10px;
}
.vul-banner {
  display: flex;
  padding: 10px 16px;
  align-items: center;
  gap: 4px;
  flex: 1 0 0;
  padding-left: 0;
}
</style>
