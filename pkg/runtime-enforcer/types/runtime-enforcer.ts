export const PRODUCT_NAME = 'runtimeEnforcer';

export const CHART_REGISTRY_URL = 'oci://dp.apps.rancher.io/charts';
export const DOCKER_CONFIG_JSON_TYPE = '.dockerconfigjson';

export const RESOURCE = { POLICY_PROPOSALS: 'security.rancher.io.workloadpolicyproposal' };

export const WORKLOAD_POLICY_KIND = 'WorkloadPolicy';

export const POLICY_MODE = {
  MONITOR: 'monitor',
  PROTECT: 'protect',
};

export const RUNTIME_ENFORCER = {
  CONTROLLER: 'suse-security-runtime-enforcer',
  CHART_NAME: 'suse-security-runtime-enforcer',
  SCHEMA:     RESOURCE.POLICY_PROPOSALS,
};

export const CERT_MANAGER_CSI_DRIVER = {
  CONTROLLER: 'cert-manager-csi-driver',
  CHART_NAME: 'cert-manager-csi-driver',
};

export const CERT_MANAGER = {
  CONTROLLER: 'cert-manager',
  CHART_NAME: 'cert-manager',
  SCHEMA:     'cert-manager.io.certificate',
};

export const RUNTIME_ENFORCER_REPOS = {
  CHARTS_REPO:       `${ CHART_REGISTRY_URL }/suse-security-runtime-enforcer`,
  CHARTS_REPO_NAME:  'suse-security-runtime-enforcer',
  INSTALLATION_NAME: 'ssre',
  NAMESPACE:         'cattle-runtime-enforcer-system',
};

export const CERT_MANAGER_CSI_DRIVER_REPOS = {
  CHARTS_REPO:      `${ CHART_REGISTRY_URL }/cert-manager-csi-driver`,
  CHARTS_REPO_NAME: 'cert-manager-csi-driver',
  NAMESPACE:        'cert-manager',
};

export const CERT_MANAGER_REPOS = {
  CHARTS_REPO:      `${ CHART_REGISTRY_URL }/cert-manager`,
  CHARTS_REPO_NAME: 'cert-manager',
  NAMESPACE:        'cert-manager',
};