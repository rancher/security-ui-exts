import { shallowMount } from '@vue/test-utils';
import DeletePolicyProposalsDialog from '../DeletePolicyProposalsDialog.vue';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { PRODUCT_NAME } from '@runtime-enforcer/types/runtime-enforcer.ts';
import { TIMESTAMP } from '@shell/config/labels-annotations';

jest.mock('@shell/utils/error', () => ({
  exceptionToErrorsArray: jest.fn((err) => [err]),
}));

const t = jest.fn((key, args, raw) => (raw ? `${ key }:${ JSON.stringify(args) }` : key));

const createResource = (name = 'proposal-a', workloadName?: string) => ({
  nameDisplay: name,
  metadata: {
    namespace:       'runtime-enforcer',
    ownerReferences: workloadName ? [{ name: workloadName }] : [],
  },
  ownerWorkloadSteveType: 'apps.deployment',
  remove:                 jest.fn().mockResolvedValue(undefined),
});

const mountDialog = ({
  resources = [createResource('proposal-a', 'nginx')],
  table = null,
  dispatch = jest.fn(),
  push = jest.fn(),
} = {}) => {
  return shallowMount(DeletePolicyProposalsDialog as any, {
    props: { resources, table },
    global: {
      mocks: {
        t,
        $store:  { dispatch },
        $router: { push },
        $route:  { params: { cluster: 'local' } },
      },
    },
  });
};

describe('DeletePolicyProposalsDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computed', () => {
    it('is single and uses single copy for one resource', () => {
      const wrapper = mountDialog({ resources: [createResource('single-policy', 'wk-1')] });

      expect((wrapper.vm as any).isBulk).toBe(false);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.policyProposal.deleteDialog.title.single');
      expect((wrapper.vm as any).bannerText).toBe('runtimeEnforcer.policyProposal.deleteDialog.banner.single');
      expect((wrapper.vm as any).deleteButtonText).toBe('runtimeEnforcer.policyProposal.deleteDialog.delete.single');
      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.policyProposal.deleteDialog.confirm.single:{"name":"single-policy","workload":"wk-1"}'
      );
    });

    it('is bulk and uses bulk copy for multiple resources', () => {
      const wrapper = mountDialog({
        resources: [createResource('a', 'wk-a'), createResource('b', 'wk-b')],
      });

      expect((wrapper.vm as any).isBulk).toBe(true);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.policyProposal.deleteDialog.title.bulk');
      expect((wrapper.vm as any).bannerText).toBe('runtimeEnforcer.policyProposal.deleteDialog.banner.bulk');
      expect((wrapper.vm as any).deleteButtonText).toBe('runtimeEnforcer.policyProposal.deleteDialog.delete.bulk');
      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.policyProposal.deleteDialog.confirm.bulk:{"count":2}'
      );
    });
  });

  describe('close', () => {
    it('emits close', () => {
      const wrapper = mountDialog();

      (wrapper.vm as any).close();

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('resolveTable', () => {
    it('returns deepest inner table when nested refs are present', () => {
      const inner = { availableActions: [] };
      const table = { $refs: { table: { $refs: { table: inner } } } };
      const wrapper = mountDialog({ table });

      expect((wrapper.vm as any).resolveTable()).toEqual(inner);
    });

    it('returns first table ref when only one level is present', () => {
      const mid = { availableActions: [] };
      const table = { $refs: { table: mid } };
      const wrapper = mountDialog({ table });

      expect((wrapper.vm as any).resolveTable()).toEqual(mid);
    });

    it('returns raw table when no refs exist', () => {
      const table = { availableActions: [] };
      const wrapper = mountDialog({ table });

      expect((wrapper.vm as any).resolveTable()).toEqual(table);
    });
  });

  describe('redeployWorkload', () => {
    it('patches workload annotation timestamp, saves workload and closes on success', async() => {
      const save = jest.fn().mockResolvedValue(undefined);
      const workload = { spec: { template: {} }, save };
      const dispatch = jest.fn().mockResolvedValue(workload);
      const wrapper = mountDialog({ dispatch });
      const closeSpy = jest.spyOn(wrapper.vm as any, 'close').mockImplementation(() => undefined);
      const resource = createResource('policy-a', 'deploy-a');

      await (wrapper.vm as any).redeployWorkload(resource);

      expect(dispatch).toHaveBeenCalledWith('cluster/find', {
        type: 'apps.deployment',
        id:   'runtime-enforcer/deploy-a',
      });
      const annotations = workload.spec.template.metadata.annotations;

      expect(typeof annotations[TIMESTAMP]).toBe('string');
      expect(annotations[TIMESTAMP]).toMatch(/Z$/);
      expect(save).toHaveBeenCalled();
      expect(closeSpy).toHaveBeenCalled();
    });

    it('stores formatted errors when workload lookup/save fails', async() => {
      const err = new Error('boom');
      const dispatch = jest.fn().mockRejectedValue(err);
      const wrapper = mountDialog({ dispatch });
      const mockedExceptionToErrorsArray = exceptionToErrorsArray as jest.Mock;

      mockedExceptionToErrorsArray.mockReturnValueOnce(['formatted-error']);

      await (wrapper.vm as any).redeployWorkload(createResource('policy-a', 'deploy-a'));

      expect(mockedExceptionToErrorsArray).toHaveBeenCalledWith(err);
      expect((wrapper.vm as any).errors).toEqual(['formatted-error']);
    });
  });

  describe('deletePolicies', () => {
    it('uses table bulk action when promptRemove action is available', async() => {
      const act = { action: 'promptRemove' };
      const table = {
        availableActions:        [act],
        setBulkActionOfInterest: jest.fn(),
        applyTableAction:        jest.fn(),
      };
      const push = jest.fn();
      const resources = [createResource('policy-a', 'deploy-a')];
      const wrapper = mountDialog({ resources, table, push });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'redeployWorkload').mockResolvedValue(undefined);

      await (wrapper.vm as any).deletePolicies();

      expect(table.setBulkActionOfInterest).toHaveBeenCalledWith(act);
      expect(table.applyTableAction).toHaveBeenCalledWith(act);
      expect(resources[0].remove).not.toHaveBeenCalled();
      expect(redeploySpy).toHaveBeenCalledWith(resources[0]);
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
      expect(push).toHaveBeenCalledWith({
        name:   `c-cluster-${ PRODUCT_NAME }-resource`,
        params: { cluster: 'local', product: PRODUCT_NAME },
      });
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('falls back to direct resource removal when table action API is unavailable', async() => {
      const push = jest.fn();
      const resources = [createResource('policy-a'), createResource('policy-b')];
      const wrapper = mountDialog({ resources, table: null, push });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'redeployWorkload').mockResolvedValue(undefined);

      await (wrapper.vm as any).deletePolicies();

      resources.forEach((resource) => expect(resource.remove).toHaveBeenCalled());
      expect(redeploySpy).not.toHaveBeenCalled();
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
      expect(push).toHaveBeenCalledWith({
        name:   `c-cluster-${ PRODUCT_NAME }-resource`,
        params: { cluster: 'local', product: PRODUCT_NAME },
      });
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('redeploys only resources that have an ownerReference name', async() => {
      const resources = [
        createResource('a', 'wk-a'),
        createResource('b'),
        createResource('c', 'wk-c'),
      ];
      const wrapper = mountDialog({ resources, table: null });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'redeployWorkload').mockResolvedValue(undefined);

      await (wrapper.vm as any).deletePolicies();

      expect(redeploySpy).toHaveBeenCalledTimes(2);
      expect(redeploySpy).toHaveBeenNthCalledWith(1, resources[0]);
      expect(redeploySpy).toHaveBeenNthCalledWith(2, resources[2]);
    });
  });
});
