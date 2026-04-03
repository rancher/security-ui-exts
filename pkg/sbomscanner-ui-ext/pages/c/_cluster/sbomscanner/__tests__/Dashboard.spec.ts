import { shallowMount } from '@vue/test-utils';
import Dashboard from '../Dashboard.vue';

const RESOURCE = {
  REGISTRY: 'sbomscanner.kubewarden.io.registry',
  SCAN_JOB: 'sbomscanner.kubewarden.io.scanjob',
};

// Helper function updated to include creationTimestamp and explicit condition types
function makeScanJob({
                       namespace = 'default',
                       generateName = 'imagescan-',
                       registry = 'my-registry',
                       scannedImagesCount = 5,
                       imagesCount = 10,
                       completionTime = Date.now(),
                       creationTimestamp = new Date().toISOString(),
                       conditions = [{ type: 'Complete', status: 'True', error: false }],
                     } = {}, withStatus = true) {
  if (withStatus) {
    return {
      metadata: { namespace, generateName, creationTimestamp },
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
      metadata: { namespace, generateName, creationTimestamp },
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

  it('method: getregistryOptions returns unique registry list, filters workloads and respects namespaces', async() => {
    const wrapper = factory();

    await wrapper.setData({
      scanJobsCRD: [
        makeScanJob({ namespace: 'default', registry: 'reg1', generateName: 'imagescan-' }),
        makeScanJob({ namespace: 'default', registry: 'reg1', generateName: 'imagescan-' }),
        makeScanJob({ namespace: 'default', registry: 'workloadscan-reg2', generateName: 'workloadscan-' }), // Filtered out (workload)
        makeScanJob({ namespace: 'other-ns', registry: 'reg3', generateName: 'imagescan-' }), // Filtered out (wrong namespace)
      ],
    });

    wrapper.vm.getregistryOptions();

    const options = wrapper.vm.registryOptions;

    expect(options).toContain('All matching registries');
    expect(options).toContain('reg1');
    expect(options).not.toContain('workloadscan-reg2');
    expect(options).not.toContain('reg3');
    expect(options).toHaveLength(2); // 'All matching registries' + 'reg1'
  });

  it('method: getFailedImageCnt calculates correctly', () => {
    const wrapper = factory();

    const jobWithError = {
      status: {
        conditions: [{ type: 'Failed', status: 'True', error: true }], scannedImagesCount: 6, imagesCount: 10
      }
    };
    const jobWithoutError = {
      status: {
        conditions: [{ type: 'Complete', status: 'True', error: false }], scannedImagesCount: 8, imagesCount: 8
      }
    };

    expect(wrapper.vm.getFailedImageCnt(jobWithError)).toBe(4);
    expect(wrapper.vm.getFailedImageCnt(jobWithoutError)).toBe(0);
  });

  it('method: getFailedImageCnt calculates correctly - without status', () => {
    const wrapper = factory();

    const jobWithError = {
      status: {
        conditions: [{ type: 'Failed', status: 'True', error: true }], scannedImagesCount: 6, imagesCount: 10
      }
    };
    const jobWithoutError = {};

    expect(wrapper.vm.getFailedImageCnt(jobWithError)).toBe(4);
    expect(wrapper.vm.getFailedImageCnt(jobWithoutError)).toBe(0);
  });

  it('method: getScanningStats calculates using ONLY the most recent completed job per registry', () => {
    const wrapper = factory();
    const olderJob = makeScanJob({
      registry:           'reg1',
      creationTimestamp:  '2026-04-01T10:00:00Z',
      conditions:         [{ type: 'Complete', status: 'True', error: false }],
      scannedImagesCount: 2,
      imagesCount:        2,
      completionTime:     1000000000
    });

    const newerJob = makeScanJob({
      registry:           'reg1', // Same registry to trigger overwrite logic
      creationTimestamp:  '2026-04-02T10:00:00Z',
      conditions:         [{ type: 'Failed', status: 'True', error: true }],
      scannedImagesCount: 0,
      imagesCount:        5,
      completionTime:     2000000000
    });

    wrapper.vm.scanJobsCRD = [olderJob, newerJob];
    const stats = wrapper.vm.getScanningStats();

    // Should only extract stats from the newerJob and discard olderJob
    expect(stats.totalScannedImageCnt).toBe(0); // Faulty backend override applied on failure
    expect(stats.detectedErrorCnt).toBe(1);
    expect(stats.failedImagesCnt).toBe(5); // imagesCount used entirely because it failed
    expect(stats.lastCompletionTimestamp).toBe(2000000000);
  });

  it('method: getScanningStats sums data correctly across multiple registries', () => {
    const wrapper = factory();
    const reg1Job = makeScanJob({
      registry:           'reg1',
      creationTimestamp:  '2026-04-02T10:00:00Z',
      conditions:         [{ type: 'Complete', status: 'True', error: false }],
      scannedImagesCount: 10,
      imagesCount:        10,
      completionTime:     1000000000
    });

    const reg2Job = makeScanJob({
      registry:           'reg2',
      creationTimestamp:  '2026-04-02T11:00:00Z',
      conditions:         [{ type: 'Failed', status: 'True', error: true }],
      scannedImagesCount: 5,
      imagesCount:        5,
      completionTime:     2000000000
    });

    wrapper.vm.scanJobsCRD = [reg1Job, reg2Job];
    const stats = wrapper.vm.getScanningStats();

    // Should sum stats from BOTH registries
    expect(stats.totalScannedImageCnt).toBe(10); // 10 from reg1, 0 from reg2 (override)
    expect(stats.detectedErrorCnt).toBe(1); // 1 from reg2
    expect(stats.failedImagesCnt).toBe(5); // 5 from reg2
    expect(stats.lastCompletionTimestamp).toBe(2000000000);
  });

  it('method: getScanningStats overrides faulty backend data when job completely fails', () => {
    const wrapper = factory();
    const failedJob = makeScanJob({
      registry:           'reg1',
      creationTimestamp:  '2026-04-02T10:00:00Z',
      conditions:         [{ type: 'Failed', status: 'True', error: true }],
      // Backend incorrectly reports 10 scanned even though job failed entirely
      scannedImagesCount: 10,
      imagesCount:        10,
    });

    wrapper.vm.scanJobsCRD = [failedJob];
    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(0); // Safely overridden to 0
    expect(stats.detectedErrorCnt).toBe(1);
    expect(stats.failedImagesCnt).toBe(10); // Safely sets all images as failed
  });

  it('method: getScanningStats ignores jobs that are currently running', () => {
    const wrapper = factory();
    const olderCompletedJob = makeScanJob({
      registry:           'reg1',
      creationTimestamp:  '2026-04-01T10:00:00Z',
      conditions:         [{ type: 'Complete', status: 'True', error: false }],
      scannedImagesCount: 5,
      imagesCount:        5,
    });

    const currentlyRunningJob = makeScanJob({
      registry:           'reg1', // Same registry
      creationTimestamp:  '2026-04-03T10:00:00Z', // Newest job, but running
      conditions:         [{ type: 'InProgress', status: 'True', error: false }],
      scannedImagesCount: 0,
      imagesCount:        10,
    });

    wrapper.vm.scanJobsCRD = [olderCompletedJob, currentlyRunningJob];
    const stats = wrapper.vm.getScanningStats();

    // Should ignore the running job and return stats for the olderCompletedJob
    expect(stats.totalScannedImageCnt).toBe(5);
    expect(stats.failedImagesCnt).toBe(0);
    expect(stats.detectedErrorCnt).toBe(0);
  });

  it('method: getScanningStats handles empty status gracefully', () => {
    const wrapper = factory();
    const jobs = [
      makeScanJob({
        registry:          'reg1',
        creationTimestamp: '2026-04-01T10:00:00Z',
      }, false)
    ];

    wrapper.vm.scanJobsCRD = jobs;
    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(0);
    expect(stats.detectedErrorCnt).toBe(0);
    expect(stats.failedImagesCnt).toBe(0);
    expect(stats.lastCompletionTimestamp).toBe(0);
  });

  it('method: getScanningStats respects selectedRegistry filter', () => {
    const wrapper = factory();
    const jobs = [
      makeScanJob({
        registry:           'reg-a',
        creationTimestamp:  '2026-04-02T10:00:00Z',
        scannedImagesCount: 2,
        imagesCount:        4,
        conditions:         [{ type: 'Failed', status: 'True', error: true }],
        completionTime:     1761480100,
      }),
      makeScanJob({
        registry:           'reg-b',
        creationTimestamp:  '2026-04-03T10:00:00Z', // Newer job, but wrong registry
        scannedImagesCount: 5,
        imagesCount:        8,
        conditions:         [{ type: 'Complete', status: 'True', error: false }],
        completionTime:     1761480200,
      }),
    ];

    wrapper.vm.scanJobsCRD = jobs;
    wrapper.vm.selectedRegistry = 'reg-a';

    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(0); // Override applied because it failed
    expect(stats.detectedErrorCnt).toBe(1);
    expect(stats.failedImagesCnt).toBe(4); // 4 images in reg-a failed
    expect(stats.lastCompletionTimestamp).toBe(1761480100);
  });

  it('method: getScanningStats excludes workloadscan generated jobs', () => {
    const wrapper = factory();
    const jobs = [
      makeScanJob({
        registry:           'workloadscan-abc-',
        generateName:       'workloadscan-abc-',
        creationTimestamp:  '2026-04-03T10:00:00Z', // Newest job, but workload
        scannedImagesCount: 7,
        imagesCount:        10,
        conditions:         [{ type: 'Complete', status: 'True', error: false }],
      }),
      makeScanJob({
        registry:           'reg-a',
        generateName:       'imagescan-abc-',
        creationTimestamp:  '2026-04-02T10:00:00Z', // Older job, but imagescan
        scannedImagesCount: 3,
        imagesCount:        5,
        conditions:         [{ type: 'Failed', status: 'True', error: true }],
      }),
    ];

    wrapper.vm.scanJobsCRD = jobs;

    const stats = wrapper.vm.getScanningStats();

    expect(stats.totalScannedImageCnt).toBe(0); // imagescan failed, so 0 successful
    expect(stats.detectedErrorCnt).toBe(1);
    expect(stats.failedImagesCnt).toBe(5);
  });

  it('method: getScanningStats identifies workloadscan case-insensitively', () => {
    const wrapper = factory();
    const jobs = [
      makeScanJob({
        registry:           'workloadscan-xyz-',
        generateName:       'WorkloadScan-xyz-',
        creationTimestamp:  '2026-04-03T10:00:00Z',
        scannedImagesCount: 9,
        imagesCount:        12,
        conditions:         [{ type: 'Complete', status: 'True', error: false }],
      }),
      makeScanJob({
        registry:           'reg-b',
        generateName:       'imageScan-xyz-',
        creationTimestamp:  '2026-04-02T10:00:00Z',
        scannedImagesCount: 4,
        imagesCount:        6,
        conditions:         [{ type: 'Complete', status: 'True', error: false }],
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
        registry:           'reg-a',
        generateName:       'abc-workloadscan-xyz-', // Valid because it doesn't START with workloadscan
        creationTimestamp:  '2026-04-03T10:00:00Z',
        scannedImagesCount: 3,
        imagesCount:        3,
        conditions:         [{ type: 'Complete', status: 'True', error: false }],
      }),
      makeScanJob({
        registry:           'reg-b',
        generateName:       'imagescan-xyz-',
        creationTimestamp:  '2026-04-02T10:00:00Z',
        scannedImagesCount: 2,
        imagesCount:        2,
        conditions:         [{ type: 'Complete', status: 'True', error: false }],
      }),
    ];

    wrapper.vm.scanJobsCRD = jobs;

    const stats = wrapper.vm.getScanningStats();

    // Should return sum of both
    expect(stats.totalScannedImageCnt).toBe(5);
    expect(stats.detectedErrorCnt).toBe(0);
    expect(stats.failedImagesCnt).toBe(0);
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