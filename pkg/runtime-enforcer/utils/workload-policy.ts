import { POLICY_LABEL_KEY } from '../types/runtime-enforcer';

export function getBoundPolicyName(row: any): string {
  const cronJobTemplate = row?.spec?.jobTemplate?.spec?.template;
  // Check standard workload template (Deployment, DaemonSet, StatefulSet, ReplicaSet, Job)
  const workloadTemplate = row?.spec?.template;
  // Fallback to top-level metadata labels (direct Pods or inherited top labels)
  const templateLabels = cronJobTemplate?.metadata?.labels || workloadTemplate?.metadata?.labels;
  const topLabels = row?.metadata?.labels;

  return templateLabels?.[POLICY_LABEL_KEY] || topLabels?.[POLICY_LABEL_KEY] || '';
}

export function findBoundPolicy(row: any, policies: any[]): any | null {
  const policyName = getBoundPolicyName(row);
  const namespace = row?.metadata?.namespace;

  if (!policyName || !namespace || !Array.isArray(policies)) {
    return null;
  }

  return policies.find((p) => p?.metadata?.name === policyName && p?.metadata?.namespace === namespace) || null;
}

export function getRuntimeSecurityValue(row: any): string {
  if (row.runtimeSecuritySortValue !== undefined) {
    return row.runtimeSecuritySortValue;
  }
  return getBoundPolicyName(row);
}