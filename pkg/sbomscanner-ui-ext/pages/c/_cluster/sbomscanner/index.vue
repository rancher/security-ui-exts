<script>
import Dashboard from '@sbomscanner-ui-ext/pages/c/_cluster/sbomscanner/Dashboard';
import { SERVICE, SCHEMA } from '@shell/config/types';
import { RESOURCE } from '@sbomscanner-ui-ext/types';
import InstallView from '@sbomscanner-ui-ext/components/InstallView';

export default {
  name: 'InstallationWizard',

  components: { Dashboard, InstallView },

  data() {
    return { store: this.$store };
  },

  // fetch() {
  //   const hasSchema = this.$store.getters['cluster/schemaFor'](RESOURCE.REGISTRY);
  //   if (!hasSchema) {
  //     setTimeout(() => {
  //       const groupedMenuEl = document.querySelector('#group-imageScanner');
  //       const sbomScannerExpandEl = document.querySelector('i[aria-controls="group-imageScanner"]')
  //       console.log('Mounted InstallationWizard, hiding menu item:', groupedMenuEl, sbomScannerExpandEl); // --- IGNORE ---
  //       if (groupedMenuEl) {
  //         groupedMenuEl.style.display = 'none';
  //         sbomScannerExpandEl.style.display = 'none';
  //       }
  //     }, 0);
  //   }
  // },

  computed: {
    hasSchema() {
      return this.$store.getters['cluster/schemaFor'](RESOURCE.REGISTRY);
    },
  }
};
</script>

<template>
  <div>
    <InstallView
      v-if="!hasSchema"
    />
    <Dashboard v-else />
  </div>
</template>
