import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import WorkloadPolicyProposalEdit from '../security.rancher.io.workloadpolicyproposal.vue';

jest.mock('@shell/components/CruResource', () => ({
  name:     'CruResource',
  template: '<div><slot /></div>',
}));

jest.mock('@shell/components/form/NameNsDescription', () => ({
  name:     'NameNsDescription',
  template: '<div></div>',
}));

describe('WorkloadPolicyProposalEdit component', () => {
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
    const wrapper = shallowMount(WorkloadPolicyProposalEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'test-proposal', namespace: 'default' },
          spec:     { rulesByContainer: {} },
        },
      },
    });

    expect(document.body.classList.contains('re-custom-policy-edit')).toBe(true);
    wrapper.unmount();
    expect(document.body.classList.contains('re-custom-policy-edit')).toBe(false);
  });

  it('correctly derives subheader and workload metadata with explorer routes', () => {
    const wrapper = shallowMount(WorkloadPolicyProposalEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata: {
            name:              'nginx-proposal',
            namespace:         'prod',
            creationTimestamp: '2026-08-10T12:00:00Z',
            ownerReferences:   [{ name: 'nginx-deployment', kind: 'Deployment' }],
          },
          ownerWorkloadSteveType: 'apps.deployment',
          spec:                   { rulesByContainer: {} },
        },
      },
    });

    expect(wrapper.vm.namespace).toBe('prod');
    expect(wrapper.vm.creationTimestamp).toBe('2026-08-10T12:00:00Z');
    expect(wrapper.vm.workloadName).toBe('nginx-deployment');
    expect(wrapper.vm.workloadType).toBe('Deployment');
    expect(wrapper.vm.namespaceLocation).toEqual({
      name:   'c-cluster-product-resource-id',
      params: {
        cluster:  'local',
        product:  'explorer',
        resource: 'namespace',
        id:       'prod',
      },
    });
    expect(wrapper.vm.workloadLocation).toEqual({
      name:   'c-cluster-product-resource-id',
      params: {
        cluster:  'local',
        product:  'explorer',
        resource: 'apps.deployment',
        id:       'prod/nginx-deployment',
      },
    });
  });

  it('builds container list with resolved images from ownerWorkload', () => {
    const wrapper = shallowMount(WorkloadPolicyProposalEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'test-proposal', namespace: 'default' },
          spec:     {
            rulesByContainer: {
              nginx: {
                executables: { allowed: ['/usr/bin/nginx'] },
              },
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

    expect(wrapper.vm.containerImages).toEqual({ nginx: 'nginx:1.25' });
    expect(wrapper.vm.containerList).toEqual([
      {
        name:        'nginx',
        image:       'nginx:1.25',
        executables: [{ path: '/usr/bin/nginx' }],
      },
    ]);
  });

  it('validates form and catches empty or invalid executable paths', () => {
    const wrapper = shallowMount(WorkloadPolicyProposalEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'test-proposal', namespace: 'default' },
          spec:     {
            rulesByContainer: {
              'audit-scanner': {
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

  it('successfully adds and removes an executable path entry', () => {
    const wrapper = shallowMount(WorkloadPolicyProposalEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'test-proposal', namespace: 'default' },
          spec:     {
            rulesByContainer: {
              'audit-scanner': {
                executables: { allowed: ['/usr/bin/bash'] },
              },
            },
          },
        },
      },
    });

    wrapper.vm.addExecutable('audit-scanner');
    let allowed = wrapper.vm.value.spec.rulesByContainer['audit-scanner'].executables.allowed;

    expect(allowed).toContain('');
    expect(allowed.length).toBe(2);

    wrapper.vm.removeExecutable('audit-scanner', 1);
    allowed = wrapper.vm.value.spec.rulesByContainer['audit-scanner'].executables.allowed;
    expect(allowed.length).toBe(1);
  });

  it('fetches owner workload on fetch when ownerWorkloadSteveType is present', async() => {
    const wrapper = shallowMount(WorkloadPolicyProposalEdit, {
      global: {
        plugins: [store],
        stubs:   defaultStubs,
        mocks:   createDefaultMocks(),
      },
      props: {
        mode:  'edit',
        value: {
          metadata:               { name: 'test-proposal', namespace: 'default' },
          workload:               'nginx',
          ownerWorkloadSteveType: 'apps.deployment',
          spec:                   { rulesByContainer: {} },
        },
      },
    });

    await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
    expect(dispatchSpy).toHaveBeenCalledWith('cluster/find', {
      type: 'apps.deployment',
      id:   'default/nginx',
    });
  });
});