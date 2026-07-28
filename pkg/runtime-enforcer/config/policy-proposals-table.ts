import type { WorkloadPolicyProposal } from '@runtime-enforcer/types';

export const FIGMA_COLUMN_WIDTH = {
  policy:       289,
  namespace:    240,
  workload:     150,
  workloadType: 160,
  containers:   130,
  executables:  130,
  age:          100,
  promote:      100,
  frontPlaceholder: 30,
  container:    200,
  image:        200,
  executableCount: 120,
  mode: 120,
  status: 120,
  violations: 100,
  occurrences: 120,
};

type HeaderBuilderInput = {
    canPromote: boolean;
};

export function getPolicyProposalHeaders(input: HeaderBuilderInput) {
  const baseColumns = [
    {
      name:     'policy',
      labelKey: 'runtimeEnforcer.policyProposals.columns.policy',
      value:    'metadata.name',
      sort:     'metadata.name',
      formatter: 'PolicyProposalRouteLink',
      width:    FIGMA_COLUMN_WIDTH.policy,
    },
    {
      name:      'namespace',
      labelKey:  'runtimeEnforcer.policyProposals.columns.namespace',
      value:     'metadata.namespace',
      sort:      'metadata.namespace',
      formatter: 'NamespaceRouteLink',
      width:     FIGMA_COLUMN_WIDTH.namespace,
    },
    {
      name:     'workload',
      labelKey: 'runtimeEnforcer.policyProposals.columns.workload',
      value:    'metadata.ownerReferences.0.name',
      sort:     'metadata.ownerReferences.0.name',
      formatter: 'WorkloadRouteLink',
      width:    FIGMA_COLUMN_WIDTH.workload,
    },
    {
      name:     'workloadType',
      labelKey: 'runtimeEnforcer.policyProposals.columns.workloadType',
      value:    'metadata.ownerReferences.0.kind',
      sort:     'metadata.ownerReferences.0.kind',
      width:    FIGMA_COLUMN_WIDTH.workloadType,
    },
    {
      name:     'containers',
      labelKey: 'runtimeEnforcer.policyProposals.columns.containers',
      value:    'containerCount',
      sort:     'containerCount',
      width:    FIGMA_COLUMN_WIDTH.containers,
    },
    {
      name:     'executables',
      labelKey: 'runtimeEnforcer.policyProposals.columns.executables',
      value:    'executableCount',
      sort:     'executableCount',
      width:    FIGMA_COLUMN_WIDTH.executables,
    },
    {
      name:     'age',
      labelKey: 'runtimeEnforcer.policyProposals.columns.age',
      value:    'metadata.creationTimestamp',
      sort:     'metadata.creationTimestamp:desc',
      formatter: 'AgeValue',
      width:    FIGMA_COLUMN_WIDTH.age,
    },
  ];

  if (input.canPromote) {
    return [
      ...baseColumns,
      {
        name:     'promote',
        label:    '\u00A0',
        value:    'promote',
        formatter: 'PromoteButton',
        sort:     false,
        width:    FIGMA_COLUMN_WIDTH.promote,
      },
    ];
  }

  return baseColumns;
}

export function getContainerTableHeaders() {
  return [
    {
      name:   'frontPlaceholder',
      value:  '',
      label:  '\u00A0',
      width:  FIGMA_COLUMN_WIDTH.frontPlaceholder,
      sort:   false,
      search: false,
    },
    {
      name:  'container',
      value: 'container',
      labelKey: 'runtimeEnforcer.policyProposal.containers.table.container',
      sort:  'container',
      width: FIGMA_COLUMN_WIDTH.container,
    },
    {
      name:  'image',
      value: 'image',
      labelKey: 'runtimeEnforcer.policyProposal.containers.table.image',
      sort:  'image',
      width: FIGMA_COLUMN_WIDTH.image,
    },
    {
      name:  'executableCount',
      value: 'executableCount',
      labelKey: 'runtimeEnforcer.policyProposal.containers.table.executables',
      sort:  'executableCount',
      width: FIGMA_COLUMN_WIDTH.executableCount,
    },
    {
      name:   'executables',
      value:  'executables',
      label:  '\u00A0',
      formatter: 'ExecutableLabels',
      sort:   false,
      search: false,
    },
  ];
}


export function getActivePoliciesHeaders() {
  return [
    {
      name:     'policy',
      labelKey: 'runtimeEnforcer.activePolicies.columns.policy',
      value:    'metadata.name',
      sort:     'metadata.name',
      formatter: 'ActivePoliciesRouteLink',
      width:    FIGMA_COLUMN_WIDTH.policy,
    },
    {
      name:      'namespace',
      labelKey:  'runtimeEnforcer.activePolicies.columns.namespace',
      value:     'metadata.namespace',
      sort:      'metadata.namespace',
      formatter: 'NamespaceRouteLink',
      width:     FIGMA_COLUMN_WIDTH.namespace,
    },
    {
      name:     'workload',
      labelKey: 'runtimeEnforcer.activePolicies.columns.workload',
      value:    'metadata.ownerReferences.0.name',
      sort:     'metadata.ownerReferences.0.name',
      formatter: 'WorkloadRouteLink',
      width:    FIGMA_COLUMN_WIDTH.workload,
    },
    {
      name:     'workloadType',
      labelKey: 'runtimeEnforcer.activePolicies.columns.workloadType',
      value:    'metadata.ownerReferences.0.kind',
      sort:     'metadata.ownerReferences.0.kind',
      width:    FIGMA_COLUMN_WIDTH.workloadType,
    },
    {
      name:     'mode',
      labelKey: 'runtimeEnforcer.activePolicies.columns.mode',
      value:    'spec.mode',
      sort:     'spec.mode',
      formatter: 'ModeValue',
      width:    FIGMA_COLUMN_WIDTH.mode,
    },
    {
      name:     'status',
      labelKey: 'runtimeEnforcer.activePolicies.columns.status',
      value:    'status.phase',
      sort:     'status.phase',
      formatter: 'StatusBadge',
      width:    FIGMA_COLUMN_WIDTH.status,
    },
    {
      name:     'violations',
      labelKey: 'runtimeEnforcer.activePolicies.columns.violations',
      value:    'violationCount',
      sort:     'violationCount',
      width:    FIGMA_COLUMN_WIDTH.violations,
    },
    {
      name:     'occurrences',
      labelKey: 'runtimeEnforcer.activePolicies.columns.occurrences',
      value:    'status.observedGeneration',
      sort:     'status.observedGeneration',
      width:    FIGMA_COLUMN_WIDTH.occurrences,
    },
  ];
}