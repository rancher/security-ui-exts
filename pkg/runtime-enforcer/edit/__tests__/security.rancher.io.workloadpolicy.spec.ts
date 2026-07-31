import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import WorkloadPolicyEdit from '../security.rancher.io.workloadpolicy.vue';

describe('WorkloadPolicyEdit component', () => {
  let store: any;

  beforeEach(() => {
    store = createStore({
      getters: {
        'i18n/t':            () => (key: string) => key,
        'i18n/exists':       () => () => true,
        'cluster/schemaFor': () => () => ({ canCreate: true }),
      },
    });
    store.dispatch = jest.fn().mockResolvedValue({});
  });

  it('renders the edit form components successfully', () => {
    const wrapper = shallowMount(WorkloadPolicyEdit, {
      global: {
        plugins: [store],
        stubs:   {
          CruResource:       true,
          NameNsDescription: true,
          LabeledInput:      true,
          Tabbed:            true,
          Tab:               true,
          Banner:            true,
          RadioGroup:        true,
          RancherMeta:       true,
        },
        mocks: {
          $route: {
            params: { cluster: 'local' }
          }
        }
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'payments-api-policy', namespace: 'ingress' },
          spec:     {
            mode:             'protect',
            rulesByContainer: {
              'deploy-nginx-ingress': {
                executables: { allowed: ['/usr/bin/nginx'] }
              }
            }
          }
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm.spec.mode).toBe('protect');
  });

  it('validates form and catches empty or invalid executable paths', () => {
    const wrapper = shallowMount(WorkloadPolicyEdit, {
      global: {
        plugins: [store],
        stubs:   {
          CruResource:       true,
          NameNsDescription: true,
          LabeledInput:      true,
          Tabbed:            true,
          Tab:               true,
          Banner:            true,
          RadioGroup:        true,
          RancherMeta:       true,
        },
        mocks: {
          $route: {
            params: { cluster: 'local' }
          }
        }
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'payments-api-policy', namespace: 'ingress' },
          spec:     {
            mode:             'protect',
            rulesByContainer: {
              'deploy-nginx-ingress': {
                executables: { allowed: [''] }
              }
            }
          }
        }
      }
    });

    const errors = wrapper.vm.validateForm();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('successfully adds and updates executable path entries', () => {
    const wrapper = shallowMount(WorkloadPolicyEdit, {
      global: {
        plugins: [store],
        stubs:   {
          CruResource:       true,
          NameNsDescription: true,
          LabeledInput:      true,
          Tabbed:            true,
          Tab:               true,
          Banner:            true,
          RadioGroup:        true,
          RancherMeta:       true,
        },
        mocks: {
          $route: {
            params: { cluster: 'local' }
          }
        }
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'payments-api-policy', namespace: 'ingress' },
          spec:     {
            mode:             'protect',
            rulesByContainer: {
              'deploy-nginx-ingress': {
                executables: { allowed: ['/usr/bin/nginx'] }
              }
            }
          }
        }
      }
    });

    wrapper.vm.addExecutable('deploy-nginx-ingress');
    const allowed = wrapper.vm.value.spec.rulesByContainer['deploy-nginx-ingress'].executables.allowed;

    expect(allowed).toContain('');
    expect(allowed.length).toBe(2);

    wrapper.vm.updateExecutablePath('deploy-nginx-ingress', 1, '/usr/bin/curl');
    expect(allowed[1]).toBe('/usr/bin/curl');
  });
});