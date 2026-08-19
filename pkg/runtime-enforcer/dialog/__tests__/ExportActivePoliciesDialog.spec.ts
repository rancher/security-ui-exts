import { shallowMount } from '@vue/test-utils';
import ExportActivePoliciesDialog from '../ExportActivePoliciesDialog.vue';
import { downloadFile } from '@shell/utils/download';

jest.mock('@shell/utils/download', () => ({ downloadFile: jest.fn() }));

const t = jest.fn((key, args, raw) => (raw ? `${ key }:${ JSON.stringify(args) }` : key));

const createResource = (name: string) => ({
  metadata:         { name, namespace: 'ingress' },
  nameDisplay:      name,
  followLink:       jest.fn().mockResolvedValue({ data: `kind: WorkloadPolicy\nmetadata:\n  name: ${ name }\n` }),
  cleanForDownload: jest.fn((yaml) => yaml),
});

const mountDialog = (resources: any[]) => {
  return shallowMount(ExportActivePoliciesDialog as any, {
    props:  { resources },
    global: { mocks: { t } },
  });
};

describe('ExportActivePoliciesDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isBulk / title', () => {
    it('is not bulk and uses "single" copy for exactly one resource', () => {
      const wrapper = mountDialog([createResource('deploy-nginx-ingress')]);

      expect((wrapper.vm as any).isBulk).toBe(false);
      void (wrapper.vm as any).title;
      expect(t).toHaveBeenCalledWith('runtimeEnforcer.activePolicies.exportDialog.title.single');
    });

    it('is bulk and uses "bulk" copy for more than one resource', () => {
      const wrapper = mountDialog([createResource('a'), createResource('b')]);

      expect((wrapper.vm as any).isBulk).toBe(true);
      void (wrapper.vm as any).title;
      expect(t).toHaveBeenCalledWith('runtimeEnforcer.activePolicies.exportDialog.title.bulk');
    });
  });

  describe('confirmText', () => {
    it('interpolates the single resource\'s display name', () => {
      const wrapper = mountDialog([createResource('deploy-nginx-ingress')]);

      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicies.exportDialog.confirm.single:{"name":"deploy-nginx-ingress"}'
      );
    });

    it('interpolates the selected resource count for bulk export', () => {
      const wrapper = mountDialog([createResource('a'), createResource('b'), createResource('c')]);

      expect((wrapper.vm as any).confirmText).toBe(
        'runtimeEnforcer.activePolicies.exportDialog.confirm.bulk:{"count":3}'
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

      expect(resource.followLink).toHaveBeenCalledWith('view', { headers: { accept: 'application/yaml' } });
      expect(resource.cleanForDownload).toHaveBeenCalledWith(expect.stringContaining('kind: WorkloadPolicy'));
      expect(downloadFile).toHaveBeenCalledWith(
        'deploy-nginx-ingress.yaml',
        expect.stringContaining('name: deploy-nginx-ingress'),
        'application/yaml'
      );
      expect(wrapper.emitted('close')).toHaveLength(1);
    });

    it('joins multiple resources into a single multi-doc YAML file when exporting in bulk', async() => {
      const resources = [createResource('a'), createResource('b')];
      const wrapper = mountDialog(resources);

      await (wrapper.vm as any).exportPolicies();

      resources.forEach((resource) => {
        expect(resource.followLink).toHaveBeenCalledWith('view', { headers: { accept: 'application/yaml' } });
        expect(resource.cleanForDownload).toHaveBeenCalled();
      });

      const [fileName, yaml, mimeType] = (downloadFile as jest.Mock).mock.calls[0];

      expect(fileName).toBe('active-policies.yaml');
      expect(mimeType).toBe('application/yaml');
      // documents are separated by the `---` divider.
      expect(yaml.split('---\n').filter(Boolean)).toHaveLength(2);
      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });
});
