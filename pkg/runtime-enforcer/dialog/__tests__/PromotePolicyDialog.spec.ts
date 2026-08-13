import { shallowMount } from '@vue/test-utils';
import PromotePolicyDialog from '../PromotePolicyDialog.vue';
import { PRODUCT_NAME, POLICY_MODE, APPLY_MODE } from '@runtime-enforcer/types/runtime-enforcer.ts';

jest.mock('@shell/components/Resource/Detail/CopyToClipboard.vue', () => ({
  __esModule: true,
  default:    { name: 'CopyToClipboard', template: '<div />' },
}));

jest.mock('../../utils/promote', () => ({
  applyPromoteLabel:        jest.fn().mockResolvedValue(undefined),
  applyWorkloadPolicyLabel: jest.fn().mockResolvedValue(undefined),
  snapshotProposal:         jest.fn((resource) => ({ snapshot: resource.nameDisplay })),
}));

import { applyPromoteLabel, applyWorkloadPolicyLabel, snapshotProposal } from '../../utils/promote';

const t = jest.fn((key: string, args?: Record<string, any>) => (args ? `${ key } ${ JSON.stringify(args) }` : key));

const createResource = (name = 'proposal-a', workload = 'wk-a') => ({
  nameDisplay: name,
  workload,
  metadata:    { uid: `${ name }-uid`, name },
});

const mountDialog = ({
  resources = [createResource()],
  dispatch,
  push = jest.fn(),
} = {}) => {
  const storeDispatch = dispatch || jest.fn();

  return {
    wrapper: shallowMount(PromotePolicyDialog as any, {
      props:  { resources },
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

describe('PromotePolicyDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computed: isBulk / title', () => {
    it('is single for one resource', () => {
      const { wrapper } = mountDialog({ resources: [createResource()] });

      expect((wrapper.vm as any).isBulk).toBe(false);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.policyProposal.promoteDialog.title.single');
    });

    it('is bulk for multiple resources', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a'), createResource('b')] });

      expect((wrapper.vm as any).isBulk).toBe(true);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.policyProposal.promoteDialog.title.bulk');
    });

    it('uses applyStep title on step 2', () => {
      const { wrapper } = mountDialog();

      (wrapper.vm as any).step = 2;
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.policyProposal.promoteDialog.applyStep.title.single');
    });
  });

  describe('computed: bannerText', () => {
    it('interpolates workload name on step 2', () => {
      const { wrapper } = mountDialog({ resources: [createResource('proposal-a', 'nginx')] });

      (wrapper.vm as any).step = 2;
      expect((wrapper.vm as any).bannerText).toBe(
        'runtimeEnforcer.policyProposal.promoteDialog.applyStep.banner.single {"name":"nginx"}'
      );
    });
  });

  describe('computed: confirmText', () => {
    it('uses single confirm text with name', () => {
      const { wrapper } = mountDialog({ resources: [createResource('proposal-a')] });

      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.policyProposal.promoteDialog.confirm.single {"name":"proposal-a","workload":"wk-a"}'
      );
    });

    it('uses bulk confirm text with count', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a'), createResource('b')] });

      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.policyProposal.promoteDialog.confirm.bulk {"count":2}'
      );
    });
  });

  describe('computed: growlTitle / growlMessage', () => {
    it('builds single growl title and message for automatic apply', () => {
      const { wrapper } = mountDialog({ resources: [createResource('proposal-a')] });

      (wrapper.vm as any).applyOption = APPLY_MODE.AUTOMATIC;
      expect((wrapper.vm as any).growlTitle).toBe(
        'runtimeEnforcer.policyProposal.promoteDialog.growl.title.single'
      );
      expect((wrapper.vm as any).growlMessage).toBe(
        'runtimeEnforcer.policyProposal.promoteDialog.growl.base.single {"name":"proposal-a"} runtimeEnforcer.policyProposal.promoteDialog.growl.automatic.single {}'
      );
    });

    it('builds bulk growl title and message for manual apply', () => {
      const { wrapper } = mountDialog({ resources: [createResource('a'), createResource('b')] });

      (wrapper.vm as any).applyOption = APPLY_MODE.MANUAL;
      expect((wrapper.vm as any).growlTitle).toBe(
        'runtimeEnforcer.policyProposal.promoteDialog.growl.title.bulk'
      );
      expect((wrapper.vm as any).growlMessage).toBe(
        'runtimeEnforcer.policyProposal.promoteDialog.growl.base.bulk {"count":2} runtimeEnforcer.policyProposal.promoteDialog.growl.manual.bulk {}'
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

  describe('continueToApplyStep', () => {
    it('advances to step 2', () => {
      const { wrapper } = mountDialog();

      (wrapper.vm as any).continueToApplyStep();

      expect((wrapper.vm as any).step).toBe(2);
    });
  });

  describe('finish', () => {
    it('applies labels, applies workload policy label, dispatches growl, and routes for single resource', async() => {
      const resource = createResource('proposal-a', 'wk-a');
      const dispatch = jest.fn();
      const push = jest.fn();
      const { wrapper } = mountDialog({
        resources: [resource], dispatch, push
      });

      (wrapper.vm as any).applyOption = APPLY_MODE.AUTOMATIC;
      (wrapper.vm as any).targetMode = POLICY_MODE.PROTECT;

      await (wrapper.vm as any).finish();

      expect(applyPromoteLabel).toHaveBeenCalledWith(resource, POLICY_MODE.PROTECT);
      expect(snapshotProposal).toHaveBeenCalledWith(resource);
      expect(applyWorkloadPolicyLabel).toHaveBeenCalledWith({ dispatch }, { snapshot: 'proposal-a' });
      expect(dispatch).toHaveBeenCalledWith('growl/success', {
        title:   (wrapper.vm as any).growlTitle,
        message: (wrapper.vm as any).growlMessage,
      });
      expect(push).toHaveBeenCalledWith({
        name:   `c-cluster-${ PRODUCT_NAME }-resource`,
        params: { cluster: 'local', product: PRODUCT_NAME },
      });
      expect((wrapper.vm as any).promoteInProgress).toBe(false);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('does not route when bulk', async() => {
      const resources = [createResource('a'), createResource('b')];
      const push = jest.fn();
      const { wrapper } = mountDialog({ resources, push });

      await (wrapper.vm as any).finish();

      expect(push).not.toHaveBeenCalled();
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('does not apply workload policy label when manual option selected', async() => {
      const resource = createResource('proposal-a');
      const { wrapper } = mountDialog({ resources: [resource] });

      (wrapper.vm as any).applyOption = APPLY_MODE.MANUAL;
      await (wrapper.vm as any).finish();

      expect(applyWorkloadPolicyLabel).not.toHaveBeenCalled();
    });

    it('dispatches growl/fromError and keeps dialog open when applyPromoteLabel fails', async() => {
      const err = new Error('boom');

      (applyPromoteLabel as jest.Mock).mockRejectedValueOnce(err);

      const dispatch = jest.fn();
      const push = jest.fn();
      const { wrapper } = mountDialog({ dispatch, push });

      await (wrapper.vm as any).finish();

      expect(dispatch).toHaveBeenCalledWith('growl/fromError', {
        title: 'runtimeEnforcer.policyProposal.promoteDialog.errorTitle',
        err,
      });
      expect(applyWorkloadPolicyLabel).not.toHaveBeenCalled();
      expect(push).not.toHaveBeenCalled();
      expect((wrapper.vm as any).promoteInProgress).toBe(false);
      expect(wrapper.emitted('close')).toBeUndefined();
    });
  });
});
