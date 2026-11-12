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

// Steve rejects with the response body and puts the HTTP status on a non-enumerable `_status`.
const apiError = (status: number, message: string) => Object.defineProperty({ message }, '_status', { value: status });

const blockedByPodsError = (name = 'a') => apiError(403, `admission webhook "vworkloadpolicy.kb.io" denied the request: workloadpolicies.runtimeenforcer.kubewarden.io "${ name }" is forbidden: cannot delete WorkloadPolicy "${ name }" while 1 pod(s) in namespace "runtime-enforcer" still use it: pod-a`);

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
      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.confirm.single:{"name":"nginx-policy"}'
      );
      expect((wrapper.vm as any).manualRemovalText).toBe('runtimeEnforcer.activePolicies.deleteDialog.manualRemoval.single');
    });

    it('builds bulk text values', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a', 'wk-a'), createResource('b', 'wk-b')] });

      expect((wrapper.vm as any).isBulk).toBe(true);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.activePolicies.deleteDialog.title.bulk');
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
    it('opens with automatic removal selected', () => {
      const { wrapper } = mountDialog({ resources: [createResource()] });

      expect((wrapper.vm as any).deleteButtonText).toBe('runtimeEnforcer.activePolicies.deleteDialog.deletePolicy.single & runtimeEnforcer.activePolicies.deleteDialog.restartWorkload.single');
    });

    it('uses default delete text when option is manual', () => {
      const { wrapper } = mountDialog();

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
    it('removes resources, skips redeploy for manual, dispatches the plain growl and routes', async() => {
      const resources = [createResource('a', 'wk-a'), createResource('b', 'wk-b')];
      const dispatch = jest.fn();
      const push = jest.fn();
      const { wrapper } = mountDialog({
        resources, dispatch, push
      });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);

      (wrapper.vm as any).workloadRemovalOption = 'manual';
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
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk:{"count":2} runtimeEnforcer.activePolicies.deleteDialog.growl.autoRemoval.bulk:{}',
      });
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('does not wait on finished pods that still carry the label', async() => {
      const pods = [{ status: { phase: 'Succeeded' } }, { status: { phase: 'Failed' } }];
      const matching = jest.fn(() => pods);
      const dispatch = jest.fn((action, args) => Promise.resolve(action === 'cluster/find' ? createWorkload(args.id.split('/')[1]) : undefined));
      const { wrapper } = mountDialog({ dispatch, matching });

      jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);
      await (wrapper.vm as any).deletePolicies();

      const [testFn] = (waitFor as jest.Mock).mock.calls[0];

      expect(testFn()).toBe(true);
      pods.push({ status: { phase: 'Running' } });
      expect(testFn()).toBe(false);
    });

    it('still deletes the policy in auto mode when its workload no longer exists', async() => {
      const resource = createResource('a', 'wk-a');
      const dispatch = jest.fn((action) => (action === 'cluster/find' ? Promise.reject(apiError(404, 'not found')) : Promise.resolve()));
      const { wrapper } = mountDialog({ resources: [resource], dispatch });

      await (wrapper.vm as any).deletePolicies();

      expect(resource.remove).toHaveBeenCalledTimes(1);
      expect(dispatch).not.toHaveBeenCalledWith('growl/error', expect.anything());
      expect(dispatch).toHaveBeenCalledWith('growl/success', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.single',
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single:{"name":"a"} runtimeEnforcer.activePolicies.deleteDialog.growl.autoRemoval.single:{}',
      });
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('does not delete the policy when looking up its workload fails for another reason', async() => {
      const resource = createResource('a', 'wk-a');
      const dispatch = jest.fn((action) => (action === 'cluster/find' ? Promise.reject(apiError(500, 'server error')) : Promise.resolve()));
      const { wrapper } = mountDialog({ resources: [resource], dispatch });

      await (wrapper.vm as any).deletePolicies();

      expect(resource.remove).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.error',
        message: 'server error',
      });
      expect(wrapper.emitted('close')).toBeUndefined();
    });

    it('shows a persistent error and keeps the dialog open when manual delete is blocked by labelled pods', async() => {
      const resource = createResource('a', 'wk-a');
      const dispatch = jest.fn();
      const push = jest.fn();
      const { wrapper } = mountDialog({
        resources: [resource], dispatch, push
      });

      resource.remove.mockRejectedValueOnce(blockedByPodsError('a'));
      (wrapper.vm as any).workloadRemovalOption = 'manual';
      await (wrapper.vm as any).deletePolicies();

      expect(dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.error',
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.labelStillInUse:{"name":"a","pods":"pod-a"}',
        timeout: 0,
      });
      expect(dispatch).not.toHaveBeenCalledWith('growl/success', expect.anything());
      expect(push).not.toHaveBeenCalled();
      expect(wrapper.emitted('close')).toBeUndefined();
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
    });

    it('falls back to the backend message when the rejection names no pods', async() => {
      const resource = createResource('a', 'wk-a');
      const dispatch = jest.fn();
      const { wrapper } = mountDialog({ resources: [resource], dispatch });

      resource.remove.mockRejectedValueOnce(apiError(403, 'cannot delete WorkloadPolicy "a" while pods still use it'));
      (wrapper.vm as any).workloadRemovalOption = 'manual';
      await (wrapper.vm as any).deletePolicies();

      expect(dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.error',
        message: 'cannot delete WorkloadPolicy "a" while pods still use it',
        timeout: 0,
      });
    });

    it('keeps the generic error for a 403 that is not the labelled pods rejection', async() => {
      const resource = createResource('a', 'wk-a');
      const dispatch = jest.fn();
      const { wrapper } = mountDialog({ resources: [resource], dispatch });

      resource.remove.mockRejectedValueOnce(apiError(403, 'workloadpolicies.runtimeenforcer.kubewarden.io "a" is forbidden: User "u-1" cannot delete resource'));
      (wrapper.vm as any).workloadRemovalOption = 'manual';
      await (wrapper.vm as any).deletePolicies();

      expect(dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.error',
        message: 'workloadpolicies.runtimeenforcer.kubewarden.io "a" is forbidden: User "u-1" cannot delete resource',
      });
    });

    it('reports each blocked policy and confirms the ones deleted in a bulk delete', async() => {
      const resources = [createResource('a', 'wk-a'), createResource('b', 'wk-b'), createResource('c', 'wk-c')];
      const dispatch = jest.fn();
      const push = jest.fn();
      const { wrapper } = mountDialog({
        resources, dispatch, push
      });

      resources[1].remove.mockRejectedValueOnce(blockedByPodsError('b'));
      resources[2].remove.mockRejectedValueOnce(blockedByPodsError('c'));
      (wrapper.vm as any).workloadRemovalOption = 'manual';
      await (wrapper.vm as any).deletePolicies();

      expect(dispatch).toHaveBeenCalledWith('growl/error', expect.objectContaining({ message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.labelStillInUse:{"name":"b","pods":"pod-a"}', timeout: 0 }));
      expect(dispatch).toHaveBeenCalledWith('growl/error', expect.objectContaining({ message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.labelStillInUse:{"name":"c","pods":"pod-a"}', timeout: 0 }));
      expect(dispatch).toHaveBeenCalledWith('growl/success', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.single',
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single:{"name":"a"}',
      });
      expect(push).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted('close')).toHaveLength(1);
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

      (wrapper.vm as any).workloadRemovalOption = 'manual';
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

    it('still attempts the delete after timing out and shows a persistent error when pods still use the policy', async() => {
      const resource = createResource('a', 'wk-a');
      const dispatch = jest.fn((action) => Promise.resolve(action === 'cluster/find' ? createWorkload('wk-a') : undefined));
      const { wrapper } = mountDialog({ resources: [resource], dispatch });

      jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);
      (waitFor as jest.Mock).mockRejectedValueOnce(new Error('waitFor timed out after 60 seconds'));
      resource.remove.mockRejectedValueOnce(blockedByPodsError('a'));

      (wrapper.vm as any).workloadRemovalOption = 'auto';
      await (wrapper.vm as any).deletePolicies();

      expect(resource.remove).toHaveBeenCalledTimes(1);
      expect(dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.error',
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.labelStillInUse:{"name":"a","pods":"pod-a"} runtimeEnforcer.activePolicies.deleteDialog.growl.autoRestartHint',
        timeout: 0,
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

      expect(radios).toHaveLength(2);
      radios.forEach((radio) => expect(radio.attributes('disabled')).toBe('true'));
    });
  });
});
