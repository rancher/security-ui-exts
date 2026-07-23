import { PRODUCT_NAME } from '../types/runtime-enforcer';
import { RESOURCE } from '../types/runtime-enforcer';

export function init($plugin: any, store: any) {
  const { configureType } = $plugin.DSL(store, PRODUCT_NAME);

  const {
    product,
    virtualType,
    basicType
  } = $plugin.DSL(store, PRODUCT_NAME);

  // registering a top-level product
  product({
    icon:                'pod_security',
    inStore:             'cluster',
    showNamespaceFilter: true,
  });

  // => => => creating a custom page
  virtualType({
    label:      'Overview',
    name:       'entry',
    namespaced: false,
    route:      {
      name:   `c-cluster-${ PRODUCT_NAME }-entry`,
      params: { product: PRODUCT_NAME },
      meta:   { pkg: PRODUCT_NAME, product: PRODUCT_NAME }
    },
    overview: true
  });

  configureType(RESOURCE.POLICY_PROPOSALS, {
    isCreatable: false,
  });

  basicType([
    'entry',
    RESOURCE.POLICY_PROPOSALS,
  ]);
}