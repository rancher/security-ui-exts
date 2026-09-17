import {
  getBoundPolicyName,
  findBoundPolicy,
  getRuntimeSecurityValue,
} from '../workload-policy';
import { POLICY_LABEL_KEY } from '../../types/runtime-enforcer';

describe('utils/workload-policy.ts', () => {
  const policyLabelKey = POLICY_LABEL_KEY;

  describe('getBoundPolicyName', () => {
    it('returns policy name from CronJob nested template spec', () => {
      const cronJob = {
        kind: 'CronJob',
        spec: {
          jobTemplate: {
            spec: {
              template: {
                metadata: {
                  labels: { [policyLabelKey]: 'cron-policy' },
                },
              },
            },
          },
        },
      };

      expect(getBoundPolicyName(cronJob)).toBe('cron-policy');
    });

    it('returns policy name from standard workload template spec (Deployment, DaemonSet, StatefulSet, Job, ReplicaSet)', () => {
      const deployment = {
        kind: 'Deployment',
        spec: {
          template: {
            metadata: {
              labels: { [policyLabelKey]: 'deployment-policy' },
            },
          },
        },
      };

      expect(getBoundPolicyName(deployment)).toBe('deployment-policy');
    });

    it('falls back to top-level metadata labels for direct Pod resources or root labels', () => {
      const pod = {
        kind:     'Pod',
        metadata: {
          name:   'standalone-pod',
          labels: { [policyLabelKey]: 'pod-policy' },
        },
      };

      expect(getBoundPolicyName(pod)).toBe('pod-policy');
    });

    it('prefers template labels over top-level metadata labels when both exist', () => {
      const workload = {
        metadata: {
          labels: { [policyLabelKey]: 'root-policy' },
        },
        spec: {
          template: {
            metadata: {
              labels: { [policyLabelKey]: 'template-policy' },
            },
          },
        },
      };

      expect(getBoundPolicyName(workload)).toBe('template-policy');
    });

    it('returns an empty string when the label is not found', () => {
      const workload = {
        metadata: { labels: { 'app.kubernetes.io/name': 'nginx' } },
        spec:     { template: { metadata: { labels: {} } } },
      };

      expect(getBoundPolicyName(workload)).toBe('');
    });

    it('handles undefined or null row objects gracefully without throwing', () => {
      expect(getBoundPolicyName(null)).toBe('');
      expect(getBoundPolicyName(undefined)).toBe('');
      expect(getBoundPolicyName({})).toBe('');
    });
  });

  describe('findBoundPolicy', () => {
    const mockPolicies = [
      {
        metadata: {
          name:      'strict-db',
          namespace: 'default',
        },
        spec: { mode: 'protect' },
      },
      {
        metadata: {
          name:      'strict-db',
          namespace: 'cattle-system',
        },
        spec: { mode: 'protect' },
      },
      {
        metadata: {
          name:      'monitor-web',
          namespace: 'cattle-system',
        },
        spec: { mode: 'monitor' },
      },
    ];

    it('matches policy by both name and namespace', () => {
      const row = {
        metadata: {
          namespace: 'cattle-system',
        },
        spec: {
          template: {
            metadata: {
              labels: { [policyLabelKey]: 'strict-db' },
            },
          },
        },
      };

      const matched = findBoundPolicy(row, mockPolicies);

      expect(matched).toEqual(mockPolicies[1]);
      expect(matched?.metadata.namespace).toBe('cattle-system');
    });

    it('returns null when the policy name matches but the namespace does not', () => {
      const row = {
        metadata: {
          namespace: 'production',
        },
        spec: {
          template: {
            metadata: {
              labels: { [policyLabelKey]: 'strict-db' },
            },
          },
        },
      };

      expect(findBoundPolicy(row, mockPolicies)).toBeNull();
    });

    it('returns null when the workload has no bound policy label', () => {
      const row = {
        metadata: {
          namespace: 'cattle-system',
          labels:    {},
        },
      };

      expect(findBoundPolicy(row, mockPolicies)).toBeNull();
    });

    it('returns null when policies argument is not an array or is empty', () => {
      const row = {
        metadata: {
          namespace: 'cattle-system',
          labels:    { [policyLabelKey]: 'strict-db' },
        },
      };

      expect(findBoundPolicy(row, null as any)).toBeNull();
      expect(findBoundPolicy(row, undefined as any)).toBeNull();
      expect(findBoundPolicy(row, [])).toBeNull();
    });

    it('returns null when workload namespace is missing', () => {
      const row = {
        metadata: {
          labels: { [policyLabelKey]: 'strict-db' },
        },
      };

      expect(findBoundPolicy(row, mockPolicies)).toBeNull();
    });
  });

  describe('getRuntimeSecurityValue', () => {
    it('returns runtimeSecuritySortValue when explicitly defined on the row', () => {
      const row = {
        runtimeSecuritySortValue: 'protect-10',
        metadata:                 { labels: { [policyLabelKey]: 'default-policy' } },
      };

      expect(getRuntimeSecurityValue(row)).toBe('protect-10');
    });

    it('falls back to getBoundPolicyName when runtimeSecuritySortValue is undefined', () => {
      const row = {
        spec: {
          template: {
            metadata: {
              labels: { [policyLabelKey]: 'bound-policy' },
            },
          },
        },
      };

      expect(getRuntimeSecurityValue(row)).toBe('bound-policy');
    });

    it('returns empty string when row is not bound and has no sort value', () => {
      const row = {
        metadata: { labels: {} },
      };

      expect(getRuntimeSecurityValue(row)).toBe('');
    });
  });
});