import { mount } from '@vue/test-utils';
import { createStore } from 'vuex';
import AllowedExecutablesTable from '../AllowedExecutablesTable.vue';

describe('AllowedExecutablesTable.vue', () => {
  let store: any;

  beforeEach(() => {
    store = createStore({
      getters: {
        'i18n/t': () => (key: string) => key,
      },
    });
  });

  const createWrapper = (props = {}) => {
    return mount(AllowedExecutablesTable, {
      global: {
        plugins: [store],
        stubs: {
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
                      <slot name="col:executable" :row="row">
                        <td>{{ row.executable }}</td>
                      </slot>
                      <td>{{ row.container }}</td>
                      <slot name="col:image" :row="row">
                        <td>{{ row.image }}</td>
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
      props: {
        rulesByContainer: {},
        ...props,
      },
    });
  };

  it('renders the component and passes correctly configured props to SortableTable', () => {
    const wrapper = createWrapper();
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });

    expect(sortableTable.exists()).toBe(true);
    expect(sortableTable.props('keyField')).toBe('id');
    expect(sortableTable.props('tableActions')).toBe(false);
    expect(sortableTable.props('rowActions')).toBe(false);
    expect(sortableTable.props('search')).toBe(false);
    expect(sortableTable.props('paging')).toBe(false);
  });

  it('correctly maps rulesByContainer and imageMap into table rows', () => {
    const rulesByContainer = {
      'nginx-controller': {
        executables: {
          allowed: ['/usr/sbin/nginx', '/usr/bin/curl'],
        },
      },
      'sidecar-agent': {
        executables: {
          allowed: ['/bin/agent'],
        },
      },
    };

    const imageMap = {
      'nginx-controller': 'registry.k8s.io/ingress-nginx/controller:v1.10.0',
      'sidecar-agent': 'quay.io/sidecar:v1.0.0',
    };

    const wrapper = createWrapper({ rulesByContainer, imageMap });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const rows = sortableTable.props('rows');

    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      id: 'nginx-controller-0-/usr/sbin/nginx',
      executable: '/usr/sbin/nginx',
      container: 'nginx-controller',
      image: 'registry.k8s.io/ingress-nginx/controller:v1.10.0',
    });
    expect(rows[1]).toEqual({
      id: 'nginx-controller-1-/usr/bin/curl',
      executable: '/usr/bin/curl',
      container: 'nginx-controller',
      image: 'registry.k8s.io/ingress-nginx/controller:v1.10.0',
    });
    expect(rows[2]).toEqual({
      id: 'sidecar-agent-0-/bin/agent',
      executable: '/bin/agent',
      container: 'sidecar-agent',
      image: 'quay.io/sidecar:v1.0.0',
    });
  });

  it('renders empty array rows gracefully when rulesByContainer is missing or empty', () => {
    const wrapper = createWrapper({ rulesByContainer: null });
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });

    expect(sortableTable.props('rows')).toEqual([]);
  });

  it('renders executable path inside an executable-pill badge', () => {
    const rulesByContainer = {
      app: {
        executables: {
          allowed: ['/usr/bin/app-binary'],
        },
      },
    };

    const wrapper = createWrapper({ rulesByContainer });
    const pill = wrapper.find('.executable-pill');

    expect(pill.exists()).toBe(true);
    expect(pill.text()).toBe('/usr/bin/app-binary');
  });

  it('renders image text with "image: " prefix when image is present', () => {
    const rulesByContainer = {
      web: { executables: { allowed: ['/usr/bin/web'] } },
    };
    const imageMap = {
      web: 'nginx:latest',
    };

    const wrapper = createWrapper({ rulesByContainer, imageMap });
    expect(wrapper.text()).toContain('image: nginx:latest');
  });

  it('renders fallback hyphen (-) when image is missing for container', () => {
    const rulesByContainer = {
      web: { executables: { allowed: ['/usr/bin/web'] } },
    };

    const wrapper = createWrapper({ rulesByContainer, imageMap: {} });
    const mutedSpan = wrapper.find('span.text-muted');

    expect(mutedSpan.exists()).toBe(true);
    expect(mutedSpan.text()).toBe('-');
  });

  it('defines headers with expected i18n keys and sort configurations', () => {
    const wrapper = createWrapper();
    const sortableTable = wrapper.findComponent({ name: 'SortableTable' });
    const headers = sortableTable.props('headers');

    expect(headers).toEqual([
      {
        name: 'executable',
        value: 'executable',
        label: 'runtimeEnforcer.activePolicy.allowedExecutables.table.executable',
        sort: 'executable',
      },
      {
        name: 'container',
        value: 'container',
        label: 'runtimeEnforcer.activePolicy.allowedExecutables.table.container',
        sort: 'container',
      },
      {
        name: 'image',
        value: 'image',
        label: 'runtimeEnforcer.activePolicy.allowedExecutables.table.image',
        sort: 'image',
      },
    ]);
  });
});