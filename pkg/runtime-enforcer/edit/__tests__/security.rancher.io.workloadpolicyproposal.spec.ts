import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import WorkloadPolicyProposalEdit from '../security.rancher.io.workloadpolicyproposal.vue';

describe('WorkloadPolicyProposalEdit component', () => {
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
    const wrapper = shallowMount(WorkloadPolicyProposalEdit, {
      global: {
        plugins: [store],
        stubs:   {
          CruResource:       true,
          NameNsDescription: true,
          LabeledInput:      true,
          Tabbed:            true,
          Tab:               true,
          Banner:            true,
        },
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'test-proposal', namespace: 'default' },
          spec:     {
            rulesByContainer: {
              'my-container': {
                executables: { allowed: ['/usr/bin/bash'] }
              }
            }
          }
        }
      }
    });

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm.workloadName).toBe('');
  });

  it('validates form and catches empty or invalid executable paths', () => {
    const wrapper = shallowMount(WorkloadPolicyProposalEdit, {
      global: {
        plugins: [store],
        stubs:   {
          CruResource:       true,
          NameNsDescription: true,
          LabeledInput:      true,
          Tabbed:            true,
          Tab:               true,
          Banner:            true,
        },
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'test-proposal', namespace: 'default' },
          spec:     {
            rulesByContainer: {
              'audit-scanner': {
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

  it('successfully adds a new executable path entry', () => {
    const wrapper = shallowMount(WorkloadPolicyProposalEdit, {
      global: {
        plugins: [store],
        stubs:   {
          CruResource:       true,
          NameNsDescription: true,
          LabeledInput:      true,
          Tabbed:            true,
          Tab:               true,
          Banner:            true,
        },
      },
      props: {
        mode:  'edit',
        value: {
          metadata: { name: 'test-proposal', namespace: 'default' },
          spec:     {
            rulesByContainer: {
              'audit-scanner': {
                executables: { allowed: ['/usr/bin/bash'] }
              }
            }
          }
        }
      }
    });

    wrapper.vm.addExecutable('audit-scanner');
    const allowed = wrapper.vm.value.spec.rulesByContainer['audit-scanner'].executables.allowed;

    expect(allowed).toContain('');
    expect(allowed.length).toBe(2);
  });
});