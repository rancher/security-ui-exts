<script setup lang="ts">
// @ts-nocheck
import {
  computed, getCurrentInstance, nextTick, onMounted, reactive, ref, watch
} from 'vue';
import { useStore } from 'vuex';
import debounce from 'lodash/debounce';
import AsyncButton from '@shell/components/AsyncButton';
import Loading from '@shell/components/Loading';
import { LabeledInput } from '@components/Form/LabeledInput';
import { Checkbox } from '@components/Form/Checkbox';
import FileSelector from '@shell/components/form/FileSelector';
import SelectOrCreateAuthSecret from '@shell/components/form/SelectOrCreateAuthSecret';
import InstallWizard from './common/InstallWizard.vue';
import {
  REPO_TYPE, REPO, CHART, VERSION, NAMESPACE
} from '@shell/config/query-params';
import {
  CHART_REGISTRY_URL,
  DOCKER_CONFIG_JSON_TYPE,
  PRODUCT_NAME,
  RUNTIME_ENFORCER,
  RUNTIME_ENFORCER_REPOS,
  CERT_MANAGER_CSI_DRIVER,
  CERT_MANAGER_CSI_DRIVER_REPOS,
  CERT_MANAGER,
  CERT_MANAGER_REPOS
} from '@runtime-enforcer/types';
import { handleGrowl } from '@runtime-enforcer/utils/handle-growl';
import { refreshCharts, getLatestVersion } from '@runtime-enforcer/utils/chart';
import { CATALOG, SECRET, NAMESPACE as NAMESPACE_TYPE } from '@shell/config/types';

const store = useStore();
const instance = getCurrentInstance();
const t = (key: string, ...args: any[]) => {
  const translate = store.getters['i18n/t'];

  return typeof translate === 'function' ? translate(key, ...args) : key;
};

const installSteps = ref([
  {
    name:  'globalRepoAuth',
    label: t('runtimeEnforcer.installationWizard.globalRepoAuth.step'),
    ready: false,
  },
  {
    name:  'repositories',
    label: t('runtimeEnforcer.installationWizard.repositories.step'),
    ready: false,
  },
  {
    name:  'install',
    label: t('runtimeEnforcer.installationWizard.install.step'),
    ready: false,
  },
]);

const debouncedRefreshCharts = ref(null);
const install = ref(false);
const initStepIndex = ref(0);
const maxStepNum = ref(1);
const auth = reactive({
  authSecret:            '',
  secret:                '',
  caBundle:              '',
  insecurePlainHttp:     false,
  insecureSkipTLSVerify: false,
  username:              '',
  password:              '',
});
const allSecrets = ref([]);
const duplicatedAuthSecretKey = ref('');
const secretCreateHook = ref(null);
const certManagerNamespace = ref(CERT_MANAGER_REPOS.NAMESPACE);
const csiDriverNamespace = ref(CERT_MANAGER_CSI_DRIVER_REPOS.NAMESPACE);
const runtimeEnforcerNamespace = ref(RUNTIME_ENFORCER_REPOS.NAMESPACE);
const hasCsiDriverInstalled = ref(false);
const wizard = ref(null);
const isLoading = ref(true);

const currentCluster = computed(() => store.getters.currentCluster);
const charts = computed(() => store.getters['catalog/charts'] || []);
const repos = computed(() => store.getters['catalog/repos'] || []);
const inStore = computed(() => store.getters['currentProduct']?.inStore || 'cluster');
const mode = computed(() => 'create');

const combinedWatchedValues = computed(() => [certManagerRepo.value, csiDriverRepo.value, runtimeEnforcerRepo.value]);

const controllerChart4CertManager = computed(() => {
  if (certManagerRepo.value) {
    return store.getters['catalog/chart']({
      repoName:  certManagerRepo.value.id,
      repoType:  'cluster',
      chartName: CERT_MANAGER.CHART_NAME
    });
  }

  return null;
});

const controllerChart4RuntimeEnforcer = computed(() => {
  if (runtimeEnforcerRepo.value) {
    return store.getters['catalog/chart']({
      repoName:  runtimeEnforcerRepo.value.id,
      repoType:  'cluster',
      chartName: RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME
    });
  }

  return null;
});

const controllerChart4CsiDriver = computed(() => {
  if (csiDriverRepo.value) {
    return store.getters['catalog/chart']({
      repoName:  csiDriverRepo.value.id,
      repoType:  'cluster',
      chartName: CERT_MANAGER_CSI_DRIVER.CHART_NAME
    });
  }

  return null;
});

function findRepoByChartOrFallback(chartName, repoName, repoUrl) {
  const chart = charts.value?.find((chartItem) => chartItem.chartName === chartName);
  const chartRepo = repos.value?.find((repo) => repo.id === chart?.repoName);

  if (chartRepo) {
    return chartRepo;
  }

  return repos.value?.find((repo) => {
    const id = repo?.id || '';

    return repo?.spec?.url === repoUrl
      || repo?.metadata?.name === repoName
      || id === repoName
      || id.endsWith(`:${ repoName }`);
  });
}

function findRepoByUrlOrName(repoName, repoUrl) {
  return repos.value?.find((repo) => {
    const id = repo?.id || '';

    return repo?.spec?.url === repoUrl
      || repo?.metadata?.name === repoName
      || id === repoName
      || id.endsWith(`:${ repoName }`);
  });
}

const runtimeEnforcerRepo = computed(() => {
  return findRepoByChartOrFallback(
    RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME,
    RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME,
    RUNTIME_ENFORCER_REPOS.CHARTS_REPO
  );
});

const csiDriverRepo = computed(() => {
  return findRepoByChartOrFallback(
    CERT_MANAGER_CSI_DRIVER.CONTROLLER,
    CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME,
    CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO
  );
});

const certManagerRepo = computed(() => {
  return findRepoByChartOrFallback(
    CERT_MANAGER.CONTROLLER,
    CERT_MANAGER_REPOS.CHARTS_REPO_NAME,
    CERT_MANAGER_REPOS.CHARTS_REPO
  );
});

const hasCertManagerSchema = computed(() => store.getters['cluster/schemaFor'](CERT_MANAGER.SCHEMA));
const hasRuntimeEnforcerSchema = computed(() => store.getters['cluster/schemaFor'](RUNTIME_ENFORCER.SCHEMA));


const areRequiredInstallChartsUnavailable = computed(() => {
  return !controllerChart4CertManager.value
    && !controllerChart4RuntimeEnforcer.value
    && !controllerChart4CsiDriver.value;
});

const isContinueDisabled = computed(() => {
  return !auth.authSecret && (!auth.username || !auth.password) && !auth.caBundle;
});

async function onAuthSecretChanged(authSecret) {
  const appcoSecretName = getAuthSecretName(authSecret);

  try {
    await store.dispatch(`${ PRODUCT_NAME }/updateAppcoSecretName`, appcoSecretName);
  } catch (e) {
    handleGrowl({
      error: e,
      store,
    });
  }
}

async function onNamespaceInputsChanged() {
  try {
    await store.dispatch(`${ PRODUCT_NAME }/updateNamespaceInputs`, {
      certManagerNamespace:     certManagerNamespace.value,
      csiDriverNamespace:       csiDriverNamespace.value,
      runtimeEnforcerNamespace: runtimeEnforcerNamespace.value,
    });
  } catch (e) {
    handleGrowl({
      error: e,
      store,
    });
  }
}

function getSecretKey(secret) {
  const name = secret?.metadata?.name;
  const namespace = secret?.metadata?.namespace || 'default';

  if (!name) {
    return '';
  }

  return `${ namespace }/${ name }`;
}

function findAuthSecretByName(secretName) {
  if (!secretName) {
    return null;
  }

  return allSecrets.value?.find((secret) => secret?.metadata?.name === secretName) || null;
}

function isAlreadyExistsError(error) {
  return error?.status === 409 || error?.code === 409 || `${ error?.message || '' }`.toLowerCase().includes('already exists');
}

function buildDockerConfigJson(secret) {
  if (secret?.data?.[DOCKER_CONFIG_JSON_TYPE]) {
    return { data: { [DOCKER_CONFIG_JSON_TYPE]: secret.data[DOCKER_CONFIG_JSON_TYPE] } };
  }

  if (secret?.stringData?.[DOCKER_CONFIG_JSON_TYPE]) {
    return { stringData: { [DOCKER_CONFIG_JSON_TYPE]: secret.stringData[DOCKER_CONFIG_JSON_TYPE] } };
  }

  const decodeBase64 = (val) => {
    try {
      return val ? atob(val) : '';
    } catch {
      return val || '';
    }
  };

  const username = decodeBase64(secret?.data?.username) || secret?.stringData?.username || '';
  const password = decodeBase64(secret?.data?.password) || secret?.stringData?.password || '';

  const registryUrl = CHART_REGISTRY_URL;
  const registryHost = registryUrl
    ? (() => {
      try {
        return new URL(registryUrl).host;
      } catch {
        return registryUrl;
      }
    })()
    : '';

  const config = {
    auths: {
      [registryHost]: {
        username,
        password,
        auth: btoa(`${ username }:${ password }`),
      }
    }
  };

  const json = JSON.stringify(config);
  const base64Json = btoa(json);

  return { data: { [DOCKER_CONFIG_JSON_TYPE]: base64Json } };
}

function sanitizeSecretForCreate(secret, namespace) {
  const { data, stringData } = buildDockerConfigJson(secret);

  return {
    type:     SECRET,
    _type:    'kubernetes.io/dockerconfigjson',
    metadata: {
      name: secret?.metadata?.name,
      namespace,
    },
    data,
    stringData,
    immutable: secret?.immutable,
  };
}

function resolveNamespace(namespace) {
  return `${ namespace || '' }`.trim() || 'default';
}

async function duplicateAuthSecret(secret, namespace) {
  if (!secret?.metadata?.name) {
    return;
  }

  const secretKey = getSecretKey(secret);
  const targetNamespace = resolveNamespace(namespace);
  const duplicationKey = `${ secretKey }->${ targetNamespace }`;

  if (duplicatedAuthSecretKey.value === duplicationKey) {
    return;
  }

  await ensureNamespaceExists(targetNamespace);
  const duplicatedSecret = await store.dispatch('cluster/create', sanitizeSecretForCreate(secret, targetNamespace));

  try {
    await duplicatedSecret.save();
  } catch (error) {
    if (!isAlreadyExistsError(error)) {
      throw error;
    }
  }

  duplicatedAuthSecretKey.value = duplicationKey;
}

function getAuthSecretName(authSecret) {
  if (!authSecret) {
    return '';
  }

  if (typeof authSecret === 'string') {
    return authSecret;
  }

  return authSecret?.metadata?.name || authSecret?.name || '';
}

function getAuthSecretNamespace(authSecret) {
  if (!authSecret) {
    return '';
  }

  if (typeof authSecret !== 'string') {
    return authSecret?.metadata?.namespace || authSecret?.namespace || 'default';
  }

  const selectedSecret = findAuthSecretByName(authSecret);

  return selectedSecret?.metadata?.namespace || 'default';
}

function getAuthSecretRef(authSecret) {
  const name = getAuthSecretName(authSecret);

  if (!name) {
    return null;
  }

  return {
    name,
    namespace: getAuthSecretNamespace(authSecret),
  };
}

async function ensureAuthSecret(namespace = 'default') {
  if (auth.authSecret) {
    const secretName = getAuthSecretName(auth.authSecret);
    const selectedSecret = findAuthSecretByName(secretName);

    if (selectedSecret) {
      await duplicateAuthSecret(selectedSecret, namespace);

      return getAuthSecretRef(selectedSecret);
    }

    return getAuthSecretRef(auth.authSecret);
  }

  if (!secretCreateHook.value) {
    return null;
  }

  const secret = await secretCreateHook.value();

  await duplicateAuthSecret(secret, namespace);

  auth.authSecret = secret;

  return getAuthSecretRef(secret);
}

function canListType(type) {
  const canList = store.getters['cluster/canList'];

  if (typeof canList === 'function') {
    return canList(type);
  }

  return !!canList;
}

function hasAllRequiredRepos() {
  return !!(certManagerRepo.value && runtimeEnforcerRepo.value && csiDriverRepo.value);
}

async function load() {
  if (canListType(CATALOG.CLUSTER_REPO)) {
    await instance?.proxy?.$fetchType?.(CATALOG.CLUSTER_REPO);
  }

  if (hasAllRequiredRepos()) {
    setTimeout(() => {
      installSteps.value[1].ready = true;
      installSteps.value[2].ready = true;
      wizard.value?.goToStep(3, true);
    }, 500);
  } else {
    setTimeout(() => {
      installSteps.value[1].ready = false;
      installSteps.value[2].ready = false;
      wizard.value?.goToStep(1, true);
    }, 500);
  }

  if (!certManagerRepo.value || !controllerChart4CertManager.value) {
    await debouncedRefreshCharts.value(true, CERT_MANAGER_REPOS.CHARTS_REPO_NAME);
  } else if (!csiDriverRepo.value || !controllerChart4CsiDriver.value) {
    await debouncedRefreshCharts.value(true, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME);
  } else if (!runtimeEnforcerRepo.value || !controllerChart4RuntimeEnforcer.value) {
    await debouncedRefreshCharts.value(true, RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME);
  }
}

async function onCombinedWatchedChange([newCertManagerRepo, newCsiDriverRepo, newRuntimeEnforcerRepo], [oldCertManagerRepo, oldCsiDriverRepo, oldRuntimeEnforcerRepo]) {
  let stepNum = 1;

  await nextTick();
  if (newCertManagerRepo !== oldCertManagerRepo || newCsiDriverRepo !== oldCsiDriverRepo || newRuntimeEnforcerRepo !== oldRuntimeEnforcerRepo) {
    if (newCertManagerRepo && newRuntimeEnforcerRepo && newCsiDriverRepo) {
      stepNum = 3;
    } else {
      stepNum = 1;
    }

    maxStepNum.value = stepNum;
    wizard.value?.goToStep(stepNum, true);
  }
}

async function continueWithGlobalRepoAuth() {
  if (!auth.authSecret) {
    if (!secretCreateHook.value) {
      return;
    }

    await secretCreateHook.value();
  }

  installSteps.value[0].ready = true;
  wizard.value?.goToStep(2);
}

async function addAllRepositories(btnCb) {
  const certAdded = certManagerRepo.value ? true : await addRepository4CertManager(btnCb);
  const hasCsiDriverTargetRepo = !!findRepoByUrlOrName(CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO);
  const csiDriverAdded = hasCsiDriverTargetRepo ? true : await addRepository4CsiDriver(btnCb);
  const runtimeEnforcerAdded = runtimeEnforcerRepo.value ? true : await addRepository4RuntimeEnforcer(btnCb);

  if (!(certAdded && csiDriverAdded && runtimeEnforcerAdded)) {
    return;
  }

  if (canListType(CATALOG.CLUSTER_REPO)) {
    await instance?.proxy?.$fetchType?.(CATALOG.CLUSTER_REPO);
  }

  await nextTick();

  if (hasAllRequiredRepos()) {
    installSteps.value[1].ready = true;
    wizard.value?.goToStep(3);
  }

  if (!certManagerRepo.value || !controllerChart4CertManager.value) {
    await debouncedRefreshCharts.value(false, CERT_MANAGER_REPOS.CHARTS_REPO_NAME);
  } else if (!csiDriverRepo.value || !controllerChart4CsiDriver.value) {
    await debouncedRefreshCharts.value(false, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME);
  } else if (!runtimeEnforcerRepo.value || !controllerChart4RuntimeEnforcer.value) {
    await debouncedRefreshCharts.value(false, RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME);
  }
}

async function addRepository4CertManager(btnCb) {
  if (certManagerRepo.value) {
    return true;
  }

  try {
    const authSecretRef = await ensureAuthSecret(resolveNamespace(certManagerNamespace.value));
    const certManagerRepoObj = await store.dispatch('cluster/create', {
      type:     CATALOG.CLUSTER_REPO,
      metadata: { name: CERT_MANAGER_REPOS.CHARTS_REPO_NAME },
      spec:     {
        url:                   CERT_MANAGER_REPOS.CHARTS_REPO,
        clientSecret:          authSecretRef,
        insecurePlainHttp:     auth.insecurePlainHttp,
        insecureSkipTLSVerify: auth.insecureSkipTLSVerify,
      },
    });

    try {
      await certManagerRepoObj.save();
    } catch (e) {
      handleGrowl({
        error: e,
        store,
      });
      if (btnCb) {
        btnCb(false);
      }

      return false;
    }

    return true;
  } catch (e) {
    handleGrowl({ error: e, store });
    if (btnCb) {
      btnCb(false);
    }

    return false;
  }
}

async function addRepository4CsiDriver(btnCb) {
  const existingCsiDriverRepo = findRepoByUrlOrName(CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO);

  if (existingCsiDriverRepo) {
    return true;
  }

  try {
    const authSecretRef = await ensureAuthSecret(resolveNamespace(csiDriverNamespace.value));
    const approverRepoObj = await store.dispatch('cluster/create', {
      type:     CATALOG.CLUSTER_REPO,
      metadata: { name: CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME },
      spec:     {
        url:                   CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO,
        clientSecret:          authSecretRef,
        insecurePlainHttp:     auth.insecurePlainHttp,
        insecureSkipTLSVerify: auth.insecureSkipTLSVerify,
      },
    });

    try {
      await approverRepoObj.save();
    } catch (e) {
      handleGrowl({
        error: e,
        store,
      });
      if (btnCb) {
        btnCb(false);
      }

      return false;
    }

    return true;
  } catch (e) {
    handleGrowl({ error: e, store });
    if (btnCb) {
      btnCb(false);
    }

    return false;
  }
}

async function addRepository4RuntimeEnforcer(btnCb) {
  if (runtimeEnforcerRepo.value) {
    return true;
  }

  try {
    const authSecretRef = await ensureAuthSecret(resolveNamespace(runtimeEnforcerNamespace.value));
    const runtimeEnforcerRepoObj = await store.dispatch('cluster/create', {
      type:     CATALOG.CLUSTER_REPO,
      metadata: { name: RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME },
      spec:     {
        url:                   RUNTIME_ENFORCER_REPOS.CHARTS_REPO,
        clientSecret:          authSecretRef,
        insecurePlainHttp:     auth.insecurePlainHttp,
        insecureSkipTLSVerify: auth.insecureSkipTLSVerify,
      },
    });

    try {
      await runtimeEnforcerRepoObj.save();
    } catch (e) {
      handleGrowl({
        error: e,
        store,
      });
      if (btnCb) {
        btnCb(false);
      }

      return false;
    }

    return true;
  } catch (e) {
    handleGrowl({ error: e, store });
    if (btnCb) {
      btnCb(false);
    }

    return false;
  }
}

async function ensureNamespaceExists(namespaceName) {
  try {
    const targetStore = store.getters['currentProduct']?.inStore || 'cluster';
    const existingNamespace = store.getters[`${ targetStore }/byId`]?.(NAMESPACE_TYPE, namespaceName);

    if (existingNamespace) {
      return;
    }

    const namespaceObj = await store.dispatch('cluster/create', {
      type:     NAMESPACE_TYPE,
      metadata: { name: namespaceName },
    });

    await namespaceObj.save();
  } catch (error) {
    if (!error?.message?.includes('already exists')) {
      handleGrowl({ error, store });
    }
  }
}

async function refreshCsiDriverInstallState() {
  const appType = CATALOG.APP;

  if (!appType) {
    hasCsiDriverInstalled.value = false;

    return;
  }

  try {
    const apps = await store.dispatch(`${ inStore.value }/findAll`, { type: appType }) || [];

    hasCsiDriverInstalled.value = apps.some((app) => {
      const chartName = app?.spec?.chart?.metadata?.name || app?.spec?.chart?.name;
      const appName = app?.metadata?.name;

      return chartName === CERT_MANAGER_CSI_DRIVER.CHART_NAME || appName === CERT_MANAGER_CSI_DRIVER.CHART_NAME;
    });
  } catch {
    hasCsiDriverInstalled.value = false;
  }
}

async function chartRoute() {
  await refreshCsiDriverInstallState();

  if (!controllerChart4RuntimeEnforcer.value && !controllerChart4CsiDriver.value && !controllerChart4CertManager.value) {
    try {
      if (!controllerChart4CertManager.value) {
        await debouncedRefreshCharts.value(false, CERT_MANAGER_REPOS.CHARTS_REPO_NAME);
      } else if (!controllerChart4CsiDriver.value) {
        await debouncedRefreshCharts.value(false, CERT_MANAGER_CSI_DRIVER_REPOS.CHARTS_REPO_NAME);
      } else if (!controllerChart4RuntimeEnforcer.value) {
        await debouncedRefreshCharts.value(false, RUNTIME_ENFORCER_REPOS.CHARTS_REPO_NAME);
      }
    } catch (e) {
      handleGrowl({
        error: e,
        store,
      });

      return;
    }
  }

  if (!hasCertManagerSchema.value) {
    try {
      const {
        repoType, repoName, chartName, versions
      } = controllerChart4CertManager.value;

      const latestChartVersion = getLatestVersion(store, versions);

      if (latestChartVersion) {
        const query = {
          [REPO_TYPE]: repoType,
          [REPO]:      repoName,
          [CHART]:     chartName,
          [VERSION]:   latestChartVersion,
          [NAMESPACE]: certManagerNamespace.value
        };

        await ensureNamespaceExists(certManagerNamespace.value);
        instance?.proxy?.$router?.push({
          name:   'c-cluster-apps-charts-install',
          params: { cluster: currentCluster.value?.id || '_' },
          query,
        });
      } else {
        handleGrowl({
          error: {
            _statusText: 'Chart Version Error',
            message:     'Unable to resolve latest cert-manager chart version.'
          },
          store,
        });
      }
    } catch {
      installSteps.value[0].ready = false;
      wizard.value?.goToStep(1);
    }
  } else if (!hasCsiDriverInstalled.value) {
    try {
      const {
        repoType, repoName, chartName, versions
      } = controllerChart4CsiDriver.value;

      const latestChartVersion = getLatestVersion(store, versions);

      if (latestChartVersion) {
        const query = {
          [REPO_TYPE]: repoType,
          [REPO]:      repoName,
          [CHART]:     chartName,
          [VERSION]:   latestChartVersion,
          [NAMESPACE]: csiDriverNamespace.value
        };

        await ensureNamespaceExists(csiDriverNamespace.value);
        instance?.proxy?.$router?.push({
          name:   'c-cluster-apps-charts-install',
          params: { cluster: currentCluster.value?.id || '_' },
          query,
        });
      } else {
        handleGrowl({
          error: {
            _statusText: 'Chart Version Error',
            message:     'Unable to resolve latest cert-manager-csi-driver chart version.'
          },
          store,
        });
      }
    } catch {
      installSteps.value[1].ready = false;
      wizard.value?.goToStep(2);
    }
  } else if (!hasRuntimeEnforcerSchema.value) {
    try {
      const {
        repoType, repoName, chartName, versions
      } = controllerChart4RuntimeEnforcer.value;

      const latestChartVersion = getLatestVersion(store, versions);

      if (latestChartVersion) {
        const query = {
          [REPO_TYPE]: repoType,
          [REPO]:      repoName,
          [CHART]:     chartName,
          [VERSION]:   latestChartVersion,
          name:        RUNTIME_ENFORCER_REPOS.INSTALLATION_NAME,
          [NAMESPACE]: runtimeEnforcerNamespace.value
        };

        await ensureNamespaceExists(runtimeEnforcerNamespace.value);
        instance?.proxy?.$router?.push({
          name:   'c-cluster-apps-charts-install',
          params: { cluster: currentCluster.value?.id || '_' },
          query,
        });
      } else {
        handleGrowl({
          error: {
            _statusText: 'Chart Version Error',
            message:     'Unable to resolve latest runtime-enforcer chart version.'
          },
          store,
        });
      }
    } catch {
      installSteps.value[1].ready = false;
      wizard.value?.goToStep(2);
    }
  }
}

function onFileSelected(value) {
  auth.caBundle = value;
}

function registerSecretHook(hookFunction) {
  secretCreateHook.value = hookFunction;
}

function onAuthInputChange({ publicKey, privateKey } = {}) {
  auth.username = publicKey || '';
  auth.password = privateKey || '';
}

watch(() => auth.authSecret, onAuthSecretChanged);
watch(certManagerNamespace, onNamespaceInputsChanged);
watch(csiDriverNamespace, onNamespaceInputsChanged);
watch(runtimeEnforcerNamespace, onNamespaceInputsChanged);
watch(combinedWatchedValues, onCombinedWatchedChange);

onMounted(async() => {
  isLoading.value = true;

  debouncedRefreshCharts.value = debounce(async(init = false, chartName) => {
    await refreshCharts({
      store,
      chartName,
      init
    });
  }, 500);

  try {
    await store.dispatch(`${ inStore.value }/findAll`, { type: SECRET });
  } catch {
    // Best-effort fetch for available secrets.
  }

  const allGetter = store.getters[`${ inStore.value }/all`];

  allSecrets.value = typeof allGetter === 'function' ? allGetter(SECRET) : [];
  await refreshCsiDriverInstallState();

  await load();
  isLoading.value = false;
});
</script>

<template>
  <Loading v-if="isLoading" />
  <div
    v-else
    class="container"
  >
    <div
      v-if="!install && !certManagerRepo && !csiDriverRepo && !runtimeEnforcerRepo"
      class="title p-10"
    >
      <h1
        class="mb-20"
        data-testid="re-install-title"
      >
        {{ t('runtimeEnforcer.installationWizard.entry.title') }}
      </h1>
      <div class="description">
        {{ t('runtimeEnforcer.installationWizard.entry.description') }}
      </div>
      <button
        class="btn role-primary mt-20"
        data-testid="re-initial-install-button"
        @click="install = true"
      >
        {{ t('runtimeEnforcer.installationWizard.button.start') }}
      </button>
    </div>

    <div v-else>
      <template style="display: flex">
        <InstallWizard
          ref="wizard"
          :init-step-index="initStepIndex"
          :steps="installSteps"
          data-testid="re-install-wizard"
          style="width: 100%;"
        >
          <template #globalRepoAuth>
            <h2
              class="mt-20 mb-10"
              data-testid="re-repo-title"
            >
              {{ t('runtimeEnforcer.installationWizard.globalRepoAuth.title') }}
            </h2>
            <p class="mb-20">
              {{ t('runtimeEnforcer.installationWizard.globalRepoAuth.description') }}
            </p>
            <SelectOrCreateAuthSecret
              class="mt-16 create-secret-banner"
              v-model:value="auth.authSecret"
              :mode="mode"
              data-testid="appco-secret"
              :register-before-hook="registerSecretHook"
              :limit-to-namespace="false"
              :namespace="'default'"
              :in-store="inStore"
              :allow-ssh="false"
              generate-name="appco-auth-"
              :cache-secrets="true"
              @inputauthval="onAuthInputChange"
            />

            <div class="ca-bundle-section mt-16">
              <LabeledInput
                v-model:value="auth.caBundle"
                type="multiline"
                :label="t('runtimeEnforcer.installationWizard.globalRepoAuth.caBundle')"
                style="max-height: 110px; overflow-y: auto;"
                :placeholder="t('runtimeEnforcer.installationWizard.globalRepoAuth.caBundlePlaceholder')"
              />
              <div class="mt-16">
                <FileSelector
                  class="btn btn-sm role-tertiary"
                  :label="t('runtimeEnforcer.installationWizard.globalRepoAuth.readFromFile')"
                  @selected="onFileSelected"
                />
              </div>
            </div>

            <div class="row create-secret-banner mb-16 mt-20">
              <Checkbox
                v-model:value="auth.insecureSkipTLSVerify"
                class="mt-10"
                :mode="mode"
                :label="t('runtimeEnforcer.installationWizard.globalRepoAuth.skipTlsVerification')"
                data-testid="appco-oci-skip-tls-checkbox"
              />
              <Checkbox
                v-model:value="auth.insecurePlainHttp"
                class="mt-10"
                :mode="mode"
                :label="t('runtimeEnforcer.installationWizard.globalRepoAuth.allowPlainHttp')"
                data-testid="appco-oci-insecure-plain-http"
              />
            </div>

            <div class="namespaces-section mt-20 mb-20">
              <h3 class="mb-10">{{ t('runtimeEnforcer.installationWizard.globalRepoAuth.secretNamespaces') }}</h3>
              <p class="mb-16 text-muted">{{ t('runtimeEnforcer.installationWizard.globalRepoAuth.secretNamespacesDescription') }}</p>
              <div class="namespace-inputs">
                <LabeledInput
                  v-model:value="certManagerNamespace"
                  :label="t('runtimeEnforcer.installationWizard.namespaces.certManager')"
                  :placeholder="t('runtimeEnforcer.installationWizard.placeholders.certManagerNamespace')"
                />
                <LabeledInput
                  v-model:value="csiDriverNamespace"
                  :label="t('runtimeEnforcer.installationWizard.namespaces.csiDriver')"
                  :placeholder="t('runtimeEnforcer.installationWizard.placeholders.certManagerNamespace')"
                />
                <LabeledInput
                  v-model:value="runtimeEnforcerNamespace"
                  :label="t('runtimeEnforcer.installationWizard.namespaces.runtimeEnforcer')"
                  :placeholder="t('runtimeEnforcer.installationWizard.placeholders.runtimeEnforcerNamespace')"
                />
              </div>
            </div>
            <button
              class="btn role-primary"
              :disabled="isContinueDisabled"
              data-testid="re-continue-button"
              @click="continueWithGlobalRepoAuth"
            >
              {{ t('runtimeEnforcer.installationWizard.button.continue') }}
            </button>
          </template>

          <template #repositories>
            <h2
              class="mt-20 mb-10"
              data-testid="re-repo-title"
            >
              {{ t('runtimeEnforcer.installationWizard.repositories.title') }}
            </h2>
            <p class="mb-20">
              {{ t('runtimeEnforcer.installationWizard.repositories.description') }}
            </p>
            <AsyncButton
              mode="allRepositories"
              data-testid="re-repo-add-button"
              @click="addAllRepositories"
            />
          </template>

          <template #install>
            <div v-if="!hasCertManagerSchema">
              <h2
                class="mt-20 mb-10 text-center"
                data-testid="re-app-install-title"
              >
                {{ t('runtimeEnforcer.installationWizard.install.certManager') }}
              </h2>
              <p class="mb-20">
                {{ t("runtimeEnforcer.installationWizard.install.certManagerDescription") }}
              </p>
            </div>
            <div v-else-if="!hasCsiDriverInstalled">
              <h2
                class="mt-20 mb-10 text-center"
                data-testid="re-app-install-title"
              >
                {{ t('runtimeEnforcer.installationWizard.install.csiDriver') }}
              </h2>
              <p class="mb-20">
                {{ t("runtimeEnforcer.installationWizard.install.csiDriverDescription") }}
              </p>
            </div>
            <div v-else-if="!hasRuntimeEnforcerSchema">
              <h2
                class="mt-20 mb-10 text-center"
                data-testid="re-app-install-title"
              >
                {{ t('runtimeEnforcer.installationWizard.install.runtimeEnforcer') }}
              </h2>
              <p class="mb-20">
                {{ t("runtimeEnforcer.installationWizard.install.runtimeEnforcerDescription") }}
              </p>
            </div>

            <div class="chart-route">
              <Loading
                v-if="areRequiredInstallChartsUnavailable"
                mode="relative"
                class="mt-20"
              />

              <template v-else>
                <button
                  v-if="!hasCertManagerSchema"
                  data-testid="re-app-install-button"
                  class="btn role-primary mt-20"
                  :disabled="!controllerChart4CertManager"
                  @click.prevent="chartRoute"
                >
                  {{ t('runtimeEnforcer.installationWizard.install.certManager') }}
                </button>
                <button
                  v-else-if="!hasCsiDriverInstalled"
                  data-testid="re-app-install-button"
                  class="btn role-primary mt-20"
                  :disabled="!controllerChart4CsiDriver"
                  @click.prevent="chartRoute"
                >
                  {{ t('runtimeEnforcer.installationWizard.install.csiDriver') }}
                </button>
                <button
                  v-else-if="!hasRuntimeEnforcerSchema"
                  data-testid="re-app-install-button"
                  class="btn role-primary mt-20"
                  :disabled="!controllerChart4RuntimeEnforcer"
                  @click.prevent="chartRoute"
                >
                  {{ t('runtimeEnforcer.installationWizard.install.runtimeEnforcerButton') }}
                </button>
              </template>
            </div>
          </template>
        </InstallWizard>
      </template>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.container {
  width: 100%;

  & .title {
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    margin: 100px 0;
  }

  & .description {
    line-height: 20px;
  }

  & .chart-route {
    position: relative;
  }
}

.create-secret-banner, .ca-bundle-section, .namespaces-section {
  width: 100%
}

.namespaces-section {
  & h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--body-text, #333);
  }

  & .text-muted {
    font-size: 12px;
    color: var(--text-muted, #666);
    margin-bottom: 16px;
  }

  & .namespace-inputs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }
}

.mt-16 { margin-top: 16px; }
.mt-20 { margin-top: 20px; }
.mb-10 { margin-bottom: 10px; }
.mb-16 { margin-bottom: 16px; }
.mb-20 { margin-bottom: 20px; }
</style>
