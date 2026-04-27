<script setup lang="ts">
import RichTranslation from '@shell/components/RichTranslation.vue';
</script>

<template>
  <div class="footer">
    <RichTranslation :k="'imageScanner.general.cvesPanel.text'">
      <template #provider="{ content }">
        <a href="/" target="_blank" rel="noopener noreferrer" class="provider-name">{{ content }}</a>
      </template>
    </RichTranslation>
  </div>
</template>

<style lang="scss" scoped>
.footer {
  margin-top: 12px;
  text-align: right;
  font-size: 14px;
  line-height: 140%;
  color: var(--label-secondary);

  .provider-name {
    color: var(--label-secondary);
    text-decoration: underline;
  }
}
</style>
