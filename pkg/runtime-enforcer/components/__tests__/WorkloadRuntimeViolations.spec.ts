import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import WorkloadRuntimeViolations from '../WorkloadRuntimeViolations.vue';
import { RESOURCE, POLICY_LABEL_KEY, POLICY_MODE, PRODUCT_NAME } from '../../types/runtime-enforcer';

jest.mock('@components/Banner/Banner.vue', () => ({
  name:     'Banner',
  template: '<div class="banner-stub"><slot /></div>',
  props:    ['color'],
}));

jest.mock('@components/RcButton/RcButton.vue', () => ({
  name:     'RcButton',
  template: '<button class="rc-button-stub" @click="$emit(\'click\')"><slot /></button>',
  props:    ['variant', 'size', 'left-icon'],
}));

jest.mock('@shell/components/RichTranslation.vue', () => ({
  name:     'RichTranslation',
  template: '<span class="rich-translation-stub"><slot name="policy" /><slot name="mode" /><slot name="documentation" :content="\'documentation\'" /></span>',
  props:    ['k'],
}));

jest.mock('@shell/components/SubtleLink.vue', () => ({
  name:     'SubtleLink',
  template: '<a :href="href" target="_blank"><slot /></a>',
  props:    ['href', 'open-in-new-tab-label'],
}));

describe('WorkloadRuntimeViolations.vue', () => {
  let store: any;
  let dispatchSpy: jest.SpyInstance;

  const mockWorkload = {
    metadata: {
      name:      'aks-config-operator',
      namespace: 'cattle-system',
    },
    spec: {
      template: {
        metadata: {
          labels: { [POLICY_LABEL_KEY]: 'strict-db' },
        },
        spec: {
          containers: [
            { name: 'cronjob-nightly-etl', image: 'quay.io/cauth2-proxy:v7.6.0' },
          ],
        },
      },
    },
  };

  const mockPolicy = {
    metadata: {
      name:      'strict-db',
      namespace: 'cattle-system',
    },
    spec: {
      mode: POLICY_MODE.PROTECT,
    },
    status: {
      activeViolationCount: 1,
      violationCount:       60,
      violations:           [
        {
          containerName:          'cronjob-nightly-etl',
          executablePath:         '/usr/bin/curl-ext',
          occurrences:            60,
          nodeName:               'node-prod-eu-12',
          lastObservedTimestamp:  '2026-06-15T09:45:00Z',
          firstObservedTimestamp: '2026-05-15T09:45:00Z',
        },
      ],
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    store = createStore({
      getters: {
        'cluster/all': () => (type: string) => {
          if (type === RESOURCE.ACTIVE_POLICIES) {
            return [mockPolicy];
          }
          return [];
        },
        'i18n/t':         () => (key: string) => key,
        'currentCluster': () => ({ id: 'local' }),
      },
    });

    dispatchSpy = jest.spyOn(store, 'dispatch').mockResolvedValue([]);
  });

  const createWrapper = (props = {}, options: Record<string, any> = {}) => {
    return shallowMount(WorkloadRuntimeViolations, {
      props: {
        value: mockWorkload,
        ...props,
      },
      global: {
        plugins: [store],
        mocks:   {
          $store:  store,
          $route:  { params: { cluster: 'local' } },
          $router: { resolve: jest.fn(() => ({ href: '/c/local/runtimeEnforcer/active-policy/strict-db' })) },
          t:       (key: string) => key,
        },
        stubs: {
          SortableTable: {
            name:     'SortableTable',
            template: '<div class="sortable-table-stub"><slot name="col:executable" :row="rows[0]" /><slot name="col:image" :row="rows[0]" /><slot name="col:lastObservedTimestamp" :row="rows[0]" /><slot name="col:firstObservedTimestamp" :row="rows[0]" /></div>',
            props:    ['rows', 'headers', 'search', 'paging', 'defaultSortBy', 'defaultSortOrder'],
          },
          LiveDate: {
            name:     'LiveDate',
            template: '<span class="live-date-stub">{{ value }}</span>',
            props:    ['value', 'addSuffix'],
          },
        },
        ...options,
      },
    });
  };

  it('renders violation table and banner when bound policy is present', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('.workload-runtime-violations').exists()).toBe(true);
    expect(wrapper.find('.unprotected-banner').exists()).toBe(false);
    expect(wrapper.find('.policy-info-banner').exists()).toBe(true);
  });

  it('renders unprotected message when workload has no matching policy', () => {
    const unprotectedWorkload = {
      metadata: { name: 'standalone-app', namespace: 'default' },
      spec:     { template: { metadata: { labels: {} } } },
    };
    const wrapper = createWrapper({ value: unprotectedWorkload });

    expect(wrapper.find('.workload-runtime-violations').exists()).toBe(false);
    expect(wrapper.find('.unprotected-banner').exists()).toBe(true);
    expect(wrapper.text()).toContain('runtimeEnforcer.workloadViolations.unprotected');
  });

  it('resolves workload from resource prop if value prop metadata is missing', () => {
    const wrapper = createWrapper({
      value:    {},
      resource: mockWorkload,
    });

    expect(wrapper.vm.workload).toEqual(mockWorkload);
    expect(wrapper.vm.boundPolicy).toEqual(mockPolicy);
  });

  it('correctly maps violation items into table rows with matching images', () => {
    const wrapper = createWrapper();
    const rows = wrapper.vm.rows;

    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual({
      id:                     'cronjob-nightly-etl-/usr/bin/curl-ext-0',
      executable:             '/usr/bin/curl-ext',
      occurrences:            60,
      container:              'cronjob-nightly-etl',
      image:                  'quay.io/cauth2-proxy:v7.6.0',
      node:                   'node-prod-eu-12',
      lastObservedTimestamp:  '2026-06-15T09:45:00Z',
      firstObservedTimestamp: '2026-05-15T09:45:00Z',
      containerName:          'cronjob-nightly-etl',
      executablePath:         '/usr/bin/curl-ext',
    });
  });

  it('resolves image map across standard templates, job templates, and direct pod specs', () => {
    const cronJobWorkload = {
      metadata: { name: 'cron', namespace: 'cattle-system' },
      spec:     {
        jobTemplate: {
          spec: {
            template: {
              metadata: { labels: { [POLICY_LABEL_KEY]: 'strict-db' } },
              spec:     { containers: [{ name: 'job-worker', image: 'worker:v1' }] },
            },
          },
        },
      },
    };
    const wrapper = createWrapper({ value: cronJobWorkload });

    expect(wrapper.vm.imageMap).toEqual({ 'job-worker': 'worker:v1' });
  });

  it('computes correct mode labels for protect, monitor, and fallback modes', () => {
    const wrapper = createWrapper();

    expect(wrapper.vm.modeLabel).toBe('runtimeEnforcer.activePolicies.mode.protect');

    mockPolicy.spec.mode = POLICY_MODE.MONITOR;
    const monitorWrapper = createWrapper();

    expect(monitorWrapper.vm.modeLabel).toBe('runtimeEnforcer.activePolicies.mode.monitor');

    mockPolicy.spec.mode = 'custom';
    const fallbackWrapper = createWrapper();

    expect(fallbackWrapper.vm.modeLabel).toBe('custom');

    mockPolicy.spec.mode = POLICY_MODE.PROTECT;
  });

  it('configures SortableTable with search disabled and sorted by occurrences descending', () => {
    const wrapper = createWrapper();
    const table = wrapper.findComponent({ name: 'SortableTable' });

    expect(table.props('search')).toBe(false);
    expect(table.props('paging')).toBe(true);
    expect(table.props('defaultSortBy')).toBe('occurrences');
    expect(table.props('defaultSortOrder')).toBe('desc');
  });

  it('dispatches cluster/findAll during fetch when store has no active policies', async() => {
    const emptyStore = createStore({
      getters: {
        'cluster/all':    () => () => [],
        'i18n/t':         () => (key: string) => key,
        'currentCluster': () => ({ id: 'local' }),
      },
    });
    const emptyDispatchSpy = jest.spyOn(emptyStore, 'dispatch').mockResolvedValue([]);

    const wrapper = shallowMount(WorkloadRuntimeViolations, {
      props:  { value: mockWorkload },
      global: {
        plugins: [emptyStore],
        mocks:   {
          $store: emptyStore,
          $route: { params: { cluster: 'local' } },
          t:      (key: string) => key,
        },
        stubs: { SortableTable: true, Banner: true, RcButton: true, RichTranslation: true },
      },
    });

    await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
    expect(emptyDispatchSpy).toHaveBeenCalledWith('cluster/findAll', { type: RESOURCE.ACTIVE_POLICIES });
  });

  it('does not dispatch cluster/findAll during fetch when active policies exist', async() => {
    const wrapper = createWrapper();

    await (wrapper.vm as any).$options.fetch.call(wrapper.vm);
    expect(dispatchSpy).not.toHaveBeenCalledWith('cluster/findAll', { type: RESOURCE.ACTIVE_POLICIES });
  });
});