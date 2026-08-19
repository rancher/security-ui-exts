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
          code: 'Failed',
          message: 'verifier rejected program: unknown helper id 188',
          since: '2026-06-15T09:45:00Z',
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
      id:      'failed-node-prod-eu-12',
      status:  'Failed',
      since:   'Jun 15, 2026 09:45 AM',
      node:    'node-prod-eu-12',
      message: 'verifier rejected program: unknown helper id 188',
    });
  });

  it('correctly maps nodesTransitioning objects into table rows with a per-node since', () => {
    const status = {
      nodesTransitioning: [
        { nodeName: 'node-prod-eu-23', code: 'Transitioning', since: '2026-06-28T17:00:00Z' },
      ],
      totalNodes: 1,
      successfulNodes: 0,
    };

    const wrapper = createWrapper({ status });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const rows = sortableTable.props('rows');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id:      'transitioning-node-prod-eu-23',
      status:  'Transitioning',
      since:   'Jun 28, 2026 05:00 PM',
      node:    'node-prod-eu-23',
      message: '-',
    });
  });

  it('renders a single aggregate row for ready nodes instead of fabricating per-node rows', () => {
    const status = { totalNodes: 5, successfulNodes: 5 };

    const wrapper = createWrapper({ status });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const rows = sortableTable.props('rows');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      id:     'ready-nodes',
      status: 'Ready',
      since:  '-',
      node:   '-',
    });
    expect(rows[0].message).toContain('5');
  });

  it('omits the ready row entirely when there are no successful nodes', () => {
    const status = {
      nodesWithIssues: { 'node-1': { code: 'Failed', message: 'boom', since: '2026-06-15T09:45:00Z' } },
      totalNodes: 1,
      successfulNodes: 0,
    };

    const wrapper = createWrapper({ status });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const rows = sortableTable.props('rows');

    expect(rows.find((row: any) => row.id === 'ready-nodes')).toBeUndefined();
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
        width: 140,
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