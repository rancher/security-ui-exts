import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import ViolationsTable from '../ViolationsTable.vue';

jest.mock('@components/RcButton/RcButton.vue', () => ({
  __esModule: true,
  default:    {
    name:     'RcButton',
    template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
    props:    ['disabled', 'variant'],
    emits:    ['click'],
  },
}));

describe('ViolationsTable.vue', () => {
  let store: any;

  beforeEach(() => {
    store = createStore({
      getters: {
        'i18n/t': () => (key: string) => key,
      },
    });
  });

  const createWrapper = (props = {}) => {
    return mount(ViolationsTable, {
      global: {
        plugins: [store],
        stubs:   {
          SortableTable: {
            name:     'SortableTable',
            template: `
              <div class="sortable-table-stub">
                <slot name="header-left" />
                <table>
                  <thead>
                    <tr>
                      <th v-for="h in headers" :key="h.name">{{ h.label }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in rows" :key="row.id">
                      <slot name="col:executable" :row="row">
                        <td>{{ row.executable }}</td>
                      </slot>
                      <td>{{ row.occurrences }}</td>
                      <td>{{ row.container }}</td>
                      <slot name="col:image" :row="row">
                        <td>{{ row.image }}</td>
                      </slot>
                      <td>{{ row.node }}</td>
                      <slot name="col:lastObservedTimestamp" :row="row">
                        <td>{{ row.lastObservedTimestamp }}</td>
                      </slot>
                      <slot name="col:firstObservedTimestamp" :row="row">
                        <td>{{ row.firstObservedTimestamp }}</td>
                      </slot>
                      <slot name="col:allow" :row="row">
                        <td></td>
                      </slot>
                    </tr>
                  </tbody>
                </table>
              </div>
            `,
            props: ['rows', 'headers', 'keyField', 'tableActions', 'rowActions', 'search', 'searchFields', 'paging'],
            emits: ['selection'],
          },
          LiveDate: {
            name:     'LiveDate',
            template: '<span class="live-date-stub">{{ value }}</span>',
            props:    ['value', 'addSuffix'],
          },
        },
      },
      props: { policy: { allowExecutables: jest.fn() }, ...props },
    });
  };

  it('renders the component and configures SortableTable correctly', () => {
    const wrapper = createWrapper();
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });

    expect(sortableTable.exists()).toBe(true);
    expect(sortableTable.props('keyField')).toBe('id');
    expect(sortableTable.props('tableActions')).toBe(true);
    expect(sortableTable.props('rowActions')).toBe(false);
    expect(sortableTable.props('search')).toBe(true);
    expect(sortableTable.props('paging')).toBe(false);
  });

  it('maps violation records into table rows', () => {
    const violations = [
      {
        containerName:          'nginx',
        executablePath:         '/usr/bin/curl-ext',
        occurrences:            60,
        nodeName:               'node-prod-eu-12',
        lastObservedTimestamp:  '2026-06-15T09:45:00Z',
        firstObservedTimestamp: '2026-05-15T09:45:00Z',
      },
    ];

    const wrapper = createWrapper({ violations, imageMap: { nginx: 'registry.k8s.io/nginx:v1' } });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const rows = sortableTable.props('rows');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id:                     'nginx-/usr/bin/curl-ext-0',
      executable:             '/usr/bin/curl-ext',
      occurrences:            60,
      container:              'nginx',
      image:                  'registry.k8s.io/nginx:v1',
      node:                   'node-prod-eu-12',
      lastObservedTimestamp:  '2026-06-15T09:45:00Z',
      firstObservedTimestamp: '2026-05-15T09:45:00Z',
      containerName:          'nginx',
      executablePath:         '/usr/bin/curl-ext',
    });
  });

  it('renders an empty row set when there are no violations', () => {
    const wrapper = createWrapper({ violations: [] });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });

    expect(sortableTable.props('rows')).toHaveLength(0);
  });

  it('calls policy.allowExecutables with a single target when a row Allow button is clicked', async () => {
    const allowExecutables = jest.fn();
    const violations = [
      { containerName: 'nginx', executablePath: '/usr/bin/curl-ext' },
    ];

    const wrapper = createWrapper({ policy: { allowExecutables }, violations });
    const allowButton = wrapper.find('tbody').findComponent({ name: 'RcButton' });

    await allowButton.trigger('click');

    expect(allowExecutables).toHaveBeenCalledWith([
      expect.objectContaining({ containerName: 'nginx', executablePath: '/usr/bin/curl-ext' }),
    ]);
  });

  it('calls policy.allowExecutables with all selected rows when the bulk Allow button is clicked', async () => {
    const allowExecutables = jest.fn();
    const violations = [
      { containerName: 'nginx', executablePath: '/usr/bin/curl-ext' },
      { containerName: 'nginx', executablePath: '/usr/sbin/nginx-controller' },
    ];

    const wrapper = createWrapper({ policy: { allowExecutables }, violations });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const rows = sortableTable.props('rows');

    sortableTable.vm.$emit('selection', rows);
    await wrapper.vm.$nextTick();

    const bulkAllowButton = wrapper.findAllComponents({ name: 'RcButton' })[0];

    await bulkAllowButton.trigger('click');

    expect(allowExecutables).toHaveBeenCalledWith(rows);
  });

  it('disables the bulk Allow button when nothing is selected', () => {
    const wrapper = createWrapper({ violations: [] });
    const bulkAllowButton = wrapper.findAllComponents({ name: 'RcButton' })[0];

    expect(bulkAllowButton.props('disabled')).toBe(true);
  });
});
