import { POLICY_LABEL_KEY, PROMOTE_LABEL_KEY } from '../types/runtime-enforcer';

export interface ProposalSnapshot {
  namespace?: string;
  name?: string;
  workloadName?: string;
  ownerWorkloadSteveType?: string;
}

export function snapshotProposal(resource: any): ProposalSnapshot {
  return {
    namespace:              resource?.metadata?.namespace,
    name:                   resource?.metadata?.name,
    workloadName:           resource?.workload,
    ownerWorkloadSteveType: resource?.ownerWorkloadSteveType,
  };
}

export async function applyPromoteLabel(resource: any, mode: string): Promise<void> {
  const metadata = resource.metadata ??= {};
  const labels = metadata.labels ??= {};

  labels[PROMOTE_LABEL_KEY] = mode;

  await resource.save();
}

export async function applyWorkloadPolicyLabel(store: any, snapshot: ProposalSnapshot): Promise<void> {
  const {
    namespace, name, workloadName, ownerWorkloadSteveType
  } = snapshot;

  if (!namespace || !name || !workloadName || !ownerWorkloadSteveType) {
    return;
  }

  const workload = await store.dispatch('cluster/find', {
    type: ownerWorkloadSteveType,
    id:   `${ namespace }/${ workloadName }`,
  });

  if (!workload) {
    return;
  }

  // CronJob nests its pod template under spec.jobTemplate.spec.template; every other
  // workload type (Deployment/StatefulSet/DaemonSet/Job) exposes it directly at spec.template.
  const podTemplate = workload.spec?.jobTemplate?.spec?.template ?? workload.spec?.template;

  if (!podTemplate) {
    return;
  }

  const metadata = podTemplate.metadata ??= {};
  const labels = metadata.labels ??= {};

  labels[POLICY_LABEL_KEY] = name;

  await workload.save();
}
