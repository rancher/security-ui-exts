export interface AllowTarget {
  containerName: string;
  executablePath: string;
}

export async function allowExecutables(policy: any, targets: AllowTarget[]): Promise<void> {
  const rulesByContainer = policy.spec.rulesByContainer ??= {};

  targets.forEach(({ containerName, executablePath }) => {
    const containerRules = rulesByContainer[containerName] ??= {};
    const executables = containerRules.executables ??= {};
    const allowed = executables.allowed ??= [];

    if (!allowed.includes(executablePath)) {
      allowed.push(executablePath);
    }
  });

  await policy.save();
}
