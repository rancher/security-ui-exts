import { shallowMount, Wrapper, flushPromises } from '@vue/test-utils';
import CruRegistry from '../sbomscanner.kubewarden.io.registry.vue';
import { SECRET } from '@shell/config/types';
import { SECRET_TYPES } from '@shell/config/secret';
import { SCAN_INTERVALS, REGISTRY_TYPE } from '../../constants';

jest.mock('@sbomscanner-ui-ext/types', () => ({
  PRODUCT_NAME: 'kubewarden',
  PAGE:         { REGISTRIES: 'registries' },
  LOCAT_HOST:   [],
}));

const LabeledSelectStub = {
  name:     'LabeledSelect',
  template: `
    <select :data-testid="dataTestid" @change="$emit('update:value', $event.target.value)" :required="required">
      <option
          v-for="opt in options"
          :key="opt[optionKey]"
          :value="opt[optionKey]"
      >
        {{ opt[optionLabel] }}
      </option>
    </select>
  `,
  props: ['value', 'options', 'optionKey', 'optionLabel', 'required', 'dataTestid'],
};

const stubs = {
  CruResource:       { name: 'CruResource', template: '<div><slot /></div>' },
  NameNsDescription: true,
  LabeledInput:      true,
  Banner:            { name: 'Banner', template: '<div><slot /></div>' },
  LabeledSelect:     LabeledSelectStub,
  SelectOrCreateAuthSecret: { name: 'SelectOrCreateAuthSecret', template: '<div class="select-or-create-auth-secret"></div>' },
  Checkbox:          {
    name: 'Checkbox', template: '<input type="checkbox" :checked="value" @change="$emit(\'update:value\', $event.target.checked)" />', props: ['value', 'label', 'tooltip']
  },
  FileSelector: { name: 'FileSelector', template: '<button @click="$emit(\'selected\', \'file-content\')">Read</button>' }
};

const t = (key: string) => key;

const mockSecrets = [
  { metadata: { name: 'secret-1', namespace: 'default' }, _type: SECRET_TYPES.DOCKER_JSON },
  { metadata: { name: 'secret-2', namespace: 'other' }, _type: SECRET_TYPES.DOCKER_JSON },
  { metadata: { name: 'secret-3', namespace: 'default' }, _type: 'Opaque' },
];

const mockStore = {
  dispatch: jest.fn(),
  getters:  { currentProduct: { inStore: 'cluster' } },
};

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
};
const mockRoute = { params: { cluster: 'c-123' } };

const defaultProps = {
  mode:  'create',
  value: {
    metadata: { name: 'test-registry', namespace: 'default' },
    spec:     {
      catalogType:  REGISTRY_TYPE.OCI_DISTRIBUTION,
      authSecret:   '',
      uri:          '',
      repositories: [],
      caBundle:     '',
      insecure:     false,
      platforms:    []
    },
  },
};

const createWrapper = (props: any, storeMock = mockStore) => {
  return shallowMount(CruRegistry, {
    props:  { ...defaultProps, ...props },
    global: {
      mocks: {
        $store:  storeMock,
        $route:  mockRoute,
        $router: mockRouter,
        t,
      },
      stubs,
    }
  });
};

const deepClone = (obj: any) => JSON.parse(JSON.stringify(obj));

describe('CruRegistry', () => {
  let wrapper: Wrapper<any>;

  beforeEach(() => {
    mockStore.dispatch.mockClear();
    mockRouter.push.mockClear();
    mockRouter.back.mockClear();
    jest.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize spec with defaults if it is undefined', () => {
      wrapper = createWrapper({
        value: { metadata: { name: '', namespace: 'default' } }
      });
      const spec = wrapper.vm.value.spec;

      expect(spec.catalogType).toBe(REGISTRY_TYPE.OCI_DISTRIBUTION);
      expect(spec.scanInterval).toBeUndefined();
      expect(spec.caBundle).toBe('');
      expect(spec.insecure).toBe(false);
      expect(wrapper.vm.secretCreateHook).toBeNull();
    });
  });

  describe('fetch', () => {
    it('should call dispatch to find secrets on creation', async() => {
      const dispatch = jest.fn().mockResolvedValue(mockSecrets);
      const specificStore = { ...mockStore, dispatch };

      wrapper = createWrapper({}, specificStore);

      if (wrapper.vm.$options.fetch) {
        await wrapper.vm.$options.fetch.call(wrapper.vm);
      }

      await flushPromises();

      expect(dispatch).toHaveBeenCalledWith('cluster/findAll', { type: SECRET });
      expect(wrapper.vm.allSecrets).toStrictEqual(mockSecrets);
    });
  });

  describe('computed: selectedScanInterval', () => {
    beforeEach(() => {
      wrapper = createWrapper({});
    });

    it('should return MANUAL if scanInterval is undefined or set to MANUAL', () => {
      wrapper.vm.value.spec.scanInterval = undefined;
      expect(wrapper.vm.selectedScanInterval).toBe(SCAN_INTERVALS.MANUAL);

      wrapper.vm.value.spec.scanInterval = SCAN_INTERVALS.MANUAL;
      expect(wrapper.vm.selectedScanInterval).toBe(SCAN_INTERVALS.MANUAL);
    });

    it('should delete scanInterval from spec when set to MANUAL', () => {
      wrapper.vm.value.spec.scanInterval = '12h';
      wrapper.vm.selectedScanInterval = SCAN_INTERVALS.MANUAL;
      expect(wrapper.vm.value.spec.scanInterval).toBeUndefined();
    });

    it('should set scanInterval to the selected value if not MANUAL', () => {
      wrapper.vm.selectedScanInterval = '24h';
      expect(wrapper.vm.value.spec.scanInterval).toBe('24h');
    });
  });

  describe('computed: repoNames (Object <-> String mapping)', () => {
    beforeEach(() => {
      wrapper = createWrapper({});
      if (!wrapper.vm.value.spec) wrapper.vm.value.spec = { repositories: [] };
    });

    it('get: should transform backend objects to UI strings', () => {
      wrapper.vm.value.spec.repositories = [{ name: 'repo1' }, { name: 'repo2' }];
      expect(wrapper.vm.repoNames).toEqual(['repo1', 'repo2']);
    });

    it('get: should handle undefined repositories safely', () => {
      wrapper.vm.value.spec.repositories = undefined;
      expect(wrapper.vm.repoNames).toEqual([]);
    });

    it('set: should transform UI strings to backend objects', () => {
      wrapper.vm.repoNames = ['new-repo-1', 'new-repo-2'];
      expect(wrapper.vm.value.spec.repositories).toEqual([
        { name: 'new-repo-1' },
        { name: 'new-repo-2' }
      ]);
    });
  });

  describe('computed: safeRegistryUrl', () => {
    beforeEach(() => {
      wrapper = createWrapper({});
    });

    it('should return empty string if URI is empty or undefined', () => {
      wrapper.vm.value.spec.uri = '';
      expect(wrapper.vm.safeRegistryUrl).toBe('');

      wrapper.vm.value.spec.uri = undefined;
      expect(wrapper.vm.safeRegistryUrl).toBe('');
    });

    it('should prepend https:// if no protocol is present', () => {
      wrapper.vm.value.spec.uri = 'ghcr.io';
      expect(wrapper.vm.safeRegistryUrl).toBe('https://ghcr.io');

      wrapper.vm.value.spec.uri = 'docker.io';
      expect(wrapper.vm.safeRegistryUrl).toBe('https://docker.io');
    });

    it('should not modify the URI if a protocol is already present', () => {
      wrapper.vm.value.spec.uri = 'https://ghcr.io';
      expect(wrapper.vm.safeRegistryUrl).toBe('https://ghcr.io');

      wrapper.vm.value.spec.uri = 'http://localhost:5000';
      expect(wrapper.vm.safeRegistryUrl).toBe('http://localhost:5000');
    });
  });

  describe('computed: validationPassed', () => {
    let validValue: any;

    beforeEach(async() => {
      wrapper = createWrapper({});
      validValue = {
        metadata: { name: 'my-registry', namespace: 'default' },
        spec:     {
          catalogType:  REGISTRY_TYPE.OCI_DISTRIBUTION,
          authSecret:   'my-secret',
          uri:          'http://my.registry',
          repositories: [],
          scanInterval: SCAN_INTERVALS.MANUAL,
          caBundle:     '',
          insecure:     false,
          platforms:    []
        },
      };
      await wrapper.setProps({ value: validValue });
      await wrapper.vm.$nextTick();
    });

    it('should pass validation with valid data', () => {
      expect(wrapper.vm.validationPassed).toBe(true);
    });

    it('should fail if name is missing', async() => {
      const newValue = deepClone(validValue);

      newValue.metadata.name = ' ';
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should fail if URI is missing', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.uri = ' ';
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should fail if catalogType is NO_CATALOG and repositories is empty', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.catalogType = REGISTRY_TYPE.NO_CATALOG;
      newValue.spec.repositories = [];
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(false);
    });

    it('should pass if catalogType is NO_CATALOG and repositories has items', async() => {
      const newValue = deepClone(validValue);

      newValue.spec.catalogType = REGISTRY_TYPE.NO_CATALOG;
      newValue.spec.repositories = [{ name: 'my-repo' }];
      await wrapper.setProps({ value: newValue });
      await wrapper.vm.$nextTick();
      expect(wrapper.vm.validationPassed).toBe(true);
    });
  });

  describe('methods: Platforms & Files', () => {
    beforeEach(() => {
      wrapper = createWrapper({});
    });

    it('onFileSelected should set caBundle', () => {
      wrapper.vm.onFileSelected('my-cert-content');
      expect(wrapper.vm.value.spec.caBundle).toBe('my-cert-content');
    });

    it('addPlatform should push a default template (linux/amd64) to platforms array', () => {
      wrapper.vm.addPlatform();

      expect(wrapper.vm.value.spec.platforms).toHaveLength(1);
      expect(wrapper.vm.value.spec.platforms[0]).toEqual({
        os: 'linux', arch: 'amd64', variant: ''
      });
    });

    it('removePlatform should remove item from platforms array', () => {
      wrapper.vm.value.spec.platforms = [
        {
          os: 'linux', arch: 'amd64', variant: ''
        },
        {
          os: 'windows', arch: 'amd64', variant: ''
        }
      ];
      wrapper.vm.removePlatform(0);
      expect(wrapper.vm.value.spec.platforms).toHaveLength(1);
      expect(wrapper.vm.value.spec.platforms[0].os).toBe('windows');
    });

    it('updateOS should set OS and reset Arch/Variant defaults', () => {
      const platform = {
        os: '', arch: '', variant: 'v7'
      };

      wrapper.vm.updateOS(platform, 'linux');
      expect(platform.os).toBe('linux');
      expect(platform.arch).toBe('amd64');
      expect(platform.variant).toBe('');
    });

    it('updateArch should set Arch and clear Variant if unsupported', () => {
      const platform = {
        os: 'linux', arch: 'arm', variant: 'v7'
      };

      wrapper.vm.updateArch(platform, 'amd64');
      expect(platform.arch).toBe('amd64');
      expect(platform.variant).toBe('');
    });

    it('updateArch should keep Variant if supported (manually logic check)', () => {
      const platform = {
        os: 'linux', arch: 'amd64', variant: ''
      };

      wrapper.vm.updateArch(platform, 'arm');
      expect(platform.arch).toBe('arm');
    });
  });

  describe('methods: SelectOrCreateAuthSecret Hook', () => {
    beforeEach(() => {
      wrapper = createWrapper({});
    });

    it('registerSecretHook should set the secretCreateHook', () => {
      const mockHook = jest.fn();

      wrapper.vm.registerSecretHook(mockHook);
      expect(wrapper.vm.secretCreateHook).toBe(mockHook);
    });
  });

  describe('methods: finish & error handling', () => {
    const save = jest.fn();

    beforeEach(() => {
      save.mockReset();
      wrapper = createWrapper({});
      wrapper.vm.save = save;
      wrapper.setProps({
        value: {
          metadata: { name: 'my-registry', namespace: 'default' },
          spec:     {
            catalogType:  REGISTRY_TYPE.OCI_DISTRIBUTION,
            authSecret:   'my-secret',
            uri:          'http://my.registry',
            repositories: [],
            scanInterval: SCAN_INTERVALS.MANUAL,
            platforms:    []
          },
        },
      });
    });

    it('should execute the secretCreateHook if registered before saving', async() => {
      const mockHook = jest.fn().mockResolvedValue(true);

      wrapper.vm.registerSecretHook(mockHook);
      save.mockResolvedValue({});

      await wrapper.vm.finish();

      expect(mockHook).toHaveBeenCalled();
      expect(save).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should call save and route on success when no hook is present', async() => {
      save.mockResolvedValue({});
      await wrapper.vm.finish();
      expect(save).toHaveBeenCalled();
      expect(mockRouter.push).toHaveBeenCalled();
    });

    it('should remove duplicates and empty platforms before saving', async() => {
      save.mockResolvedValue({});
      wrapper.vm.value.spec.platforms = [
        {
          os: 'linux', arch: 'amd64', variant: ''
        },
        {
          os: 'linux', arch: 'amd64', variant: ''
        },
        {
          os: '', arch: '', variant: ''
        },
        {
          os: 'windows', arch: 'amd64', variant: ''
        }
      ];

      await wrapper.vm.$nextTick();
      await wrapper.vm.finish();

      expect(wrapper.vm.value.spec.platforms).toHaveLength(2);
      expect(wrapper.vm.value.spec.platforms[0].os).toBe('linux');
      expect(wrapper.vm.value.spec.platforms[1].os).toBe('windows');
      expect(save).toHaveBeenCalled();
    });

    it('should set errors and not route on save failure', async() => {
      const error = new Error('Save failed');

      save.mockRejectedValue(error);
      await wrapper.vm.finish();
      expect(save).toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(wrapper.vm.errors).toEqual([error]);
    });

    it('should set errors and not route on secretCreateHook failure', async() => {
      const error = new Error('Hook failed');
      const mockHook = jest.fn().mockRejectedValue(error);

      wrapper.vm.registerSecretHook(mockHook);

      await wrapper.vm.finish();

      expect(mockHook).toHaveBeenCalled();
      expect(save).not.toHaveBeenCalled();
      expect(mockRouter.push).not.toHaveBeenCalled();
      expect(wrapper.vm.errors).toEqual([error]);
    });
  });

  describe('Template & CruResource Event Handlers', () => {
    it('should capture errors emitted from CruResource (e.g. YAML save errors)', async() => {
      wrapper = createWrapper({});
      const cruResource = wrapper.findComponent({ name: 'CruResource' });

      const mockError = { message: 'admission webhook denied the request' };

      cruResource.vm.$emit('error', mockError);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.errors).toEqual([mockError]);
    });

    it('should render the SelectOrCreateAuthSecret component', () => {
      wrapper = createWrapper({});
      const secretComponent = wrapper.findComponent({ name: 'SelectOrCreateAuthSecret' });

      expect(secretComponent.exists()).toBe(true);
    });

    it('should mark repositories as required when type is NO_CATALOG', async() => {
      wrapper = createWrapper({});
      await wrapper.setProps({ value: { ...wrapper.vm.value, spec: { ...wrapper.vm.value.spec, catalogType: REGISTRY_TYPE.NO_CATALOG } } });
      await wrapper.vm.$nextTick();
      const repoSelect = wrapper.find('[data-testid="registry-scanning-repository-names"]');

      expect(repoSelect.exists()).toBe(true);
      const requiredAttr = repoSelect.attributes('required');

      expect(requiredAttr).toBe('');
    });

    it('should show FileSelector for CA Bundle', () => {
      wrapper = createWrapper({});
      const fileSelector = wrapper.findComponent({ name: 'FileSelector' });

      expect(fileSelector.exists()).toBe(true);
    });

    it('should show Checkbox for Insecure', () => {
      wrapper = createWrapper({});
      const checkbox = wrapper.findComponent({ name: 'Checkbox' });

      expect(checkbox.exists()).toBe(true);
    });
  });
});