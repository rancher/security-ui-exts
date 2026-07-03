import { PRODUCT_NAME } from '../types/runtime-enforcer';
import { RESOURCE } from '../types/runtime-enforcer';

export function init($plugin: any, store: any) {

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

  virtualType({
    label:      'Policy proposals',
    name:       'policy-proposals',
    ifHaveType: RESOURCE.POLICY_PROPOSALS,
    namespaced: false,
    route:      {
      name:   `c-cluster-${ PRODUCT_NAME }-policy-proposals`,
      params: { product: PRODUCT_NAME },
      meta:   { pkg: PRODUCT_NAME, product: PRODUCT_NAME }
    },
  });

  basicType([
    'entry',
    'policy-proposals'
  ]);
}