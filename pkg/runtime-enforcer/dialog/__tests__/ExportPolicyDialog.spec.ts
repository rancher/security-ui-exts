import { shallowMount } from '@vue/test-utils';
import ExportPolicyDialog from '../ExportPolicyDialog.vue';
import { downloadFile } from '@shell/utils/download';

jest.mock('@shell/utils/download', () => ({ downloadFile: jest.fn() }));

const t = jest.fn((key, args, raw) => (raw ? `${ key }:${ JSON.stringify(args) }` : key));

const createResource = (name: string) => ({
  metadata:               { name, namespace: 'ingress' },
  nameDisplay:            name,
  toActivePolicyResource: jest.fn((targetMode) => ({
    apiVersion: 'security.rancher.io/v1alpha1',
    kind:       'WorkloadPolicy',
    metadata:   { name, namespace: 'ingress' },
    spec:       { mode: targetMode, rulesByContainer: {} },
  })),
});

const mountDialog = (resources: any[]) => {
  return shallowMount(ExportPolicyDialog as any, {
    props:  { resources },
    global: { mocks: { t } },
  });
};

describe('ExportPolicyDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBulk / modeOptions / title / bannerText', () => {
    it('is not bulk and uses "single" copy for exactly one resource', () => {
      const wrapper = mountDialog([createResource('deploy-nginx-ingress')]);

      expect((wrapper.vm as any).isBulk).toBe(false);
      // access the computeds directly - shallow-stubbed children don't evaluate slot content
      void (wrapper.vm as any).title;
      void (wrapper.vm as any).bannerText;
      expect(t).toHaveBeenCalledWith('runtimeEnforcer.policyProposal.exportDialog.title.single');
      expect(t).toHaveBeenCalledWith('runtimeEnforcer.policyProposal.exportDialog.banner.single');
    });

    it('is bulk and uses "bulk" copy for more than one resource', () => {
      const wrapper = mountDialog([createResource('a'), createResource('b')]);

      expect((wrapper.vm as any).isBulk).toBe(true);
      void (wrapper.vm as any).title;
      void (wrapper.vm as any).bannerText;
      expect(t).toHaveBeenCalledWith('runtimeEnforcer.policyProposal.exportDialog.title.bulk');
      expect(t).toHaveBeenCalledWith('runtimeEnforcer.policyProposal.exportDialog.banner.bulk');
    });

    it('builds monitor and protect mode options', () => {
      const wrapper = mountDialog([createResource('a')]);

      expect((wrapper.vm as any).modeOptions).toEqual([
        { value: 'monitor', label: 'runtimeEnforcer.policyProposal.exportDialog.mode.monitor' },
        { value: 'protect', label: 'runtimeEnforcer.policyProposal.exportDialog.mode.protect' },
      ]);
    });
  });

  describe('confirmText', () => {
    it('interpolates the single resource\'s display name', () => {
      const wrapper = mountDialog([createResource('deploy-nginx-ingress')]);

      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.policyProposal.exportDialog.confirm.single:{"name":"deploy-nginx-ingress"}'
      );
    });

    it('interpolates the selected resource count for bulk export', () => {
      const wrapper = mountDialog([createResource('a'), createResource('b'), createResource('c')]);

      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.policyProposal.exportDialog.confirm.bulk:{"count":3}'
      );
    });
  });

  describe('close', () => {
    it('emits "close"', () => {
      const wrapper = mountDialog([createResource('a')]);

      (wrapper.vm as any).close();

      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });

  describe('exportPolicies', () => {
    it('downloads a single YAML file for one resource and closes the dialog', async() => {
      const resource = createResource('deploy-nginx-ingress');
      const wrapper = mountDialog([resource]);

      await (wrapper.vm as any).exportPolicies();

      expect(resource.toActivePolicyResource).toHaveBeenCalledWith('monitor');
      expect(downloadFile).toHaveBeenCalledWith(
        'deploy-nginx-ingress.yaml',
        expect.stringContaining('kind: WorkloadPolicy'),
        'application/yaml'
      );
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('honors the selected target mode', async() => {
      const resource = createResource('deploy-nginx-ingress');
      const wrapper = mountDialog([resource]);

      (wrapper.vm as any).targetMode = 'protect';
      await (wrapper.vm as any).exportPolicies();

      expect(resource.toActivePolicyResource).toHaveBeenCalledWith('protect');
    });

    it('joins multiple resources into a single multi-doc YAML file when exporting in bulk', async() => {
      const resources = [createResource('a'), createResource('b')];
      const wrapper = mountDialog(resources);

      await (wrapper.vm as any).exportPolicies();

      resources.forEach((resource) => expect(resource.toActivePolicyResource).toHaveBeenCalledWith('monitor'));

      const [fileName, yaml, mimeType] = (downloadFile as jest.Mock).mock.calls[0];

      expect(fileName).toBe('active-policies.yaml');
      expect(mimeType).toBe('application/yaml');
      // documents are separated by the `---` divider.
      expect(yaml.split('---\n').filter(Boolean)).toHaveLength(2);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });
});
