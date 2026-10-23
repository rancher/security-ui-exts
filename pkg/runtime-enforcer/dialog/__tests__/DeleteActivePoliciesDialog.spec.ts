import { shallowMount } from '@vue/test-utils';
import DeleteActivePoliciesDialog from '../DeleteActivePoliciesDialog.vue';
import { PRODUCT_NAME } from '@runtime-enforcer/types/runtime-enforcer.ts';
import { waitFor } from '@shell/utils/async';
import { POLICY_LABEL_KEY } from '@runtime-enforcer/types';

jest.mock('@shell/components/Resource/Detail/CopyToClipboard.vue', () => ({
  __esModule: true,
  default:    { name: 'CopyToClipboard', template: '<div />' },
}));

jest.mock('@shell/utils/async', () => ({ waitFor: jest.fn().mockResolvedValue(undefined) }));

jest.mock('@shell/utils/error', () => ({ exceptionToErrorsArray: jest.fn((err) => [err]) }));

const t = jest.fn((key, args, raw) => (raw ? `${ key }:${ JSON.stringify(args) }` : key));

const createResource = (name = 'policy-a', workloadName = 'wk-a') => ({
  nameDisplay: name,
  metadata:    {
    uid:             `${ name }-uid`,
    name,
    namespace:       'runtime-enforcer',
    ownerReferences: [{ name: workloadName }],
  },
  workloadRef: {
    workloadType: 'Deployment',
    workloadName,
  },
  remove: jest.fn().mockResolvedValue(undefined),
});

const createWorkload = (name = 'wk-a', withPolicyLabel = true) => ({
  kind:     'Deployment',
  name,
  metadata: { namespace: 'runtime-enforcer' },
  spec:     {
    template: {
      metadata: {
        labels:      withPolicyLabel ? { [POLICY_LABEL_KEY]: 'policy-a' } : {},
        annotations: {},
      },
    },
  },
  save: jest.fn().mockResolvedValue(undefined),
});

const mountDialog = ({
  resources = [createResource('policy-a', 'wk-a')],
  dispatch,
  push = jest.fn(),
  matching = jest.fn(() => []),
  stubs = {},
} = {}) => {
  const storeDispatch = dispatch || jest.fn();

  return {
    wrapper: shallowMount(DeleteActivePoliciesDialog as any, {
      props:  { resources },
      global: {
        stubs,
        mocks: {
          t,
          $store:  { dispatch: storeDispatch, getters: { 'cluster/matching': matching } },
          $router: { push },
          $route:  { params: { cluster: 'local' } },
        },
      },
    }),
    storeDispatch,
    push,
  };
};

describe('DeleteActivePoliciesDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computed: single vs bulk', () => {
    it('builds single text values', () => {
      const { wrapper } = mountDialog({ resources: [createResource('nginx-policy', 'nginx')] });

      expect((wrapper.vm as any).isBulk).toBe(false);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.activePolicies.deleteDialog.title.single');
      expect((wrapper.vm as any).bannerText).toBe('runtimeEnforcer.activePolicies.deleteDialog.banner.single');
      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.confirm.single:{"name":"nginx-policy"}'
      );
      expect((wrapper.vm as any).manualRemovalText).toBe('runtimeEnforcer.activePolicies.deleteDialog.manualRemoval.single');
    });

    it('builds bulk text values', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a', 'wk-a'), createResource('b', 'wk-b')] });

      expect((wrapper.vm as any).isBulk).toBe(true);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.activePolicies.deleteDialog.title.bulk');
      expect((wrapper.vm as any).bannerText).toBe('runtimeEnforcer.activePolicies.deleteDialog.banner.bulk');
      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.confirm.bulk:{"count":2}'
      );
      expect((wrapper.vm as any).manualRemovalText).toBe('runtimeEnforcer.activePolicies.deleteDialog.manualRemoval.bulk');
    });
  });

  describe('computed: workloadRemovalOptions', () => {
    it('builds single options', () => {
      const { wrapper } = mountDialog({ resources: [createResource()] });

      expect((wrapper.vm as any).workloadRemovalOptions).toEqual([
        {
          label: 'runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.keep.single',
          value: 'keep',
        },
        {
          label: 'runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.remove.single',
          value: 'auto',
        },
        {
          label: 'runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.manual.single:{}',
          value: 'manual',
        },
      ]);
    });

    it('builds bulk options', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a'), createResource('b')] });

      expect((wrapper.vm as any).workloadRemovalOptions).toEqual([
        {
          label: 'runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.keep.bulk',
          value: 'keep',
        },
        {
          label: 'runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.remove.bulk',
          value: 'auto',
        },
        {
          label: 'runtimeEnforcer.activePolicies.deleteDialog.workloadRemovalOptions.manual.bulk:{}',
          value: 'manual',
        },
      ]);
    });
  });

  describe('computed: deleteButtonText', () => {
    it('uses default delete text when option is keep/manual', () => {
      const { wrapper } = mountDialog();

      (wrapper.vm as any).workloadRemovalOption = 'keep';
      expect((wrapper.vm as any).deleteButtonText).toBe('runtimeEnforcer.activePolicies.deleteDialog.delete');

      (wrapper.vm as any).workloadRemovalOption = 'manual';
      expect((wrapper.vm as any).deleteButtonText).toBe('runtimeEnforcer.activePolicies.deleteDialog.delete');
    });

    it('uses auto single text when auto is selected', () => {
      const { wrapper } = mountDialog({ resources: [createResource()] });

      (wrapper.vm as any).workloadRemovalOption = 'auto';
      expect((wrapper.vm as any).deleteButtonText).toBe('runtimeEnforcer.activePolicies.deleteDialog.deletePolicy.single & runtimeEnforcer.activePolicies.deleteDialog.restartWorkload.single');
    });

    it('uses auto bulk text when auto is selected in bulk mode', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a'), createResource('b')] });

      (wrapper.vm as any).workloadRemovalOption = 'auto';
      expect((wrapper.vm as any).deleteButtonText).toBe('runtimeEnforcer.activePolicies.deleteDialog.deletePolicy.bulk & runtimeEnforcer.activePolicies.deleteDialog.restartWorkload.bulk');
    });
  });

  describe('computed: growlMessage', () => {
    it('returns keep single growl message', () => {
      const { wrapper } = mountDialog({ resources: [createResource()] });

      (wrapper.vm as any).workloadRemovalOption = 'keep';
      expect((wrapper.vm as any).growlMessage).toBe('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single');
    });

    it('returns keep bulk growl message', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a'), createResource('b')] });

      (wrapper.vm as any).workloadRemovalOption = 'keep';
      expect((wrapper.vm as any).growlMessage).toBe('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk:{"count":2}');
    });

    it('returns auto single growl message', () => {
      const { wrapper } = mountDialog({ resources: [createResource()] });

      (wrapper.vm as any).workloadRemovalOption = 'auto';
      expect((wrapper.vm as any).growlMessage).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single runtimeEnforcer.activePolicies.deleteDialog.growl.autoRemoval.single'
      );
    });

    it('returns auto bulk growl message', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a'), createResource('b')] });

      (wrapper.vm as any).workloadRemovalOption = 'auto';
      expect((wrapper.vm as any).growlMessage).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk:{"count":2} runtimeEnforcer.activePolicies.deleteDialog.growl.autoRemoval.bulk'
      );
    });

    it('returns manual single growl message', () => {
      const { wrapper } = mountDialog({ resources: [createResource()] });

      (wrapper.vm as any).workloadRemovalOption = 'manual';
      expect((wrapper.vm as any).growlMessage).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single runtimeEnforcer.activePolicies.deleteDialog.growl.manualRemoval.single'
      );
    });

    it('returns manual bulk growl message', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a'), createResource('b')] });

      (wrapper.vm as any).workloadRemovalOption = 'manual';
      expect((wrapper.vm as any).growlMessage).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk:{"count":2} runtimeEnforcer.activePolicies.deleteDialog.growl.manualRemoval.bulk'
      );
    });

    it('returns undefined for unknown option', () => {
      const { wrapper } = mountDialog({ resources: [createResource()] });

      (wrapper.vm as any).workloadRemovalOption = 'unknown';
      expect((wrapper.vm as any).growlMessage).toBeUndefined();
    });
  });

  describe('computed: growlTitle', () => {
    it('returns single growl title', () => {
      const { wrapper } = mountDialog({ resources: [createResource('nginx-policy', 'nginx')] });

      expect((wrapper.vm as any).growlTitle).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.growl.title.single'
      );
    });

    it('returns bulk growl title', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a'), createResource('b')] });

      expect((wrapper.vm as any).growlTitle).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.growl.title.bulk'
      );
    });
  });

  describe('close', () => {
    it('emits close', () => {
      const { wrapper } = mountDialog();

      (wrapper.vm as any).close();

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('unlabelAndRedeployWorkload', () => {
    it('is a no-op placeholder that resolves without dispatching', async() => {
      const dispatch = jest.fn();
      const { wrapper } = mountDialog({ dispatch });

      await expect((wrapper.vm as any).unlabelAndRedeployWorkload(createResource('policy-a', 'deploy-a'))).resolves.toBeUndefined();
      expect(dispatch).not.toHaveBeenCalledWith('cluster/find', expect.anything());
    });

    it('rejects when saving the workload fails', async() => {
      const err = new Error('boom');
      const { wrapper } = mountDialog();
      const workload = createWorkload('deploy-a');

      workload.save.mockRejectedValueOnce(err);

      await expect((wrapper.vm as any).unlabelAndRedeployWorkload(workload, '2026-08-17T00:00:00Z')).rejects.toBe(err);
    });

    it('does not save or restart a workload that is already unlabelled', async() => {
      const { wrapper } = mountDialog();
      const workload = createWorkload('deploy-a', false);

      await (wrapper.vm as any).unlabelAndRedeployWorkload(workload, '2026-08-17T00:00:00Z');

      expect(workload.save).not.toHaveBeenCalled();
      expect(workload.spec.template.metadata.annotations).toEqual({});
    });
  });

  describe('deletePolicies', () => {
    it('removes resources, skips redeploy for keep, dispatches growl and routes', async() => {
      const resources = [createResource('a', 'wk-a'), createResource('b', 'wk-b')];
      const dispatch = jest.fn();
      const push = jest.fn();
      const { wrapper } = mountDialog({
        resources, dispatch, push
      });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);

      (wrapper.vm as any).workloadRemovalOption = 'keep';
      await (wrapper.vm as any).deletePolicies();

      expect(resources[0].remove).toHaveBeenCalledTimes(1);
      expect(resources[1].remove).toHaveBeenCalledTimes(1);
      expect(redeploySpy).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith('growl/success', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.bulk',
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk:{"count":2}',
      });
      expect(push).toHaveBeenCalledWith({
        name:   `c-cluster-${ PRODUCT_NAME }-resource`,
        params: { cluster: 'local', product: PRODUCT_NAME },
      });
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('removes resources once their labelled pods are gone for auto, and uses auto growl', async() => {
      const resources = [createResource('a', 'wk-a'), createResource('b', 'wk-b')];
      const dispatch = jest.fn((action, args) => Promise.resolve(action === 'cluster/find' ? createWorkload(args.id.split('/')[1]) : undefined));
      const matching = jest.fn(() => []);
      const { wrapper } = mountDialog({
        resources, dispatch, matching
      });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);

      (wrapper.vm as any).workloadRemovalOption = 'auto';
      await (wrapper.vm as any).deletePolicies();

      expect(redeploySpy).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenCalledWith('cluster/find', {
        type: 'apps.deployment',
        id:   'runtime-enforcer/wk-a',
      });
      expect(dispatch).toHaveBeenCalledWith('cluster/findMatching', {
        type:      'pod',
        selector:  'runtimeenforcer.kubewarden.io/policy=a',
        namespace: 'runtime-enforcer',
      });

      const [testFn, , timeoutMs] = (waitFor as jest.Mock).mock.calls[0];

      expect(testFn()).toBe(true);
      expect(matching).toHaveBeenCalledWith('pod', 'runtimeenforcer.kubewarden.io/policy=a', 'runtime-enforcer');
      expect(timeoutMs).toBe(60000);
      expect(resources[0].remove).toHaveBeenCalledTimes(1);
      expect(resources[1].remove).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('growl/success', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.bulk',
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk:{"count":2} runtimeEnforcer.activePolicies.deleteDialog.growl.autoRemoval.bulk',
      });
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('uses manual growl message when manual option is selected', async() => {
      const resources = [createResource('a', 'wk-a')];
      const dispatch = jest.fn();
      const { wrapper } = mountDialog({ resources, dispatch });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);

      (wrapper.vm as any).workloadRemovalOption = 'manual';
      await (wrapper.vm as any).deletePolicies();

      expect(redeploySpy).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith('growl/success', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.single',
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single runtimeEnforcer.activePolicies.deleteDialog.growl.manualRemoval.single',
      });
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
    });

    it('shows an error growl and re-enables delete when remove fails', async() => {
      const failing = createResource('a', 'wk-a');
      const error = new Error('remove failed');

      failing.remove.mockRejectedValueOnce(error);

      const dispatch = jest.fn();
      const push = jest.fn();
      const { wrapper } = mountDialog({
        resources: [failing], dispatch, push
      });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);

      await expect((wrapper.vm as any).deletePolicies()).resolves.toBeUndefined();
      expect(redeploySpy).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalledWith('growl/success', expect.anything());
      expect(dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.error',
        message: 'remove failed',
      });
      expect(push).not.toHaveBeenCalled();
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
      expect(wrapper.emitted('close')).toBeUndefined();
    });

    it('shows an error growl without removing the policy when the workload save fails', async() => {
      const resource = createResource('a', 'wk-a');
      const workload = createWorkload('wk-a');
      const dispatch = jest.fn((action) => Promise.resolve(action === 'cluster/find' ? workload : undefined));
      const { wrapper } = mountDialog({ resources: [resource], dispatch });

      workload.save.mockRejectedValueOnce(new Error('save failed'));

      (wrapper.vm as any).workloadRemovalOption = 'auto';
      await (wrapper.vm as any).deletePolicies();

      expect(resource.remove).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.error',
        message: 'save failed',
      });
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
    });

    it('still attempts the delete after timing out and shows the backend rejection', async() => {
      const resource = createResource('a', 'wk-a');
      const dispatch = jest.fn((action) => Promise.resolve(action === 'cluster/find' ? createWorkload('wk-a') : undefined));
      const { wrapper } = mountDialog({ resources: [resource], dispatch });

      jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);
      (waitFor as jest.Mock).mockRejectedValueOnce(new Error('waitFor timed out after 60 seconds'));
      resource.remove.mockRejectedValueOnce(new Error('cannot delete WorkloadPolicy "a" while 1 pod(s) in namespace "runtime-enforcer" still use it: pod-a'));

      (wrapper.vm as any).workloadRemovalOption = 'auto';
      await (wrapper.vm as any).deletePolicies();

      expect(resource.remove).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.error',
        message: 'cannot delete WorkloadPolicy "a" while 1 pod(s) in namespace "runtime-enforcer" still use it: pod-a',
      });
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
    });

    it('disables cancel while the deletion is in progress', async() => {
      // Render the Card slots so the action buttons exist under shallowMount.
      const { wrapper } = mountDialog({ stubs: { Card: { template: '<div><slot name="actions" /></div>' } } });

      (wrapper.vm as any).deleteInProgress = true;
      await wrapper.vm.$nextTick();

      const [cancel] = wrapper.findAll('rcbutton');

      expect(cancel.attributes('disabled')).toBe('true');
    });

    it('disables the removal options while the deletion is in progress', async() => {
      const { wrapper } = mountDialog({ stubs: { Card: { template: '<div><slot name="body" /></div>' } } });

      (wrapper.vm as any).deleteInProgress = true;
      await wrapper.vm.$nextTick();

      const radios = wrapper.findAll('radiobutton');

      expect(radios).toHaveLength(3);
      radios.forEach((radio) => expect(radio.attributes('disabled')).toBe('true'));
    });
  });
});
