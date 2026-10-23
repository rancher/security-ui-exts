import { shallowMount } from '@vue/test-utils';
import ChangeModeDialog from '../ChangeModeDialog.vue';

const t = jest.fn((key, args, raw) => (raw ? `${ key }:${ JSON.stringify(args) }` : key));

const createResource = (mode: string, name = `policy-${ mode }`) => ({
  nameDisplay: name,
  spec:        { mode },
  save:        jest.fn().mockResolvedValue(undefined),
});

const mountDialog = (resources: any[], dispatch = jest.fn()) => {
  return shallowMount(ChangeModeDialog as any, {
    props:  { resources },
    global: { mocks: { t, $store: { dispatch } } },
  });
};

describe('ChangeModeDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBulk / modeOptions / title / bannerText / confirmText', () => {
    it('uses single-mode copy for one resource', () => {
      const wrapper = mountDialog([createResource('monitor', 'nginx-policy')]);

      expect((wrapper.vm as any).isBulk).toBe(false);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.activePolicies.changeModeDialog.title.single');
      expect((wrapper.vm as any).bannerText).toBe('runtimeEnforcer.activePolicies.changeModeDialog.banner.single');
      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicies.changeModeDialog.confirm.single:{"name":"nginx-policy"}'
      );
    });

    it('uses bulk copy and count interpolation for multiple resources', () => {
      const wrapper = mountDialog([
        createResource('monitor', 'a'),
        createResource('protect', 'b'),
        createResource('monitor', 'c'),
      ]);

      expect((wrapper.vm as any).isBulk).toBe(true);
      expect((wrapper.vm as any).title).toBe('runtimeEnforcer.activePolicies.changeModeDialog.title.bulk');
      expect((wrapper.vm as any).bannerText).toBe('runtimeEnforcer.activePolicies.changeModeDialog.banner.bulk');
      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicies.changeModeDialog.confirm.bulk:{"count":3}'
      );
    });

    it('builds monitor/protect mode options', () => {
      const wrapper = mountDialog([createResource('monitor')]);

      expect((wrapper.vm as any).modeOptions).toEqual([
        { value: 'monitor', label: 'runtimeEnforcer.policyProposal.exportDialog.mode.monitor' },
        { value: 'protect', label: 'runtimeEnforcer.policyProposal.exportDialog.mode.protect' },
      ]);
    });
  });

  describe('transitionDirection', () => {
    it('switches from monitor to protect for single monitor policy', () => {
      const wrapper = mountDialog([createResource('monitor')]);

      expect((wrapper.vm as any).transitionDirection).toEqual({ from: 'monitor', to: 'protect' });
    });

    it('switches from protect to monitor for single protect policy', () => {
      const wrapper = mountDialog([createResource('protect')]);

      expect((wrapper.vm as any).transitionDirection).toEqual({ from: 'protect', to: 'monitor' });
    });
  });

  describe('close', () => {
    it('emits close', () => {
      const wrapper = mountDialog([createResource('monitor')]);

      (wrapper.vm as any).close();

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('image + text helpers', () => {
    it('returns monitor/protect icon path and null for enforce', () => {
      const wrapper = mountDialog([createResource('monitor')]);

      expect((wrapper.vm as any).modeIconImgSrc('monitor')).toBeTruthy();
      expect((wrapper.vm as any).modeIconImgSrc('protect')).toBeTruthy();
      expect((wrapper.vm as any).modeIconImgSrc('enforce')).toBeNull();
    });

    it('localizes mode text by lowercasing the mode key', () => {
      const wrapper = mountDialog([createResource('monitor')]);

      expect((wrapper.vm as any).modetext('PROTECT')).toBe('runtimeEnforcer.activePolicies.mode.protect');
      expect(t).toHaveBeenCalledWith('runtimeEnforcer.activePolicies.mode.protect');
    });
  });

  describe('changeMode', () => {
    it('toggles single resource from monitor to protect using transitionDirection', async() => {
      const resource = createResource('monitor');
      const wrapper = mountDialog([resource]);

      await (wrapper.vm as any).changeMode();

      expect(resource.spec.mode).toBe('protect');
      expect(resource.save).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('toggles single resource from protect to monitor using transitionDirection', async() => {
      const resource = createResource('protect');
      const wrapper = mountDialog([resource]);

      await (wrapper.vm as any).changeMode();

      expect(resource.spec.mode).toBe('monitor');
      expect(resource.save).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('toggles every resource to protect when all selected policies are in monitor', async() => {
      const resources = [createResource('monitor', 'a'), createResource('monitor', 'b')];
      const wrapper = mountDialog(resources);

      await (wrapper.vm as any).changeMode();

      resources.forEach((resource) => {
        expect(resource.spec.mode).toBe('protect');
        expect(resource.save).toHaveBeenCalledTimes(1);
      });
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('toggles every resource to monitor when all selected policies are in protect', async() => {
      const resources = [createResource('protect', 'a'), createResource('protect', 'b')];
      const wrapper = mountDialog(resources);

      await (wrapper.vm as any).changeMode();

      resources.forEach((resource) => {
        expect(resource.spec.mode).toBe('monitor');
        expect(resource.save).toHaveBeenCalledTimes(1);
      });
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('applies selected targetMode to all resources in bulk mode', async() => {
      const resources = [createResource('monitor', 'a'), createResource('protect', 'b')];
      const wrapper = mountDialog(resources);

      (wrapper.vm as any).targetMode = 'protect';
      await (wrapper.vm as any).changeMode();

      resources.forEach((resource) => {
        expect(resource.spec.mode).toBe('protect');
        expect(resource.save).toHaveBeenCalledTimes(1);
      });
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('shows a success growl naming the policy and its new mode', async() => {
      const wrapper = mountDialog([createResource('monitor', 'web')]);

      await (wrapper.vm as any).changeMode();

      expect((wrapper.vm as any).$store.dispatch).toHaveBeenCalledWith('growl/success', {
        title:   'runtimeEnforcer.activePolicies.changeModeDialog.growl.title.single:{}',
        message: 'runtimeEnforcer.activePolicies.changeModeDialog.growl.message.single:{"name":"web","mode":"runtimeEnforcer.activePolicies.mode.protect"}',
      });
    });

    it('shows a bulk success growl with the count and new mode', async() => {
      const wrapper = mountDialog([createResource('protect', 'a'), createResource('protect', 'b')]);

      await (wrapper.vm as any).changeMode();

      expect((wrapper.vm as any).$store.dispatch).toHaveBeenCalledWith('growl/success', {
        title:   'runtimeEnforcer.activePolicies.changeModeDialog.growl.title.bulk:{}',
        message: 'runtimeEnforcer.activePolicies.changeModeDialog.growl.message.bulk:{"count":2,"mode":"runtimeEnforcer.activePolicies.mode.monitor"}',
      });
    });

    it('restores the previous mode, shows an error growl and stays open when a save fails', async() => {
      const failing = createResource('monitor', 'a');
      const succeeding = createResource('monitor', 'b');

      failing.save.mockRejectedValueOnce(new Error('forbidden'));

      const wrapper = mountDialog([failing, succeeding]);

      await (wrapper.vm as any).changeMode();

      expect(failing.spec.mode).toBe('monitor');
      expect(succeeding.spec.mode).toBe('protect');
      expect((wrapper.vm as any).$store.dispatch).toHaveBeenCalledWith('growl/error', {
        title:   'runtimeEnforcer.activePolicies.changeModeDialog.growl.title.error:{}',
        message: 'forbidden',
      });
      expect((wrapper.vm as any).$store.dispatch).not.toHaveBeenCalledWith('growl/success', expect.anything());
      expect(wrapper.emitted('close')).toBeUndefined();
      expect((wrapper.vm as any).changeInProgress).toBe(false);
    });
  });

  it('keeps the dialog content fixed while the new mode is being saved', async() => {
    const resource = createResource('monitor');
    const wrapper = mountDialog([resource]);

    await (wrapper.vm as any).changeMode();

    expect(resource.spec.mode).toBe('protect');
    expect((wrapper.vm as any).transitionDirection).toEqual({ from: 'monitor', to: 'protect' });
    expect((wrapper.vm as any).showBanner).toBe(false);
  });

  describe('showBanner', () => {
    it('hides the Monitor warning when switching a policy to Protect', () => {
      expect((mountDialog([createResource('monitor')]).vm as any).showBanner).toBe(false);
    });

    it('shows the Monitor warning when switching a policy to Monitor', () => {
      expect((mountDialog([createResource('protect')]).vm as any).showBanner).toBe(true);
    });

    it('shows the Monitor warning when the target mode is picked from the dropdown', () => {
      expect((mountDialog([createResource('monitor', 'a'), createResource('protect', 'b')]).vm as any).showBanner).toBe(true);
    });
  });
});
