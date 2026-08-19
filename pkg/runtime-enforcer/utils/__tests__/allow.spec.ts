import { allowExecutables } from '../allow';

const createPolicy = (spec: any = {}) => ({
  spec,
  save: jest.fn().mockResolvedValue(undefined),
});

describe('allowExecutables', () => {
  it('creates the nested rulesByContainer/executables/allowed structure when missing', async() => {
    const policy = createPolicy({});

    await allowExecutables(policy, [{ containerName: 'nginx', executablePath: '/usr/bin/curl' }]);

    expect(policy.spec.rulesByContainer).toEqual({ nginx: { executables: { allowed: ['/usr/bin/curl'] } } });
    expect(policy.save).toHaveBeenCalled();
  });

  it('appends to an existing allowed list without duplicating entries', async() => {
    const policy = createPolicy({
      rulesByContainer: { nginx: { executables: { allowed: ['/usr/bin/curl'] } } },
    });

    await allowExecutables(policy, [
      { containerName: 'nginx', executablePath: '/usr/bin/curl' },
      { containerName: 'nginx', executablePath: '/usr/bin/wget' },
    ]);

    expect(policy.spec.rulesByContainer.nginx.executables.allowed).toEqual(['/usr/bin/curl', '/usr/bin/wget']);
  });

  it('handles multiple target containers independently', async() => {
    const policy = createPolicy({});

    await allowExecutables(policy, [
      { containerName: 'nginx', executablePath: '/usr/bin/curl' },
      { containerName: 'sidecar', executablePath: '/usr/bin/wget' },
    ]);

    expect(policy.spec.rulesByContainer).toEqual({
      nginx:   { executables: { allowed: ['/usr/bin/curl'] } },
      sidecar: { executables: { allowed: ['/usr/bin/wget'] } },
    });
  });
});
