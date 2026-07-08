import semver from 'semver';
import { SHOW_PRE_RELEASE } from '@shell/store/prefs';
import { handleGrowl } from '@runtime-enforcer/utils/handle-growl';

export interface RefreshConfig {
  store: any;
  chartName: string;
  retry?: number;
  init?: boolean;
}

export interface ReloadReady {
  reloadReady: boolean;
}

export async function refreshCharts(config: RefreshConfig): Promise<ReloadReady> {
  const { store, chartName, init } = config;
  let retry = config.retry ?? 0;

  while (retry < 3) {
    const rawCharts = store.getters['catalog/rawCharts'];
    const chart = Object.values(rawCharts || {})?.find((c: any) => c?.chartName === chartName);

    if (!chart) {
      try {
        await store.dispatch('catalog/refresh');
      } catch (e) {
        handleGrowl({ error: e as any, store });
      }

      if (retry < 2 && !init) {
        retry++;
        continue;
      }
    }

    break;
  }

  return { reloadReady: false };
}

export function getLatestVersion(store: any, versions: any[]) {
  const showPreRelease = store.getters['prefs/get'](SHOW_PRE_RELEASE);
  const versionMap = (versions || [])
    .map((v: any) => v.version)
    .filter((v: string) => showPreRelease ? v : !semver.prerelease(v));

  const sorted = versionMap.sort((a: string, b: string) => {
    const aSem = semver.coerce(a);
    const bSem = semver.coerce(b);

    if (!aSem && !bSem) {
      return 0;
    }

    if (!aSem) {
      return 1;
    }

    if (!bSem) {
      return -1;
    }

    return semver.rcompare(aSem, bSem);
  });

  return sorted[0];
}
