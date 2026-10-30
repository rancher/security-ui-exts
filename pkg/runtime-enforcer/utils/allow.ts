import { clone } from '@shell/utils/object';

export interface AllowTarget {
  containerName: string;
  executablePath: string;
}

export async function allowExecutables(policy: any, targets: AllowTarget[]): Promise<void> {
  const previousRules = clone(policy.spec.rulesByContainer);
  const rulesByContainer = policy.spec.rulesByContainer ??= {};

  targets.forEach(({ containerName, executablePath }) => {
    const containerRules = rulesByContainer[containerName] ??= {};
    const executables = containerRules.executables ??= {};
    const allowed = executables.allowed ??= [];

    if (!allowed.includes(executablePath)) {
      allowed.push(executablePath);
    }
  });

  try {
    await policy.save();
  } catch (err) {
    // Put the old rules back so the table doesn't show executables the policy doesn't allow.
    policy.spec.rulesByContainer = previousRules;
    throw err;
  }
}
