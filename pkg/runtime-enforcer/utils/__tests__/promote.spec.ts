import { jest } from '@jest/globals';
import { RESOURCE, POLICY_MODE } from '../../types/runtime-enforcer';

const mockWaitFor = jest.fn();

jest.mock('@shell/utils/async', () => ({ waitFor: (...args: any[]) => mockWaitFor(...args) }));

import {
  snapshotProposal, applyPromoteLabel, applyWorkloadPolicyLabel, watchAndApplyProtectMode, runPromoteFollowUps
} from '../promote';

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

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
  it('sets the promote label and saves the resource', async() => {
    const resource: any = {
      metadata: { labels: { existing: 'label' } },
      save:     jest.fn().mockResolvedValue(undefined),
    };

    await applyPromoteLabel(resource);

    expect(resource.metadata.labels).toEqual({
      existing:                      'label',
      'security.rancher.io/promote': 'true',
    });
    expect(resource.save).toHaveBeenCalledTimes(1);
  });

  it('creates metadata/labels objects when missing', async() => {
    const resource: any = { save: jest.fn().mockResolvedValue(undefined) };

    await applyPromoteLabel(resource);

    expect(resource.metadata.labels['security.rancher.io/promote']).toBe('true');
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

describe('watchAndApplyProtectMode', () => {
  const snapshot = { namespace: 'ns-1', name: 'proposal-1' };
  const policyId = 'ns-1/proposal-1';

  beforeEach(() => {
    mockWaitFor.mockReset();
  });

  it('returns early without dispatching when namespace or name is missing', async() => {
    const store: any = { dispatch: jest.fn(), getters: {} };

    await watchAndApplyProtectMode(store, { namespace: undefined, name: 'proposal-1' });
    await watchAndApplyProtectMode(store, { namespace: 'ns-1', name: undefined });

    expect(store.dispatch).not.toHaveBeenCalled();
    expect(mockWaitFor).not.toHaveBeenCalled();
  });

  it('subscribes to the active policies watch and waits for the policy to appear', async() => {
    const policy = { spec: {}, save: jest.fn().mockResolvedValue(undefined) };
    const store: any = {
      dispatch: jest.fn().mockResolvedValue(undefined),
      getters:  { 'cluster/byId': jest.fn().mockReturnValue(policy) },
    };

    mockWaitFor.mockResolvedValue(undefined);

    await watchAndApplyProtectMode(store, snapshot, 12345);

    expect(store.dispatch).toHaveBeenCalledWith('cluster/findAll', { type: RESOURCE.ACTIVE_POLICIES, opt: { watch: true } });
    expect(mockWaitFor).toHaveBeenCalledWith(expect.any(Function), `policy ${ policyId } to be created`, 12345);

    // Exercise the predicate passed to waitFor to confirm it checks the right getter/id.
    const predicate = mockWaitFor.mock.calls[0][0] as () => boolean;

    expect(predicate()).toBe(true);
    expect(store.getters['cluster/byId']).toHaveBeenCalledWith(RESOURCE.ACTIVE_POLICIES, policyId);
  });

  it('sets the policy to Protect mode and saves once the wait resolves', async() => {
    const policy: any = { spec: {}, save: jest.fn().mockResolvedValue(undefined) };
    const store: any = {
      dispatch: jest.fn().mockResolvedValue(undefined),
      getters:  { 'cluster/byId': jest.fn().mockReturnValue(policy) },
    };

    mockWaitFor.mockResolvedValue(undefined);

    await watchAndApplyProtectMode(store, snapshot);

    expect(policy.spec.mode).toBe(POLICY_MODE.PROTECT);
    expect(policy.save).toHaveBeenCalledTimes(1);
  });

  it('silently returns when the wait times out', async() => {
    const store: any = {
      dispatch: jest.fn().mockResolvedValue(undefined),
      getters:  { 'cluster/byId': jest.fn() },
    };

    mockWaitFor.mockRejectedValue(new Error('timed out'));

    await expect(watchAndApplyProtectMode(store, snapshot)).resolves.toBeUndefined();
    expect(store.getters['cluster/byId']).not.toHaveBeenCalledWith(RESOURCE.ACTIVE_POLICIES, policyId);
  });

  it('silently returns if the policy is missing after the wait resolves', async() => {
    const store: any = {
      dispatch: jest.fn().mockResolvedValue(undefined),
      getters:  { 'cluster/byId': jest.fn().mockReturnValue(undefined) },
    };

    mockWaitFor.mockResolvedValue(undefined);

    await expect(watchAndApplyProtectMode(store, snapshot)).resolves.toBeUndefined();
  });
});

describe('runPromoteFollowUps', () => {
  beforeEach(() => {
    mockWaitFor.mockReset();
  });

  it('applies the workload policy label when autoApply is true', async() => {
    const workload: any = { spec: { template: {} }, save: jest.fn().mockResolvedValue(undefined) };
    const store: any = { dispatch: jest.fn().mockResolvedValue(workload) };
    const snapshot = {
      namespace: 'ns-1', name: 'proposal-1', workloadName: 'my-deployment', ownerWorkloadSteveType: 'apps.deployment',
    };

    runPromoteFollowUps(store, snapshot, { targetMode: POLICY_MODE.MONITOR, autoApply: true });
    await flushPromises();

    expect(store.dispatch).toHaveBeenCalledWith('cluster/find', { type: 'apps.deployment', id: 'ns-1/my-deployment' });
    expect(workload.save).toHaveBeenCalledTimes(1);
  });

  it('does not apply the workload policy label when autoApply is false', async() => {
    const store: any = { dispatch: jest.fn().mockResolvedValue(undefined) };
    const snapshot = {
      namespace: 'ns-1', name: 'proposal-1', workloadName: 'my-deployment', ownerWorkloadSteveType: 'apps.deployment',
    };

    runPromoteFollowUps(store, snapshot, { targetMode: POLICY_MODE.MONITOR, autoApply: false });
    await flushPromises();

    expect(store.dispatch).not.toHaveBeenCalledWith('cluster/find', expect.anything());
  });

  it('watches for and applies Protect mode when targetMode is protect', async() => {
    const policy: any = { spec: {}, save: jest.fn().mockResolvedValue(undefined) };
    const store: any = {
      dispatch: jest.fn().mockResolvedValue(undefined),
      getters:  { 'cluster/byId': jest.fn().mockReturnValue(policy) },
    };
    const snapshot = { namespace: 'ns-1', name: 'proposal-1' };

    mockWaitFor.mockResolvedValue(undefined);

    runPromoteFollowUps(store, snapshot, { targetMode: POLICY_MODE.PROTECT, autoApply: false });
    await flushPromises();

    expect(store.dispatch).toHaveBeenCalledWith('cluster/findAll', { type: RESOURCE.ACTIVE_POLICIES, opt: { watch: true } });
    expect(policy.spec.mode).toBe(POLICY_MODE.PROTECT);
  });

  it('does not watch for Protect mode when targetMode is monitor', async() => {
    const store: any = { dispatch: jest.fn().mockResolvedValue(undefined) };
    const snapshot = { namespace: 'ns-1', name: 'proposal-1' };

    runPromoteFollowUps(store, snapshot, { targetMode: POLICY_MODE.MONITOR, autoApply: false });
    await flushPromises();

    expect(mockWaitFor).not.toHaveBeenCalled();
  });

  it('swallows errors from applyWorkloadPolicyLabel without throwing', async() => {
    const store: any = { dispatch: jest.fn().mockRejectedValue(new Error('boom')) };
    const snapshot = {
      namespace: 'ns-1', name: 'proposal-1', workloadName: 'my-deployment', ownerWorkloadSteveType: 'apps.deployment',
    };

    expect(() => {
      runPromoteFollowUps(store, snapshot, { targetMode: POLICY_MODE.MONITOR, autoApply: true });
    }).not.toThrow();

    await flushPromises();
  });

  it('swallows errors from watchAndApplyProtectMode without throwing', async() => {
    const store: any = { dispatch: jest.fn().mockRejectedValue(new Error('boom')) };
    const snapshot = { namespace: 'ns-1', name: 'proposal-1' };

    expect(() => {
      runPromoteFollowUps(store, snapshot, { targetMode: POLICY_MODE.PROTECT, autoApply: false });
    }).not.toThrow();

    await flushPromises();
  });
});
