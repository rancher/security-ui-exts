import { waitFor } from '@shell/utils/async';

import {
  RESOURCE, POLICY_MODE, POLICY_LABEL_KEY, PROMOTE_LABEL_KEY, PROMOTE_WATCH_TIMEOUT_MS
} from '../types/runtime-enforcer';

export interface PromoteOptions {
  targetMode: string;
  autoApply: boolean;
}

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

export async function applyPromoteLabel(resource: any): Promise<void> {
  const metadata = resource.metadata ??= {};
  const labels = metadata.labels ??= {};

  labels[PROMOTE_LABEL_KEY] = 'true';

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

export async function watchAndApplyProtectMode(
  store: any,
  snapshot: ProposalSnapshot,
  timeoutMs: number = PROMOTE_WATCH_TIMEOUT_MS
): Promise<void> {
  const { namespace, name } = snapshot;

  if (!namespace || !name) {
    return;
  }

  const policyId = `${ namespace }/${ name }`;

  await store.dispatch('cluster/findAll', { type: RESOURCE.ACTIVE_POLICIES, opt: { watch: true } });

  try {
    await waitFor(() => !!store.getters['cluster/byId'](RESOURCE.ACTIVE_POLICIES, policyId), `policy ${ policyId } to be created`, timeoutMs);
  } catch {
    return;
  }

  const policy = store.getters['cluster/byId'](RESOURCE.ACTIVE_POLICIES, policyId);

  if (!policy) {
    return;
  }

  policy.spec = policy.spec || {};
  policy.spec.mode = POLICY_MODE.PROTECT;

  await policy.save();
}

/**
 * Kicks off the two independent background follow-up actions for a single promoted proposal.
 * Fire-and-forget from the caller's perspective - errors are intentionally swallowed since
 * there's no UI left listening by the time these settle.
 */
export function runPromoteFollowUps(store: any, snapshot: ProposalSnapshot, { targetMode, autoApply }: PromoteOptions): void {
  if (autoApply) {
    applyWorkloadPolicyLabel(store, snapshot).catch(() => {});
  }

  if (targetMode === POLICY_MODE.PROTECT) {
    watchAndApplyProtectMode(store, snapshot).catch(() => {});
  }
}
