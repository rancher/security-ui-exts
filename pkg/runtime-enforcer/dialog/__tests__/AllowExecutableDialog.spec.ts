import { shallowMount } from '@vue/test-utils';
import AllowExecutableDialog from '../AllowExecutableDialog.vue';

jest.mock('../../utils/allow', () => ({ allowExecutables: jest.fn().mockResolvedValue(undefined) }));

import { allowExecutables } from '../../utils/allow';

const t = jest.fn((key: string, args?: Record<string, any>) => (args ? `${ key } ${ JSON.stringify(args) }` : key));

const createTarget = (containerName = 'nginx', executablePath = '/usr/bin/curl') => ({ containerName, executablePath });

const mountDialog = ({
  resources = [{ nameDisplay: 'policy-a' }],
  targets = [createTarget()],
  dispatch,
} = {}) => {
  const storeDispatch = dispatch || jest.fn();

  return {
    wrapper: shallowMount(AllowExecutableDialog as any, {
      props:  { resources, targets },
      global: { mocks: { t, $store: { dispatch: storeDispatch } } },
    }),
    storeDispatch,
  };
};

describe('AllowExecutableDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('computed: isBulk / title / bannerText', () => {
    it('is single for one target', () => {
      const { wrapper } = mountDialog({ targets: [createTarget()] });

      expect((wrapper.vm as any).isBulk).toBe(false);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.activePolicy.allowDialog.title.single');
      expect((wrapper.vm as any).bannerText).toBe('runtimeEnforcer.activePolicy.allowDialog.banner.single');
    });

    it('is bulk for multiple targets', () => {
      const { wrapper } = mountDialog({ targets: [createTarget('nginx', '/a'), createTarget('nginx', '/b')] });

      expect((wrapper.vm as any).isBulk).toBe(true);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.activePolicy.allowDialog.title.bulk');
      expect((wrapper.vm as any).bannerText).toBe('runtimeEnforcer.activePolicy.allowDialog.banner.bulk');
    });
  });

  describe('computed: confirmText', () => {
    it('uses single confirm text with path', () => {
      const { wrapper } = mountDialog({ targets: [createTarget('nginx', '/usr/bin/curl')] });

      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicy.allowDialog.confirm.single {"path":"/usr/bin/curl"}'
      );
    });

    it('uses bulk confirm text with count', () => {
      const { wrapper } = mountDialog({ targets: [createTarget('nginx', '/a'), createTarget('nginx', '/b')] });

      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicy.allowDialog.confirm.bulk {"count":2}'
      );
    });
  });

  describe('computed: growlTitle / growlMessage', () => {
    it('builds single growl title and message', () => {
      const { wrapper } = mountDialog({ targets: [createTarget('nginx', '/usr/bin/curl')] });

      expect((wrapper.vm as any).growlTitle).toBe('runtimeEnforcer.activePolicy.allowDialog.growl.title.single');
      expect((wrapper.vm as any).growlMessage).toBe(
        'runtimeEnforcer.activePolicy.allowDialog.growl.message.single {"path":"/usr/bin/curl"}'
      );
    });

    it('builds bulk growl title and message', () => {
      const { wrapper } = mountDialog({ targets: [createTarget('nginx', '/a'), createTarget('nginx', '/b')] });

      expect((wrapper.vm as any).growlTitle).toBe('runtimeEnforcer.activePolicy.allowDialog.growl.title.bulk');
      expect((wrapper.vm as any).growlMessage).toBe(
        'runtimeEnforcer.activePolicy.allowDialog.growl.message.bulk {"count":2}'
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

  describe('finish', () => {
    it('allows executables, dispatches growl/success, and closes on success', async() => {
      const policy = { nameDisplay: 'policy-a' };
      const targets = [createTarget('nginx', '/usr/bin/curl')];
      const dispatch = jest.fn();
      const { wrapper } = mountDialog({ resources: [policy], targets, dispatch });

      await (wrapper.vm as any).finish();

      expect(allowExecutables).toHaveBeenCalledWith(policy, targets);
      expect(dispatch).toHaveBeenCalledWith('growl/success', {
        title:   (wrapper.vm as any).growlTitle,
        message: (wrapper.vm as any).growlMessage,
      });
      expect((wrapper.vm as any).allowInProgress).toBe(false);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('dispatches growl/fromError and keeps dialog open when allowExecutables fails', async() => {
      const err = new Error('boom');

      (allowExecutables as jest.Mock).mockRejectedValueOnce(err);

      const dispatch = jest.fn();
      const { wrapper } = mountDialog({ dispatch });

      await (wrapper.vm as any).finish();

      expect(dispatch).toHaveBeenCalledWith('growl/fromError', {
        title: 'runtimeEnforcer.activePolicy.allowDialog.errorTitle',
        err,
      });
      expect((wrapper.vm as any).allowInProgress).toBe(false);
      expect(wrapper.emitted('close')).toBeUndefined();
    });
  });
});
