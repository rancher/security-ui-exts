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
    it('removes all selected resources and triggers redeploy for each', async() => {
      const push = jest.fn();
      const resources = [createResource('policy-a', 'wk-a'), createResource('policy-b', 'wk-b')];
      const wrapper = mountDialog({ resources, push });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'redeployWorkload').mockResolvedValue(undefined);

      await (wrapper.vm as any).deletePolicies();

      expect(resources[0].remove).toHaveBeenCalledTimes(1);
      expect(resources[1].remove).toHaveBeenCalledTimes(1);
      expect(redeploySpy).toHaveBeenCalledTimes(2);
      expect(redeploySpy).toHaveBeenNthCalledWith(1, resources[0]);
      expect(redeploySpy).toHaveBeenNthCalledWith(2, resources[1]);
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
      expect(push).toHaveBeenCalledWith({
        name:   `c-cluster-${ PRODUCT_NAME }-resource`,
        params: { cluster: 'local', product: PRODUCT_NAME },
      });
      expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('continues when a resource does not expose remove', async() => {
      const resourceWithRemove = createResource('policy-a', 'wk-a');
      const resourceWithoutRemove = {
        nameDisplay:            'policy-b',
        metadata:               { namespace: 'runtime-enforcer', ownerReferences: [{ name: 'wk-b' }] },
        ownerWorkloadSteveType: 'apps.deployment',
      };
      const resources = [resourceWithRemove, resourceWithoutRemove as any];
      const wrapper = mountDialog({ resources });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'redeployWorkload').mockResolvedValue(undefined);

      await (wrapper.vm as any).deletePolicies();

      expect(resourceWithRemove.remove).toHaveBeenCalledTimes(1);
      expect(redeploySpy).toHaveBeenCalledTimes(2);
      expect(redeploySpy).toHaveBeenNthCalledWith(1, resourceWithRemove);
      expect(redeploySpy).toHaveBeenNthCalledWith(2, resourceWithoutRemove);
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
    });

    it('rejects when a remove call fails and keeps deleteInProgress true', async() => {
      const failing = createResource('policy-a', 'wk-a');
      const error = new Error('remove failed');

      failing.remove.mockRejectedValueOnce(error);

      const wrapper = mountDialog({ resources: [failing] });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'redeployWorkload').mockResolvedValue(undefined);

      await expect((wrapper.vm as any).deletePolicies()).rejects.toThrow('remove failed');
      expect(redeploySpy).not.toHaveBeenCalled();
      expect((wrapper.vm as any).deleteInProgress).toBe(true);
    });
  });
});
