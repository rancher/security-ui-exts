import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import WorkloadPolicyEdit from '../security.rancher.io.workloadpolicy.vue';

// Mock shell components at module level to avoid runtime defineEmits warnings from uncompiled dependencies
jest.mock('@shell/components/CruResource', () => ({
  name: 'CruResource',
  template: '<div><slot /></div>',
}));

jest.mock('@shell/components/form/NameNsDescription', () => ({
  name: 'NameNsDescription',
  template: '<div></div>',
}));

describe('WorkloadPolicyEdit component', () => {
  let store: any;
  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    store = createStore({
      getters: {
        'i18n/t':            () => (key: string) => key,
        'i18n/exists':       () => () => true,
        'cluster/schemaFor': () => () => ({ canCreate: true }),
      },
    });

    dispatchSpy = jest.spyOn(store, 'dispatch').mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const defaultStubs = {
    CruResource:       true,
    NameNsDescription: true,
    LabeledInput:      true,
    Tabbed:            true,
    Tab:               true,
    Banner:            true,
    RadioGroup:        true,
    RancherMeta:       true,
  };

  const createDefaultMocks = () => ({
    $store: store,
    $route: {
      params: { cluster: 'local' },
    },
  });

  it('renders the edit form components successfully and resolves mode', () => {
    const wrapper = shallowMount(WorkloadPolicyEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'payments-api-policy', namespace: 'ingress' },
          spec:     {
            mode:             'protect',
            rulesByContainer: {
              'deploy-nginx-ingress': {
                executables: { allowed: ['/usr/bin/nginx'] },
              },
            },
          },
        },
      },
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm.spec.mode).toBe('protect');
  });

  it('resolves workloadName, workloadType, and containerImages directly from workloadRef when available', () => {
    const wrapper = shallowMount(WorkloadPolicyEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata:    { name: 'deploy-nginx-ingress', namespace: 'ingress' },
          workloadRef: {
            workloadName: 'nginx-ingress',
            workloadType: 'Deployment',
            imageMap:     { 'nginx-ingress': 'registry.k8s.io/nginx:v1.0' },
          },
          spec: {
            mode:             'protect',
            rulesByContainer: {
              'nginx-ingress': {
                executables: { allowed: ['/usr/bin/nginx'] },
              },
            },
          },
        },
      },
    });

    expect(wrapper.vm.workloadName).toBe('nginx-ingress');
    expect(wrapper.vm.workloadType).toBe('Deployment');
    expect(wrapper.vm.containerImages).toEqual({ 'nginx-ingress': 'registry.k8s.io/nginx:v1.0' });
    expect(wrapper.vm.containerList[0].image).toBe('registry.k8s.io/nginx:v1.0');
  });

  it('falls back to ownerReferences and ownerWorkload when workloadRef is missing or empty', () => {
    const wrapper = shallowMount(WorkloadPolicyEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata: {
            name:            'deploy-nginx-ingress',
            namespace:       'ingress',
            ownerReferences: [{ name: 'nginx-deployment', kind: 'Deployment' }],
          },
          spec: {
            mode:             'protect',
            rulesByContainer: {
              nginx: { executables: { allowed: ['/usr/bin/nginx'] } },
            },
          },
        },
      },
    });

    wrapper.vm.ownerWorkload = {
      spec: {
        template: {
          spec: {
            containers: [{ name: 'nginx', image: 'nginx:1.25' }],
          },
        },
      },
    };

    expect(wrapper.vm.workloadName).toBe('nginx-deployment');
    expect(wrapper.vm.workloadType).toBe('Deployment');
    expect(wrapper.vm.containerImages).toEqual({ nginx: 'nginx:1.25' });
  });

  it('validates form and catches empty or invalid executable paths', () => {
    const wrapper = shallowMount(WorkloadPolicyEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'payments-api-policy', namespace: 'ingress' },
          spec:     {
            mode:             'protect',
            rulesByContainer: {
              'deploy-nginx-ingress': {
                executables: { allowed: [''] },
              },
            },
          },
        },
      },
    });

    const errors = wrapper.vm.validateForm();

    expect(errors.length).toBeGreaterThan(0);
  });

  it('successfully adds and updates executable path entries', () => {
    const wrapper = shallowMount(WorkloadPolicyEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'payments-api-policy', namespace: 'ingress' },
          spec:     {
            mode:             'protect',
            rulesByContainer: {
              'deploy-nginx-ingress': {
                executables: { allowed: ['/usr/bin/nginx'] },
              },
            },
          },
        },
      },
    });

    wrapper.vm.addExecutable('deploy-nginx-ingress');
    const allowed = wrapper.vm.value.spec.rulesByContainer['deploy-nginx-ingress'].executables.allowed;

    expect(allowed).toContain('');
    expect(allowed.length).toBe(2);

    wrapper.vm.updateExecutablePath('deploy-nginx-ingress', 1, '/usr/bin/curl');
    expect(allowed[1]).toBe('/usr/bin/curl');
  });

  it('dispatches cluster/findAll during fetch to populate Vuex cache', async() => {
    const wrapper = shallowMount(WorkloadPolicyEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'payments-api-policy', namespace: 'ingress' },
          spec:     { rulesByContainer: {} },
        },
      },
    });

    await (wrapper.vm as any).$options.fetch.call(wrapper.vm);

    expect(dispatchSpy).toHaveBeenCalledWith('cluster/findAll', expect.objectContaining({ type: expect.any(String) }));
  });
});