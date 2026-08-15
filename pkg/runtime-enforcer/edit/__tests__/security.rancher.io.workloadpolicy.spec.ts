import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';

jest.mock('@shell/components/CruResource', () => ({
  name:     'CruResource',
  template: '<div><slot /></div>',
}));

jest.mock('@shell/components/form/NameNsDescription', () => ({
  name:     'NameNsDescription',
  template: '<div></div>',
}));

jest.mock('@components/Form/LabeledInput', () => ({
  LabeledInput: {
    name:     'LabeledInput',
    template: '<div></div>',
    props:    ['value', 'label', 'mode', 'disabled', 'required', 'placeholder'],
  },
}));

jest.mock('@components/Form/Radio/RadioGroup', () => ({
  RadioGroup: {
    name:     'RadioGroup',
    template: '<div></div>',
    props:    ['value', 'name', 'mode', 'options', 'row'],
  },
}));

import WorkloadPolicyEdit from '../security.rancher.io.workloadpolicy.vue';

describe('WorkloadPolicyEdit component', () => {
  let store: any;
  let dispatchSpy: jest.SpyInstance;

  beforeEach(() => {
    document.body.className = '';
    store = createStore({
      getters: {
        'i18n/t':            () => (key: string) => key,
        'i18n/exists':       () => () => true,
        'cluster/schemaFor': () => () => ({ canCreate: true }),
        productId:           () => 'runtimeEnforcer',
      },
    });
    dispatchSpy = jest.spyOn(store, 'dispatch').mockResolvedValue({});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    document.body.className = '';
  });

  const defaultStubs = {
    CruResource:       true,
    NameNsDescription: true,
    LabeledInput:      true,
    Tabbed:            true,
    Tab:               true,
    Banner:            true,
    RadioGroup:        true,
    LiveDate:          true,
    RouterLink:        true,
    teleport:          true,
  };

  const createDefaultMocks = () => ({
    $store: store,
    $route: {
      params: { cluster: 'local' },
    },
  });

  it('adds and removes re-custom-policy-edit class on document.body during lifecycle', () => {
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
          spec:     { mode: 'protect', rulesByContainer: {} },
        },
      },
    });

    expect(document.body.classList.contains('re-custom-policy-edit')).toBe(true);
    wrapper.unmount();
    expect(document.body.classList.contains('re-custom-policy-edit')).toBe(false);
  });

  it('correctly resolves subheader computed properties with explorer product routes', () => {
    const wrapper = shallowMount(WorkloadPolicyEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata:    { name: 'deploy-nginx-ingress', namespace: 'ingress', creationTimestamp: '2026-08-01T00:00:00Z' },
          workloadRef: {
            workloadName: 'nginx-ingress',
            workloadType: 'Deployment',
          },
          spec: { mode: 'protect', rulesByContainer: {} },
        },
      },
    });

    expect(wrapper.vm.namespace).toBe('ingress');
    expect(wrapper.vm.creationTimestamp).toBe('2026-08-01T00:00:00Z');
    expect(wrapper.vm.workloadName).toBe('nginx-ingress');
    expect(wrapper.vm.namespaceLocation).toEqual({
      name:   'c-cluster-product-resource-id',
      params: {
        cluster:  'local',
        product:  'explorer',
        resource: 'namespace',
        id:       'ingress',
      },
    });
    expect(wrapper.vm.workloadLocation).toEqual({
      name:   'c-cluster-product-resource-id',
      params: {
        cluster:  'local',
        product:  'explorer',
        resource: 'apps.deployment',
        id:       'ingress/nginx-ingress',
      },
    });
  });

  it('resolves workload properties and containerList from workloadRef', () => {
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