import { shallowMount } from '@vue/test-utils';
import DeploymentDetailRuntimeSecurity from '../DeploymentDetailRuntimeSecurity.vue';

describe('DeploymentDetailRuntimeSecurity.vue', () => {
  const mockWorkload = {
    metadata: {
      name:      'aks-config-operator',
      namespace: 'cattle-system',
    },
    spec: {
      template: {
        metadata: {
          labels: { 'security.rancher.io/policy': 'strict-db' },
        },
      },
    },
  };

  const createWrapper = (props = {}) => {
    return shallowMount(DeploymentDetailRuntimeSecurity, {
      props,
      global: {
        mocks: {
          t: (key: string) => key,
        },
        stubs: {
          RuntimeSecurityCell: {
            name:     'RuntimeSecurityCell',
            template: '<div class="runtime-security-cell-stub" />',
            props:    ['row'],
          },
        },
      },
    });
  };

  it('renders the row and passes workload to RuntimeSecurityCell when value prop is provided', () => {
    const wrapper = createWrapper({ value: mockWorkload });

    expect(wrapper.find('.deployment-runtime-security-row').exists()).toBe(true);
    expect(wrapper.find('.detail-label').text()).toBe(
      'runtimeEnforcer.tableColumns.runtimeSecurity.header'
    );

    const cell = wrapper.findComponent({ name: 'RuntimeSecurityCell' });
    expect(cell.exists()).toBe(true);
    expect(cell.props('row')).toEqual(mockWorkload);
  });

  it('falls back to resource prop when value prop is not provided', () => {
    const wrapper = createWrapper({ resource: mockWorkload });

    expect(wrapper.find('.deployment-runtime-security-row').exists()).toBe(true);
    const cell = wrapper.findComponent({ name: 'RuntimeSecurityCell' });
    expect(cell.exists()).toBe(true);
    expect(cell.props('row')).toEqual(mockWorkload);
  });

  it('prefers value prop over resource prop when both are provided', () => {
    const valueWorkload = { metadata: { name: 'workload-from-value' } };
    const resourceWorkload = { metadata: { name: 'workload-from-resource' } };

    const wrapper = createWrapper({
      value:    valueWorkload,
      resource: resourceWorkload,
    });

    const cell = wrapper.findComponent({ name: 'RuntimeSecurityCell' });
    expect(cell.props('row')).toEqual(valueWorkload);
  });

  it('does not render the container row when neither value nor resource is provided', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.deployment-runtime-security-row').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'RuntimeSecurityCell' }).exists()).toBe(false);
  });
});