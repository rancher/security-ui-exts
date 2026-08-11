import { shallowMount } from '@vue/test-utils';
import DeleteActivePoliciesDialog from '../DeleteActivePoliciesDialog.vue';
import { exceptionToErrorsArray } from '@shell/utils/error';
import { PRODUCT_NAME } from '@runtime-enforcer/types/runtime-enforcer.ts';

jest.mock('@shell/components/Resource/Detail/CopyToClipboard.vue', () => ({
  __esModule: true,
  default:    { name: 'CopyToClipboard', template: '<div />' },
}));

jest.mock('@shell/utils/error', () => ({
  exceptionToErrorsArray: jest.fn((err) => [err]),
}));

const t = jest.fn((key, args, raw) => (raw ? `${ key }:${ JSON.stringify(args) }` : key));

const createResource = (name = 'policy-a', workloadName = 'wk-a') => ({
  nameDisplay: name,
  metadata: {
    uid:             `${ name }-uid`,
    name,
    namespace:       'runtime-enforcer',
    ownerReferences: [{ name: workloadName }],
  },
  ownerWorkloadSteveType: 'apps.deployment',
  remove:                 jest.fn().mockResolvedValue(undefined),
});

const mountDialog = ({
  resources = [createResource('policy-a', 'wk-a')],
  dispatch,
  push = jest.fn(),
} = {}) => {
  const storeDispatch = dispatch || jest.fn();

  return {
    wrapper: shallowMount(DeleteActivePoliciesDialog as any, {
      props: { resources },
      global: {
        mocks: {
          t,
          $store:  { dispatch: storeDispatch },
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
      expect((wrapper.vm as any).growlMessage).toBe('runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk');
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
        'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk runtimeEnforcer.activePolicies.deleteDialog.growl.autoRemoval.bulk'
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
        'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk runtimeEnforcer.activePolicies.deleteDialog.growl.manualRemoval.bulk'
      );
    });

    it('returns undefined for unknown option', () => {
      const { wrapper } = mountDialog({ resources: [createResource()] });

      (wrapper.vm as any).workloadRemovalOption = 'unknown';
      expect((wrapper.vm as any).growlMessage).toBeUndefined();
    });
  });

  describe('computed: growlTitle', () => {
    it('returns single growl title with name', () => {
      const { wrapper } = mountDialog({ resources: [createResource('nginx-policy', 'nginx')] });

      expect((wrapper.vm as any).growlTitle).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.growl.title.single:{"name":"nginx-policy"}'
      );
    });

    it('returns bulk growl title with count', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a'), createResource('b')] });

      expect((wrapper.vm as any).growlTitle).toBe(
        'runtimeEnforcer.activePolicies.deleteDialog.growl.title.bulk:{"count":2}'
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

    it('stores formatted errors when an internal error occurs', async() => {
      const err = new Error('boom');
      const dateSpy = jest.spyOn(Date.prototype, 'toISOString').mockImplementation(() => {
        throw err;
      });

      const dispatch = jest.fn();
      const { wrapper } = mountDialog({ dispatch });
      const mockedExceptionToErrorsArray = exceptionToErrorsArray as jest.Mock;

      mockedExceptionToErrorsArray.mockReturnValueOnce(['formatted-error']);

      await (wrapper.vm as any).unlabelAndRedeployWorkload(createResource('policy-a', 'deploy-a'));

      expect(mockedExceptionToErrorsArray).toHaveBeenCalledWith(err);
      expect((wrapper.vm as any).errors).toEqual(['formatted-error']);
      dateSpy.mockRestore();
    });
  });

  describe('deletePolicies', () => {
    it('removes resources, skips redeploy for keep, dispatches growl and routes', async() => {
      const resources = [createResource('a', 'wk-a'), createResource('b', 'wk-b')];
      const dispatch = jest.fn();
      const push = jest.fn();
      const { wrapper } = mountDialog({ resources, dispatch, push });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);

      (wrapper.vm as any).workloadRemovalOption = 'keep';
      await (wrapper.vm as any).deletePolicies();

      expect(resources[0].remove).toHaveBeenCalledTimes(1);
      expect(resources[1].remove).toHaveBeenCalledTimes(1);
      expect(redeploySpy).not.toHaveBeenCalled();
      expect(dispatch).toHaveBeenCalledWith('growl/success', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.bulk:{"count":2}',
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk',
      });
      expect(push).toHaveBeenCalledWith({
        name:   `c-cluster-${ PRODUCT_NAME }-resource`,
        params: { cluster: 'local', product: PRODUCT_NAME },
      });
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('removes resources, redeploys each for auto, and uses auto growl', async() => {
      const resources = [createResource('a', 'wk-a'), createResource('b', 'wk-b')];
      const dispatch = jest.fn();
      const { wrapper } = mountDialog({ resources, dispatch });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);

      (wrapper.vm as any).workloadRemovalOption = 'auto';
      await (wrapper.vm as any).deletePolicies();

      expect(resources[0].remove).toHaveBeenCalledTimes(1);
      expect(resources[1].remove).toHaveBeenCalledTimes(1);
      expect(redeploySpy).toHaveBeenCalledTimes(2);
      expect(dispatch).toHaveBeenCalledWith('growl/success', {
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.bulk:{"count":2}',
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.bulk runtimeEnforcer.activePolicies.deleteDialog.growl.autoRemoval.bulk',
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
        title:   'runtimeEnforcer.activePolicies.deleteDialog.growl.title.single:{"name":"a"}',
        message: 'runtimeEnforcer.activePolicies.deleteDialog.growl.delete.single runtimeEnforcer.activePolicies.deleteDialog.growl.manualRemoval.single',
      });
      expect((wrapper.vm as any).deleteInProgress).toBe(false);
    });

    it('rejects when remove fails and keeps deleteInProgress true', async() => {
      const failing = createResource('a', 'wk-a');
      const error = new Error('remove failed');

      failing.remove.mockRejectedValueOnce(error);

      const dispatch = jest.fn();
      const push = jest.fn();
      const { wrapper } = mountDialog({ resources: [failing], dispatch, push });
      const redeploySpy = jest.spyOn(wrapper.vm as any, 'unlabelAndRedeployWorkload').mockResolvedValue(undefined);

      await expect((wrapper.vm as any).deletePolicies()).rejects.toThrow('remove failed');
      expect(redeploySpy).not.toHaveBeenCalled();
      expect(dispatch).not.toHaveBeenCalledWith('growl/success', expect.anything());
      expect(push).not.toHaveBeenCalled();
      expect((wrapper.vm as any).deleteInProgress).toBe(true);
    });
  });
});
