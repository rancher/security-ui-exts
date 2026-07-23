import {
  getPolicyProposalHeaders,
  getPolicyProposalPaginationHeaders,
} from '../policy-proposals-table';

describe('policy-proposals-table', () => {
  const input = {
    getWorkloadName: () => 'workload-a',
    getWorkloadType: () => 'Deployment',
    getContainerCount: () => 1,
    getExecutableCount: () => 2,
    toAgeLabel: () => '1d',
  };

  it('uses string formatter for namespace column in headers', () => {
    const headers = getPolicyProposalHeaders(input);
    const namespace = headers.find((h) => h.name === 'namespace');

    expect(namespace).toBeDefined();
    expect(typeof namespace?.formatter).toBe('string');
    expect(namespace?.formatter).toBe('NamespaceRouteLink');
  });

  it('uses string formatter for namespace column in pagination headers', () => {
    const headers = getPolicyProposalPaginationHeaders();
    const namespace = headers.find((h) => h.name === 'namespace');

    expect(namespace).toBeDefined();
    expect(typeof namespace?.formatter).toBe('string');
    expect(namespace?.formatter).toBe('NamespaceRouteLink');
  });
});