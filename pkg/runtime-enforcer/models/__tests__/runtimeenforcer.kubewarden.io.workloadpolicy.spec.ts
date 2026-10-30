import WorkloadPolicy from '../runtimeenforcer.kubewarden.io.workloadpolicy';
import { PROMOTE_LABEL_KEY } from '@runtime-enforcer/types';

jest.mock('@shell/plugins/steve/steve-class', () => {
  const MockSteveModel = class {
    constructor() {
      this.spec = {};
      this.metadata = {};
    }
  };

  return {
    __esModule: true,
    default:    MockSteveModel,
  };
});

describe('WorkloadPolicy model', () => {
  let policy: any;

  beforeEach(() => {
    policy = new WorkloadPolicy();
    policy.apiVersion = 'runtimeenforcer.kubewarden.io/v1alpha1';
    policy.kind = 'WorkloadPolicy';
  });

  describe('toExportResource', () => {
    it('keeps only apiVersion/kind/name/namespace/labels/spec', () => {
      policy.metadata = {
        name:              'deploy-nginx-ingress',
        namespace:         'ingress',
        labels:            { [PROMOTE_LABEL_KEY]: 'true' },
        annotations:       { 'kubectl.kubernetes.io/last-applied-configuration': '{}' },
        resourceVersion:   '12345',
        uid:               'policy-uid',
        creationTimestamp: '2026-01-01T00:00:00Z',
        generation:        2,
        managedFields:     [{ manager: 'kubectl' }],
      };
      policy.spec = {
        mode:             'protect',
        rulesByContainer: { nginx: { executables: { allowed: ['/usr/bin/nginx'] } } },
      };
      policy.status = { violationCount: 3 };

      expect(policy.toExportResource()).toEqual({
        apiVersion: 'runtimeenforcer.kubewarden.io/v1alpha1',
        kind:       'WorkloadPolicy',
        metadata:   {
          name:      'deploy-nginx-ingress',
          namespace: 'ingress',
          labels:    { [PROMOTE_LABEL_KEY]: 'true' },
        },
        spec: {
          mode:             'protect',
          rulesByContainer: { nginx: { executables: { allowed: ['/usr/bin/nginx'] } } },
        },
      });
    });

    it('omits labels when the policy has none', () => {
      policy.metadata = { name: 'deploy-nginx-ingress', namespace: 'ingress' };

      expect(policy.toExportResource().metadata).toEqual({
        name:      'deploy-nginx-ingress',
        namespace: 'ingress',
      });
    });
  });
});
