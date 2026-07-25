const workloadPolicies = [{
  apiVersion: 'security.rancher.io/v1alpha1',
  kind:       'WorkloadPolicy',
  metadata:   {
    name:              'nginx-policy',
    namespace:         'default',
    uid:               '9b3e2b8c-67d0-45d5-8a2b-5d2d8b3c7f91',
    generation:        1,
    resourceVersion:   '123456',
    creationTimestamp: '2026-07-24T18:00:00Z',
    ownerReferences:   [{
      apiVersion:         'apps/v1',
      kind:               'Deployment',
      name:               'nginx',
      uid:                'd4f0d7e8-6c39-42d1-9d5d-2f58d3e8b9a0',
      controller:         true,
      blockOwnerDeletion: true,
    }],
  },
  spec: {
    mode:             'protect',
    rulesByContainer: {
      nginx: {
        executables: {
          allowed: [
            '/usr/sbin/nginx',
            '/bin/sh',
            '/bin/bash',
            '/usr/bin/curl',
          ],
        },
      },
      sidecar: {
        executables: {
          allowed: [
            '/bin/sh',
            '/usr/bin/env',
          ],
        },
      },
    },
  },
  status: {
    observedGeneration: 1,
    phase:              'Ready',
    totalNodes:         5,
    successfulNodes:    4,
    transitioningNodes: 1,
    failedNodes:        0,
    nodesTransitioning: [
      'worker-03',
    ],
    nodesWithIssues: {
      'worker-03': {
        code:    'PolicySyncPending',
        message: 'Policy is still being propagated.',
      },
    },
    violationCount: 3,
    violations:     [{
      timestamp:      '2026-07-24T18:30:15Z',
      action:         'protect',
      nodeName:       'worker-01',
      podName:        'nginx-7d9b8c6d9f-xk8lm',
      containerName:  'nginx',
      executablePath: '/usr/bin/python3',
    }, {
      timestamp:      '2026-07-24T18:45:22Z',
      action:         'monitor',
      nodeName:       'worker-02',
      podName:        'nginx-7d9b8c6d9f-jq4rm',
      containerName:  'nginx',
      executablePath: '/bin/nc',
    }, {
      timestamp:      '2026-07-24T19:02:48Z',
      action:         'protect',
      nodeName:       'worker-01',
      podName:        'nginx-7d9b8c6d9f-xk8lm',
      containerName:  'nginx',
      executablePath: '/usr/bin/wget',
    }],
  },
}, {
  apiVersion: 'security.rancher.io/v1alpha1',
  kind:       'WorkloadPolicy',
  metadata:   {
    name:              'redis-policy',
    namespace:         'database',
    uid:               '2b1d7f83-3b72-4b2e-9d67-9c2b80fd1a21',
    generation:        1,
    resourceVersion:   '123457',
    creationTimestamp: '2026-07-22T09:15:00Z',
    ownerReferences:   [{
      apiVersion:         'apps/v1',
      kind:               'StatefulSet',
      name:               'redis',
      uid:                '7d0f3d55-8a4b-4d5d-b5e4-c98d3c12ab11',
      controller:         true,
      blockOwnerDeletion: true,
    }],
  },
  spec: {
    mode:             'monitor',
    rulesByContainer: {
      redis: {
        executables: {
          allowed: [
            '/usr/local/bin/redis-server',
            '/bin/sh',
            '/usr/bin/redis-cli',
          ],
        },
      },
    },
  },
  status: {
    observedGeneration: 1,
    phase:              'Ready',
    totalNodes:         3,
    successfulNodes:    3,
    transitioningNodes: 0,
    failedNodes:        0,
    nodesTransitioning: [],
    nodesWithIssues:    {},
    violationCount:     2,
    violations:         [{
      timestamp:      '2026-07-24T14:12:30Z',
      action:         'monitor',
      nodeName:       'worker-01',
      podName:        'redis-0',
      containerName:  'redis',
      executablePath: '/usr/bin/python3',
    }, {
      timestamp:      '2026-07-24T15:08:41Z',
      action:         'monitor',
      nodeName:       'worker-02',
      podName:        'redis-1',
      containerName:  'redis',
      executablePath: '/usr/bin/wget',
    }],
  },
}, {
  apiVersion: 'security.rancher.io/v1alpha1',
  kind:       'WorkloadPolicy',
  metadata:   {
    name:              'fluent-bit-policy',
    namespace:         'logging',
    uid:               'c7418bb8-8275-4cba-a31c-11c8af86dd21',
    generation:        1,
    resourceVersion:   '123458',
    creationTimestamp: '2026-07-21T11:40:00Z',
    ownerReferences:   [{
      apiVersion:         'apps/v1',
      kind:               'DaemonSet',
      name:               'fluent-bit',
      uid:                '1f2e6d7c-87fd-4cf5-a597-08bcd61e9001',
      controller:         true,
      blockOwnerDeletion: true,
    }],
  },
  spec: {
    mode:             'protect',
    rulesByContainer: {
      'fluent-bit': {
        executables: {
          allowed: [
            '/fluent-bit/bin/fluent-bit',
            '/bin/sh',
          ],
        },
      },
    },
  },
  status: {
    observedGeneration: 1,
    phase:              'Transitioning',
    totalNodes:         8,
    successfulNodes:    7,
    transitioningNodes: 1,
    failedNodes:        0,
    nodesTransitioning: [
      'worker-05',
    ],
    nodesWithIssues: {
      'worker-05': {
        code:    'PolicySyncPending',
        message: 'Policy is still being propagated.',
      },
    },
    violationCount: 1,
    violations:     [{
      timestamp:      '2026-07-24T13:05:20Z',
      action:         'protect',
      nodeName:       'worker-03',
      podName:        'fluent-bit-rq8j2',
      containerName:  'fluent-bit',
      executablePath: '/usr/bin/bash',
    }],
  },
}, {
  apiVersion: 'security.rancher.io/v1alpha1',
  kind:       'WorkloadPolicy',
  metadata:   {
    name:              'cleanup-policy',
    namespace:         'maintenance',
    uid:               '6f8dcb66-50c9-4d91-8b8f-77e998bb9c23',
    generation:        1,
    resourceVersion:   '123459',
    creationTimestamp: '2026-07-20T06:25:00Z',
    ownerReferences:   [{
      apiVersion:         'batch/v1',
      kind:               'CronJob',
      name:               'cleanup',
      uid:                '2ab6b7f0-1d98-4677-b90e-54b9d1cf5d21',
      controller:         true,
      blockOwnerDeletion: true,
    }],
  },
  spec: {
    mode:             'monitor',
    rulesByContainer: {
      cleanup: {
        executables: {
          allowed: [
            '/bin/sh',
            '/usr/bin/find',
            '/usr/bin/rm',
            '/usr/bin/tar',
          ],
        },
      },
    },
  },
  status: {
    observedGeneration: 1,
    phase:              'Ready',
    totalNodes:         4,
    successfulNodes:    4,
    transitioningNodes: 0,
    failedNodes:        0,
    nodesTransitioning: [],
    nodesWithIssues:    {},
    violationCount:     1,
    violations:         [{
      timestamp:      '2026-07-24T08:10:11Z',
      action:         'monitor',
      nodeName:       'worker-02',
      podName:        'cleanup-292183',
      containerName:  'cleanup',
      executablePath: '/usr/bin/curl',
    }],
  },
}, {
  apiVersion: 'security.rancher.io/v1alpha1',
  kind:       'WorkloadPolicy',
  metadata:   {
    name:              'postgres-policy',
    namespace:         'database',
    uid:               '9cb86d41-a6ea-4b0d-ae95-f4db3b59d345',
    generation:        1,
    resourceVersion:   '123460',
    creationTimestamp: '2026-07-19T16:50:00Z',
    ownerReferences:   [{
      apiVersion:         'apps/v1',
      kind:               'Deployment',
      name:               'postgres-exporter',
      uid:                '0cbcf69f-c584-4c89-a5c3-89d86326b2f8',
      controller:         true,
      blockOwnerDeletion: true,
    }],
  },
  spec: {
    mode:             'protect',
    rulesByContainer: {
      'postgres-exporter': {
        executables: {
          allowed: [
            '/bin/postgres-exporter',
            '/bin/sh',
            '/usr/bin/env',
          ],
        },
      },
      'metrics-sidecar': {
        executables: {
          allowed: [
            '/bin/metrics-agent',
          ],
        },
      },
    },
  },
  status: {
    observedGeneration: 1,
    phase:              'Failed',
    totalNodes:         6,
    successfulNodes:    6,
    transitioningNodes: 0,
    failedNodes:        0,
    nodesTransitioning: [],
    nodesWithIssues:    {},
    violationCount:     0,
    violations:         [],
  },
}];

module.exports = { workloadPolicies };