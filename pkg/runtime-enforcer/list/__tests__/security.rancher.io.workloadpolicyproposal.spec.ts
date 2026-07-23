import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { nextTick } from 'vue';

const mockGetPolicyProposalHeaders = jest.fn(() => []);
const mockGetContainerTableHeaders = jest.fn(() => []);
const mockStoreDispatch = jest.fn(() => Promise.resolve());

jest.mock('@runtime-enforcer/config/policy-proposals-table', () => ({
  getPolicyProposalHeaders: (input: unknown) => mockGetPolicyProposalHeaders(input),
  getContainerTableHeaders: () => mockGetContainerTableHeaders(),
}));

jest.mock('lodash', () => ({
  __esModule: true,
  default:    { debounce: (fn: Function) => fn },
}));

jest.mock('@shell/config/types', () => ({
  WORKLOAD_KINDS: {
    DEPLOYMENT: 'Deployment',
    DAEMON_SET: 'DaemonSet',
  },
}));

jest.mock('@components/Banner/Banner.vue', () => ({
  __esModule: true,
  default:    { name: 'Banner', template: '<div><slot /></div>' },
}));

jest.mock('@shell/components/PaginatedResourceTable', () => ({
  __esModule: true,
  default:    {
    name:  'PaginatedResourceTable',
    props: {
      localFilter: Object,
      apiFilter:   Object,
      headers:     Object,
      schema:      Object,
    },
    template: '<div class="table-stub"><slot name="header-left" /></div>'
  },
}));

jest.mock('@shell/components/form/LabeledSelect', () => ({
  __esModule: true,
  default:    { name: 'LabeledSelect', template: '<div />' },
}));

jest.mock('@shell/components/SortableTable', () => ({
  __esModule: true,
  default:    { name: 'SortableTable', template: '<div />' },
}));

jest.mock('@components/RcButton/RcButton.vue', () => ({
  __esModule: true,
  default:    { name: 'RcButton', template: '<button><slot /></button>' },
}));

jest.mock('@shell/types/store/pagination.types', () => ({
  PaginationFilterField: class PaginationFilterField {
    field: string;
    value: string;
    equals: boolean;
    exact: boolean;

    constructor(input: { field: string; value: string; equals: boolean; exact: boolean }) {
      this.field = input.field;
      this.value = input.value;
      this.equals = input.equals;
      this.exact = input.exact;
    }
  },
  PaginationParamFilter: { createMultipleFields: (fields: unknown[]) => ({ fields }) },
}));

const PolicyProposalList = require('../security.rancher.io.workloadpolicyproposal.vue').default;

type MakeWrapperOptions = {
  canCreate?: boolean;
};

function makeWrapper(options: MakeWrapperOptions = {}) {
  const { canCreate = false } = options;

  const store = createStore({
    getters: {
      'i18n/t':            () => (key: string) => key,
      'cluster/schemaFor': () => () => ({ canCreate }),
    },
  });

  (store as any).dispatch = mockStoreDispatch;

  return shallowMount(PolicyProposalList, {
    global: {
      plugins: [store],
      stubs:   {
        Banner:                 true,
        RcButton:               true,
        LabeledSelect:          true,
        SortableTable:          true,
        PaginatedResourceTable: {
          name:     'PaginatedResourceTable',
          template: '<div class="table-stub"><slot name="header-left" /></div>',
        },
      },
    },
  });
}

describe('security.rancher.io.workloadpolicyproposal list', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('passes canPromote=false to header builder when schema does not allow create', () => {
    makeWrapper({ canCreate: false });

    expect(mockGetPolicyProposalHeaders).toHaveBeenCalled();
    expect(mockGetPolicyProposalHeaders).toHaveBeenLastCalledWith({ canPromote: false });
  });

  it('passes canPromote=true to header builder when schema allows create', () => {
    makeWrapper({ canCreate: true });

    expect(mockGetPolicyProposalHeaders).toHaveBeenCalled();
    expect(mockGetPolicyProposalHeaders).toHaveBeenLastCalledWith({ canPromote: true });
  });

  it('builds workload type options with Any entry and workload kinds', () => {
    const wrapper = makeWrapper({ canCreate: false });

    expect(wrapper.vm.workloadTypeOptions).toEqual([
      { value: 'any', label: 'runtimeEnforcer.policyProposals.filters.any' },
      { value: 'Deployment', label: 'Deployment' },
      { value: 'DaemonSet', label: 'DaemonSet' },
    ]);
  });

  it('resolves workload owner reference, name, and type with fallback', () => {
    const wrapper = makeWrapper({ canCreate: false });
    const rowWithOwner = { metadata: { ownerReferences: [{ name: 'nginx-app', kind: 'Deployment' }] } };
    const rowWithoutOwner = { metadata: {} };

    expect(wrapper.vm.getWorkloadOwnerReference(rowWithOwner)).toEqual({ name: 'nginx-app', kind: 'Deployment' });
    expect(wrapper.vm.getWorkloadName(rowWithOwner)).toBe('nginx-app');
    expect(wrapper.vm.getWorkloadType(rowWithOwner)).toBe('Deployment');

    expect(wrapper.vm.getWorkloadOwnerReference(rowWithoutOwner)).toBeUndefined();
    expect(wrapper.vm.getWorkloadName(rowWithoutOwner)).toBe('runtimeEnforcer.policyProposals.fallback.na');
    expect(wrapper.vm.getWorkloadType(rowWithoutOwner)).toBe('runtimeEnforcer.policyProposals.fallback.na');
  });

  it('normalizes filter selection values for string/object/invalid input', () => {
    const wrapper = makeWrapper({ canCreate: false });

    expect(wrapper.vm.filterSelectionValue('Deployment')).toBe('Deployment');
    expect(wrapper.vm.filterSelectionValue({ value: 'DaemonSet', label: 'DaemonSet' })).toBe('DaemonSet');
    expect(wrapper.vm.filterSelectionValue({ label: 'No Value' })).toBe('');
    expect(wrapper.vm.filterSelectionValue(null)).toBe('');
  });

  it('filters rows locally using policy/workload text and workloadType option object', async() => {
    const wrapper = makeWrapper({ canCreate: false });

    wrapper.vm.filters.policySearch = 'policy-a';
    wrapper.vm.filters.workloadSearch = 'nginx';
    wrapper.vm.filters.workloadType = { value: 'Deployment', label: 'Deployment' };
    await nextTick();

    const rows = [
      {
        metadata: {
          name:            'policy-a',
          ownerReferences: [{ name: 'nginx-app', kind: 'Deployment' }],
        },
      },
      {
        metadata: {
          name:            'policy-b',
          ownerReferences: [{ name: 'redis-app', kind: 'StatefulSet' }],
        },
      },
    ];

    const result = wrapper.vm.filterRowsLocal(rows);

    expect(result).toHaveLength(1);
    expect(result[0].metadata.name).toBe('policy-a');
  });

  it('keeps rows when workloadType filter is Any', async() => {
    const wrapper = makeWrapper({ canCreate: false });

    wrapper.vm.filters.policySearch = '';
    wrapper.vm.filters.workloadSearch = '';
    wrapper.vm.filters.workloadType = { value: 'any', label: 'Any' };
    await nextTick();

    const rows = [
      {
        metadata: {
          name:            'policy-a',
          ownerReferences: [{ name: 'nginx-app', kind: 'Deployment' }],
        },
      },
      {
        metadata: {
          name:            'policy-b',
          ownerReferences: [{ name: 'redis-app', kind: 'StatefulSet' }],
        },
      },
    ];

    const result = wrapper.vm.filterRowsLocal(rows);

    expect(result).toHaveLength(2);
  });

  it('builds API filter fields from debounced filters with workloadType option object', async() => {
    const wrapper = makeWrapper({ canCreate: false });

    wrapper.vm.filters.policySearch = 'policy-a';
    wrapper.vm.filters.workloadSearch = 'nginx';
    wrapper.vm.filters.workloadType = { value: 'Deployment', label: 'Deployment' };
    await nextTick();

    const pagination = { filters: [] as any[] };

    const result = wrapper.vm.filterRowsApi(pagination);

    expect(result.filters).toHaveLength(1);
    expect(result.filters[0].fields).toHaveLength(3);
    expect(result.filters[0].fields[0]).toMatchObject({ field: 'metadata.name', value: 'policy-a' });
    expect(result.filters[0].fields[1]).toMatchObject({ field: 'metadata.ownerReferences.0.name', value: 'nginx' });
    expect(result.filters[0].fields[2]).toMatchObject({ field: 'metadata.ownerReferences.0.kind', value: 'Deployment' });
  });

  it('sets empty workloadType API filter value when Any is selected', async() => {
    const wrapper = makeWrapper({ canCreate: false });

    wrapper.vm.filters.workloadType = { value: 'any', label: 'Any' };
    await nextTick();

    const pagination = { filters: [] as any[] };
    const result = wrapper.vm.filterRowsApi(pagination);

    expect(result.filters[0].fields[2]).toMatchObject({ field: 'metadata.ownerReferences.0.kind', value: '' });
  });

  it('updates selected rows on selection change, including empty fallback', () => {
    const wrapper = makeWrapper({ canCreate: false });
    const selected = [{ metadata: { name: 'policy-a' } }];

    wrapper.vm.onSelectionChange(selected);
    expect(wrapper.vm.selectedRows).toEqual(selected);

    wrapper.vm.onSelectionChange(undefined);
    expect(wrapper.vm.selectedRows).toEqual([]);
  });

  it('does not open export modal when no selected rows', () => {
    const wrapper = makeWrapper({ canCreate: false });

    (wrapper.vm as any).selectedRows = [];
    (wrapper.vm as any).exportSelected();

    expect(mockStoreDispatch).not.toHaveBeenCalled();
  });

  it('opens export modal with selected rows', () => {
    const wrapper = makeWrapper({ canCreate: false });
    const selected = [{ metadata: { name: 'policy-a' } }];

    (wrapper.vm as any).selectedRows = selected;
    (wrapper.vm as any).exportSelected();

    expect(mockStoreDispatch).toHaveBeenCalledWith('cluster/promptModal', {
      component:  'ExportPolicyDialog',
      resources:  selected,
      modalWidth: '640',
    });
  });
});