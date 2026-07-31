export const PRODUCT_NAME = 'runtimeEnforcer';

export const CHART_REGISTRY_URL = 'oci://dp.apps.rancher.io/charts';
export const DOCKER_CONFIG_JSON_TYPE = '.dockerconfigjson';

export const RESOURCE = {
  POLICY_PROPOSALS: 'security.rancher.io.workloadpolicyproposal',
  ACTIVE_POLICIES:  'security.rancher.io.workloadpolicy',
};

export const EXEC_SOURCE = {
  LEARNED: 'learned',
  MANUAL:  'manual',
} as const;

export type ExecSource = typeof EXEC_SOURCE[keyof typeof EXEC_SOURCE];

export interface ExecutableItem {
  path: string;
  source: ExecSource;
}

export const WORKLOAD_POLICY_KIND = 'WorkloadPolicy';

export const POLICY_MODE = {
  MONITOR: 'monitor',
  PROTECT: 'protect',
};

export interface WorkloadPolicyProposalOwnerReference {
  apiVersion?: string;
  blockOwnerDeletion?: boolean;
  controller?: boolean;
  kind?: string;
  name?: string;
  uid?: string;
}

export interface WorkloadPolicyProposalMetadata {
  creationTimestamp?: string;
  generation?: number;
  name?: string;
  namespace?: string;
  ownerReferences?: WorkloadPolicyProposalOwnerReference[];
  resourceVersion?: string;
  uid?: string;
}

export interface WorkloadPolicyProposalExecutableRules {
  allowed?: string[];
}

export interface WorkloadPolicyProposalContainerRules {
  executables?: WorkloadPolicyProposalExecutableRules;
}

export interface WorkloadPolicyProposalSpec {
  rulesByContainer?: Record<string, WorkloadPolicyProposalContainerRules>;
}

export interface WorkloadPolicyProposal {
  id?: string;
  apiVersion?: string;
  kind?: string;
  metadata?: WorkloadPolicyProposalMetadata;
  spec?: WorkloadPolicyProposalSpec;
}

export interface WorkloadPolicyIssue {
  code?: string;
  message?: string;
}

export interface WorkloadPolicyViolation {
  timestamp?: string;
  action?: string;
  nodeName?: string;
  podName?: string;
  containerName?: string;
  executablePath?: string;
}

export interface WorkloadPolicyStatus {
  observedGeneration?: number;
  phase?: string;
  totalNodes?: number;
  successfulNodes?: number;
  transitioningNodes?: number;
  failedNodes?: number;
  nodesTransitioning?: string[];
  nodesWithIssues?: Record<string, WorkloadPolicyIssue>;
  violationCount?: number;
  violations?: WorkloadPolicyViolation[];
}

export interface WorkloadPolicySpec {
  mode?: string;
  rulesByContainer?: Record<string, WorkloadPolicyProposalContainerRules>;
}

export interface WorkloadPolicy {
  id?: string;
  apiVersion?: string;
  kind?: string;
  metadata?: WorkloadPolicyProposalMetadata;
  spec?: WorkloadPolicySpec;
  status?: WorkloadPolicyStatus;
}

export const RUNTIME_ENFORCER = {
  CONTROLLER: 'suse-security-runtime-enforcer',
  CHART_NAME: 'suse-security-runtime-enforcer',
  SCHEMA:     RESOURCE.POLICY_PROPOSALS,
};

export const WORKLOAD_PREFIX_MAP: Record<string, string> = {
  'ds-': 'DaemonSet',
  'ss-': 'StatefulSet',
  'cronjob-': 'CronJob',
  'deployment-': 'Deployment',
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

export const POLICY_STATUS = {
  TRANSITIONING: 'transitioning',
  READY:         'ready',
  FAILED:        'failed',
};

export const DOCUMENTATION_URL = 'https://github.com/rancher-sandbox/runtime-enforcer/tree/main/docs';

export const WORKLOAD_PREFIX = 'security.rancher.io/policy :';

export const POLICY_LABEL_KEY = 'security.rancher.io/policy';

export const PROMOTE_LABEL_KEY = 'security.rancher.io/promote';

export const APPLY_MODE = {
  AUTOMATIC: 'automatic',
  MANUAL:    'manual',
} as const;

export type ApplyMode = typeof APPLY_MODE[keyof typeof APPLY_MODE];