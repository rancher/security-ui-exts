import { shallowMount } from '@vue/test-utils';
import Dashboard from '../Dashboard.vue';

const RESOURCE = {
  REGISTRY: 'sbomscanner.kubewarden.io.registry',
  SCAN_JOB: 'sbomscanner.kubewarden.io.scanjob',
};

function makeScanJob({
  namespace = 'default',
  generateName = 'imagescan-',
  registry = 'my-registry',
  scannedImagesCount = 5,
  imagesCount = 10,
  completionTime = Date.now(),
  conditions =  [{ error: false }],
} = {}, withStatus = true) {
  if (withStatus) {
    return {
      metadata: { namespace, generateName },
      spec:     { registry },
      status:   {
        imagesCount,
        scannedImagesCount,
        completionTime,
        conditions,
      },
    };
  } else {
    return {
      metadata: { namespace, generateName },
      spec:     { registry },
    };
  }
}

describe('Dashboard.vue full coverage', () => {
  let storeMock: any;

  beforeEach(() => {
    storeMock = {
      dispatch: jest.fn().mockResolvedValue([]),
      getters:  {
        'cluster/all':          jest.fn(() => [makeScanJob()]),
        'activeNamespaceCache': { default: true },
      },
    };
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  function factory(options = {}) {
    return shallowMount(Dashboard, {
      global: {
        mocks: {
          $store:      storeMock,
          t:           (key: any) => key,
          $fetchState: { pending: false },
        },
      },
      ...options,
    });
  }

  it('renders component correctly', () => {
    const wrapper = factory();

    expect(wrapper.exists()).toBe(true);
    expect(wrapper.vm.selectedRegistry).toBe('All matching registries');
    expect(wrapper.vm.scanningStats.lastCompletionTimestamp).toBe(0);
  });

  it('computed: displayedCurrDate and displayedCurrTime return strings', () => {
    const wrapper = factory();

    expect(typeof wrapper.vm.displayedCurrDate).toBe('string');
    expect(typeof wrapper.vm.displayedCurrTime).toBe('string');
  });

  it('computed: displayedDetectedErrorCnt pluralization', () => {
    const wrapper = factory();

    wrapper.vm.scanningStats.detectedErrorCnt = 1;
    expect(wrapper.vm.displayedDetectedErrorCnt).toBe('1 typeLabel.error');
    wrapper.vm.scanningStats.detectedErrorCnt = 2;
    expect(wrapper.vm.displayedDetectedErrorCnt).toBe('2 typeLabel.error');
  });

  it('computed: displayedFailedImagesCnt pluralization', () => {
    const wrapper = factory();

    wrapper.vm.scanningStats.failedImagesCnt = 1;
    expect(wrapper.vm.displayedFailedImagesCnt).toBe('1 typeLabel.image');
    wrapper.vm.scanningStats.failedImagesCnt = 2;
    expect(wrapper.vm.displayedFailedImagesCnt).toBe('2 typeLabel.image');
  });

  it('computed: displayedTotalScannedImageCnt pluralization', () => {
    const wrapper = factory();

    wrapper.vm.scanningStats.totalScannedImageCnt = 1;
    expect(wrapper.vm.displayedTotalScannedImageCnt).toBe('1 typeLabel.image');
    wrapper.vm.scanningStats.totalScannedImageCnt = 3;
    expect(wrapper.vm.displayedTotalScannedImageCnt).toBe('3 typeLabel.image');
  });

  it('computed: durationFromLastScan handles all ranges', () => {
    const wrapper = factory();

    // initialDuration
    wrapper.vm.scanningStats.lastCompletionTimestamp = 0;
    expect(wrapper.vm.durationFromLastScan).toContain('initialDuration');

    // seconds
    wrapper.vm.scanningStats.lastCompletionTimestamp = Date.now() - 10 * 1000;
    expect(wrapper.vm.durationFromLastScan).toContain('typeLabel.second');

    // minutes
    wrapper.vm.scanningStats.lastCompletionTimestamp = Date.now() - 10 * 60 * 1000;
    expect(wrapper.vm.durationFromLastScan).toContain('typeLabel.minute');

    // hours
    wrapper.vm.scanningStats.lastCompletionTimestamp = Date.now() - 2 * 60 * 60 * 1000;
    expect(wrapper.vm.durationFromLastScan).toContain('typeLabel.hour');

    // days
    wrapper.vm.scanningStats.lastCompletionTimestamp = Date.now() - 3 * 24 * 60 * 60 * 1000;
    expect(wrapper.vm.durationFromLastScan).toContain('typeLabel.day');
  });

  it('method: getregistryOptions returns unique registry list', async() => {
    const wrapper = factory();

    await wrapper.setData({
      scanJobsCRD: [
        makeScanJob({ namespace: 'default', registry: 'reg1' }),
        makeScanJob({ namespace: 'default', registry: 'reg1' }),
      ],
    });

    wrapper.vm.getregistryOptions();

    const options = wrapper.vm.registryOptions;

    expect(options).toContain('All matching registries');
    expect(options).toContain('reg1');
    expect(options).toHaveLength(2);
  });

  it('method: getFailedImageCnt calculates correctly', () => {
    const wrapper = factory();

    const jobWithError = {
      status: {
        conditions: [{ error: true }], scannedImagesCount: 6, imagesCount: 10
      }
    };
    const jobWithoutError = {
      status: {
        conditions: [{ error: false }], scannedImagesCount: 8, imagesCount: 8
      }
    };

    expect(wrapper.vm.getFailedImageCnt(jobWithError)).toBe(4);
    expect(wrapper.vm.getFailedImageCnt(jobWithoutError)).toBe(0);
  });

  it('method: getFailedImageCnt calculates correctly - without status', () => {
    const wrapper = factory();

    const jobWithError = {
      status: {
        conditions: [{ error: true }], scannedImagesCount: 6, imagesCount: 10
      }
    };
    const jobWithoutError = {};

    expect(wrapper.vm.getFailedImageCnt(jobWithError)).toBe(4);
    expect(wrapper.vm.getFailedImageCnt(jobWithoutError)).toBe(0);
  });

  it('method: getScanningStats aggregates correctly', () => {
    const wrapper = factory();
    const jobs = [
      makeScanJob({
        conditions: [{ error: false }], scannedImagesCount: 5, imagesCount: 5, completionTime: 1761480970
      }),
      makeScanJob({
        conditions: [{ error: true }], scannedImagesCount: 3, imagesCount: 10, completionTime: 1761480098
      }),
    ];

    wrapper.vm.scanJobsCRD = jobs;
    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(8);
    expect(stats.detectedErrorCnt).toBe(1);
    expect(stats.failedImagesCnt).toBe(7);
    expect(stats.lastCompletionTimestamp).toBe(1761480970);
  });

  it('method: getScanningStats aggregates correctly - without status', () => {
    const wrapper = factory();
    const jobs = [
      makeScanJob({
        conditions: [{ error: true }], scannedImagesCount: 5, imagesCount: 6, completionTime: 1761480970
      }, false),
      makeScanJob({
        conditions: [{ error: true }], scannedImagesCount: 3, imagesCount: 10, completionTime: 1761480098
      }),
    ];

    wrapper.vm.scanJobsCRD = jobs;
    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(3);
    expect(stats.detectedErrorCnt).toBe(1);
    expect(stats.failedImagesCnt).toBe(7);
    expect(stats.lastCompletionTimestamp).toBe(1761480098);
  });

  it('method: getScanningStats aggregates correctly', () => {
    const wrapper = factory();
    const jobs = [
      {
        metadata: { namespace: 'default', generateName: 'imagescan-' }, spec: { registry: 'my-registry' }, status: { conditions: [{ error: false }] }
      },
      {
        metadata: { namespace: 'default', generateName: 'imagescan-' }, spec: { registry: 'my-registry' }, status: { conditions: [{ error: true }] }
      },
    ];

    wrapper.vm.scanJobsCRD = jobs;
    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(0);
    expect(stats.detectedErrorCnt).toBe(1);
    expect(stats.failedImagesCnt).toBe(0);
    expect(stats.lastCompletionTimestamp).toBe(0);
  });

  it('method: getScanningStats respects selectedRegistry filter', () => {
    const wrapper = factory();
    const jobs = [
      makeScanJob({
        registry:          'reg-a',
        scannedImagesCount: 2,
        imagesCount:       4,
        conditions:        [{ error: true }],
        completionTime:    1761480100,
      }),
      makeScanJob({
        registry:          'reg-b',
        scannedImagesCount: 5,
        imagesCount:       8,
        conditions:        [{ error: true }],
        completionTime:    1761480200,
      }),
    ];

    wrapper.vm.scanJobsCRD = jobs;
    wrapper.vm.selectedRegistry = 'reg-a';

    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(2);
    expect(stats.detectedErrorCnt).toBe(1);
    expect(stats.failedImagesCnt).toBe(2);
    expect(stats.lastCompletionTimestamp).toBe(1761480100);
  });

  it('method: getScanningStats excludes workloadscan generated jobs', () => {
    const wrapper = factory();
    const jobs = [
      makeScanJob({
        generateName:       'workloadscan-abc-',
        scannedImagesCount: 7,
        imagesCount:        10,
        conditions:         [{ error: true }],
      }),
      makeScanJob({
        generateName:       'imagescan-abc-',
        scannedImagesCount: 3,
        imagesCount:        5,
        conditions:         [{ error: true }],
      }),
    ];

    wrapper.vm.scanJobsCRD = jobs;

    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(3);
    expect(stats.detectedErrorCnt).toBe(1);
    expect(stats.failedImagesCnt).toBe(2);
  });

  it('method: getScanningStats identifies workloadscan case-insensitively', () => {
    const wrapper = factory();
    const jobs = [
      makeScanJob({
        generateName:       'WorkloadScan-xyz-',
        scannedImagesCount: 9,
        imagesCount:        12,
        conditions:         [{ error: true }],
      }),
      makeScanJob({
        generateName:       'imageScan-xyz-',
        scannedImagesCount: 4,
        imagesCount:        6,
        conditions:         [{ error: false }],
      }),
    ];

    wrapper.vm.scanJobsCRD = jobs;

    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(4);
    expect(stats.detectedErrorCnt).toBe(0);
    expect(stats.failedImagesCnt).toBe(0);
  });

  it('method: getScanningStats does not exclude names containing workloadscan in middle', () => {
    const wrapper = factory();
    const jobs = [
      makeScanJob({
        generateName:       'abc-workloadscan-xyz-',
        scannedImagesCount: 2,
        imagesCount:        3,
        conditions:         [{ error: true }],
      }),
      makeScanJob({
        generateName:       'imagescan-xyz-',
        scannedImagesCount: 3,
        imagesCount:        3,
        conditions:         [{ error: false }],
      }),
    ];

    wrapper.vm.scanJobsCRD = jobs;

    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(5);
    expect(stats.detectedErrorCnt).toBe(1);
    expect(stats.failedImagesCnt).toBe(1);
  });

  it('method: loadData replaces data when reloading', async() => {
    const wrapper = factory();
    const mockData = [makeScanJob()];

    storeMock.getters['cluster/all'].mockReturnValueOnce(mockData);

    wrapper.vm.loadData(true);
    expect(storeMock.getters['cluster/all']).toHaveBeenCalledWith(RESOURCE.SCAN_JOB);
  });

  it('method: loadData filters jobs by active namespace', async() => {
    const wrapper = factory();
    const mockData = [
      makeScanJob({ namespace: 'default', registry: 'reg1' }),
      makeScanJob({ namespace: 'other', registry: 'reg2' }),
    ];

    storeMock.getters['cluster/all'].mockReturnValueOnce(mockData);

    await wrapper.vm.loadData();

    expect(wrapper.vm.scanJobsCRD).toHaveLength(1);
    expect(wrapper.vm.scanJobsCRD[0].metadata.namespace).toBe('default');
  });

  it('method: fetch loads data and sets interval', async() => {
    const mockDispatch = jest.fn().mockResolvedValue([]);
    const mockClearInterval = jest.spyOn(global, 'clearInterval').mockImplementation(() => {});
    const mockSetInterval = jest.spyOn(global, 'setInterval').mockImplementation((fn) => {
      fn(); // call it immediately

      return 123;
    });

    const wrapper = factory({
      global: {
        mocks: {
          $store: {
            dispatch: mockDispatch,
            getters:  {
              'cluster/all':          jest.fn(() => []),
              'activeNamespaceCache': { default: true },
            },
          },
          t:           (key) => key,
          $fetchState: { pending: false },
        },
      },
    });

    await wrapper.vm.$options.fetch.call(wrapper.vm);
    // verify dispatch called
    expect(mockDispatch).toHaveBeenCalledWith('cluster/findAll', { type: 'sbomscanner.kubewarden.io.scanjob' });

    // verify clearInterval & setInterval called
    expect(mockClearInterval).toHaveBeenCalled();
    expect(mockSetInterval).toHaveBeenCalled();

    // verify keepAliveTimer assigned
    expect(wrapper.vm.keepAliveTimer).toBe(123);

    mockSetInterval.mockRestore();
    mockClearInterval.mockRestore();
  });

  it('watch: selectedRegistry triggers getScanningStats', async() => {
    const wrapper = factory();
    const spy = jest.spyOn(wrapper.vm, 'getScanningStats');

    await wrapper.setData({ selectedRegistry: 'custom' });
    wrapper.vm.$options.watch.selectedRegistry.call(wrapper.vm);
    expect(spy).toHaveBeenCalled();
  });

  it('beforeUnmount clears interval', () => {
    const wrapper = factory();
    const clearSpy = jest.spyOn(global, 'clearInterval');

    wrapper.vm.keepAliveTimer = setInterval(() => {}, 2000);
    wrapper.vm.$options.beforeUnmount.call(wrapper.vm);
    expect(clearSpy).toHaveBeenCalled();
  });
});