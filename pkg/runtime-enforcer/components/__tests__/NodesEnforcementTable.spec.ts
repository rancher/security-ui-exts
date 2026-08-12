import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import NodesEnforcementTable from '../NodesEnforcementTable.vue';

describe('NodesEnforcementTable.vue', () => {
  let store: any;

  beforeEach(() => {
    store = createStore({
      getters: {
        'i18n/t': () => (key: string) => key,
      },
    });
  });

  const createWrapper = (props = {}) => {
    return mount(NodesEnforcementTable, {
      global: {
        plugins: [store],
        directives: {
          cleanTooltip: () => {},
        },
        stubs: {
          StatusBadge: {
            name: 'StatusBadge',
            template: '<div class="status-badge-stub">{{ status }}</div>',
            props: ['status'],
          },
          SortableTable: {
            name: 'SortableTable',
            template: `
              <div class="sortable-table-stub">
                <table>
                  <thead>
                    <tr>
                      <th v-for="h in headers" :key="h.name">{{ h.label }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in rows" :key="row.id">
                      <slot name="col:status" :row="row">
                        <td>{{ row.status }}</td>
                      </slot>
                      <slot name="col:since" :row="row">
                        <td>{{ row.since }}</td>
                      </slot>
                      <td>{{ row.node }}</td>
                      <slot name="col:issueCode" :row="row">
                        <td>{{ row.issueCode }}</td>
                      </slot>
                      <slot name="col:message" :row="row">
                        <td>{{ row.message }}</td>
                      </slot>
                    </tr>
                  </tbody>
                </table>
              </div>
            `,
            props: ['rows', 'headers', 'keyField', 'tableActions', 'rowActions', 'search', 'paging'],
          },
        },
      },
      props,
    });
  };

  it('renders the component and configures SortableTable correctly', () => {
    const wrapper = createWrapper();
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });

    expect(sortableTable.exists()).toBe(true);
    expect(sortableTable.props('keyField')).toBe('id');
    expect(sortableTable.props('tableActions')).toBe(false);
    expect(sortableTable.props('rowActions')).toBe(false);
    expect(sortableTable.props('search')).toBe(false);
    expect(sortableTable.props('paging')).toBe(false);
  });

  it('correctly maps nodesWithIssues into table rows and formats dates in UTC', () => {
    const status = {
      nodesWithIssues: {
        'node-prod-eu-12': {
          code: 'EBPFVerifierRejected',
          message: 'verifier rejected program: unknown helper id 188',
          timestamp: '2026-06-15T09:45:00Z',
        },
      },
      totalNodes: 1,
      successfulNodes: 0,
    };

    const wrapper = createWrapper({ status });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const rows = sortableTable.props('rows');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id: 'failed-node-prod-eu-12',
      status: 'EBPFVerifierRejected',
      since: 'Jun 15, 2026 09:45 AM',
      node: 'node-prod-eu-12',
      issueCode: 'EBPFVerifierRejected',
      message: 'verifier rejected program: unknown helper id 188',
    });
  });

  it('maps transitioning and ready nodes gracefully', () => {
    const status = {
      nodesTransitioning: ['node-prod-eu-23'],
      totalNodes: 3,
      successfulNodes: 2,
    };

    const wrapper = createWrapper({ status });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const rows = sortableTable.props('rows');

    expect(rows).toHaveLength(3);

    // Transitioning row
    expect(rows[0]).toEqual({
      id: 'transitioning-node-prod-eu-23',
      status: 'Transitioning',
      since: '-',
      node: 'node-prod-eu-23',
      issueCode: '-',
      message: '-',
    });

    // Synthetic Ready rows
    expect(rows[1]).toEqual({
      id: 'ready-node-0',
      status: 'Ready',
      since: '-',
      node: 'node-1',
      issueCode: '-',
      message: '-',
    });
    expect(rows[2]).toEqual({
      id: 'ready-node-1',
      status: 'Ready',
      since: '-',
      node: 'node-2',
      issueCode: '-',
      message: '-',
    });
  });

  it('passes lowercased status to StatusBadge component', () => {
    const status = {
      totalNodes: 1,
      successfulNodes: 1,
    };

    const wrapper = createWrapper({ status });
    const statusBadge = wrapper.findComponent({ name: 'StatusBadge' });

    expect(statusBadge.exists()).toBe(true);
    expect(statusBadge.props('status')).toBe('ready');
  });

  it('applies error text styling for non-empty issue code', () => {
    const status = {
      nodesWithIssues: {
        'node-failed-1': {
          code: 'EBPFVerifierRejected',
          message: 'Error message',
        },
      },
    };

    const wrapper = createWrapper({ status });
    const issueCodeSpan = wrapper.find('.text-error.font-mono');

    expect(issueCodeSpan.exists()).toBe(true);
    expect(issueCodeSpan.text()).toBe('EBPFVerifierRejected');
  });

  it('renders fallback hyphens for missing optional fields', () => {
    const status = {
      nodesWithIssues: {
        'node-failed-1': {
          code: '',
          message: '',
        },
      },
    };

    const wrapper = createWrapper({ status });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const rows = sortableTable.props('rows');

    expect(rows[0].since).toBe('-');
    expect(rows[0].issueCode).toBe('-');
    expect(rows[0].message).toBe('-');
  });

  it('defines headers with expected translation keys and configurations', () => {
    const wrapper = createWrapper();
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const headers = sortableTable.props('headers');

    expect(headers).toEqual([
      {
        name: 'status',
        value: 'status',
        label: 'runtimeEnforcer.activePolicy.nodesEnforcement.table.status',
        sort: 'status',
        width: 120,
      },
      {
        name: 'since',
        value: 'since',
        label: 'runtimeEnforcer.activePolicy.nodesEnforcement.table.since',
        sort: 'since',
        width: 180,
      },
      {
        name: 'node',
        value: 'node',
        label: 'runtimeEnforcer.activePolicy.nodesEnforcement.table.node',
        sort: 'node',
        width: 180,
      },
      {
        name: 'issueCode',
        value: 'issueCode',
        label: 'runtimeEnforcer.activePolicy.nodesEnforcement.table.issueCode',
        sort: 'issueCode',
        width: 200,
      },
      {
        name: 'message',
        value: 'message',
        label: 'runtimeEnforcer.activePolicy.nodesEnforcement.table.message',
        sort: 'message',
      },
    ]);
  });
});