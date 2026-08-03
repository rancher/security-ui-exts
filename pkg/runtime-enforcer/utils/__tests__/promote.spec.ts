import { POLICY_MODE } from '../../types/runtime-enforcer';

import { snapshotProposal, applyPromoteLabel, applyWorkloadPolicyLabel } from '../promote';

describe('snapshotProposal', () => {
  it('extracts namespace, name, workload name and owner steve type from a resource', () => {
    const resource = {
      metadata:               { namespace: 'ns-1', name: 'proposal-1' },
      workload:               'my-deployment',
      ownerWorkloadSteveType: 'apps.deployment',
    };

    expect(snapshotProposal(resource)).toEqual({
      namespace:              'ns-1',
      name:                   'proposal-1',
      workloadName:           'my-deployment',
      ownerWorkloadSteveType: 'apps.deployment',
    });
  });

  it('gracefully handles a resource missing metadata/workload fields', () => {
    expect(snapshotProposal({})).toEqual({
      namespace:              undefined,
      name:                   undefined,
      workloadName:           undefined,
      ownerWorkloadSteveType: undefined,
    });
  });

  it('gracefully handles undefined/null resource', () => {
    expect(snapshotProposal(undefined)).toEqual({
      namespace:              undefined,
      name:                   undefined,
      workloadName:           undefined,
      ownerWorkloadSteveType: undefined,
    });
  });
});

describe('applyPromoteLabel', () => {
  it('sets the promote label to the target mode and saves the resource', async() => {
    const resource: any = {
      metadata: { labels: { existing: 'label' } },
      save:     jest.fn().mockResolvedValue(undefined),
    };

    await applyPromoteLabel(resource, POLICY_MODE.PROTECT);

    expect(resource.metadata.labels).toEqual({
      existing:                      'label',
      'security.rancher.io/promote': POLICY_MODE.PROTECT,
    });
    expect(resource.save).toHaveBeenCalledTimes(1);
  });

  it('creates metadata/labels objects when missing', async() => {
    const resource: any = { save: jest.fn().mockResolvedValue(undefined) };

    await applyPromoteLabel(resource, POLICY_MODE.MONITOR);

    expect(resource.metadata.labels['security.rancher.io/promote']).toBe(POLICY_MODE.MONITOR);
    expect(resource.save).toHaveBeenCalledTimes(1);
  });
});

describe('applyWorkloadPolicyLabel', () => {
  const baseSnapshot = {
    namespace:              'ns-1',
    name:                   'proposal-1',
    workloadName:           'my-deployment',
    ownerWorkloadSteveType: 'apps.deployment',
  };

  it.each([
    ['namespace', { ...baseSnapshot, namespace: undefined }],
    ['name', { ...baseSnapshot, name: undefined }],
    ['workloadName', { ...baseSnapshot, workloadName: undefined }],
    ['ownerWorkloadSteveType', { ...baseSnapshot, ownerWorkloadSteveType: undefined }],
  ])('returns early without dispatching when %s is missing', async(_field, snapshot) => {
    const store: any = { dispatch: jest.fn() };

    await applyWorkloadPolicyLabel(store, snapshot as any);

    expect(store.dispatch).not.toHaveBeenCalled();
  });

  it('returns early when the workload cannot be found', async() => {
    const store: any = { dispatch: jest.fn().mockResolvedValue(undefined) };

    await applyWorkloadPolicyLabel(store, baseSnapshot);

    expect(store.dispatch).toHaveBeenCalledWith('cluster/find', {
      type: 'apps.deployment',
      id:   'ns-1/my-deployment',
    });
  });

  it('returns early when the workload has no pod template', async() => {
    const workload = { spec: {}, save: jest.fn() };
    const store: any = { dispatch: jest.fn().mockResolvedValue(workload) };

    await applyWorkloadPolicyLabel(store, baseSnapshot);

    expect(workload.save).not.toHaveBeenCalled();
  });

  it('sets the policy label on spec.template for standard workloads and saves', async() => {
    const workload: any = { spec: { template: {} }, save: jest.fn().mockResolvedValue(undefined) };
    const store: any = { dispatch: jest.fn().mockResolvedValue(workload) };

    await applyWorkloadPolicyLabel(store, baseSnapshot);

    expect(workload.spec.template.metadata.labels['security.rancher.io/policy']).toBe('proposal-1');
    expect(workload.save).toHaveBeenCalledTimes(1);
  });

  it('sets the policy label on spec.jobTemplate.spec.template for CronJobs and saves', async() => {
    const workload: any = { spec: { jobTemplate: { spec: { template: {} } } }, save: jest.fn().mockResolvedValue(undefined) };
    const store: any = { dispatch: jest.fn().mockResolvedValue(workload) };

    await applyWorkloadPolicyLabel(store, { ...baseSnapshot, ownerWorkloadSteveType: 'batch.cronjob' });

    expect(workload.spec.jobTemplate.spec.template.metadata.labels['security.rancher.io/policy']).toBe('proposal-1');
    expect(workload.save).toHaveBeenCalledTimes(1);
  });

  it('preserves existing pod template labels when adding the policy label', async() => {
    const workload: any = {
      spec: { template: { metadata: { labels: { app: 'my-deployment' } } } },
      save: jest.fn().mockResolvedValue(undefined),
    };
    const store: any = { dispatch: jest.fn().mockResolvedValue(workload) };

    await applyWorkloadPolicyLabel(store, baseSnapshot);

    expect(workload.spec.template.metadata.labels).toEqual({
      app:                          'my-deployment',
      'security.rancher.io/policy': 'proposal-1',
    });
  });
});

