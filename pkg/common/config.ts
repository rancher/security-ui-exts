import type { IPlugin } from '@shell/core/types';

/**
 * `pkg/common` is a path alias, not an installed extension, so its components are
 * compiled into each extension's bundle and cannot rely on another extension having
 * registered their keys. Every extension importing from `@common` must call this.
 */
export function registerCommonL10n(plugin: IPlugin): void {
  plugin.addL10n('en-us', () => Promise.resolve(require('./l10n/en-us.yaml')));
}
