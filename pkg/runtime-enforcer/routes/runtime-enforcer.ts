import PolicyProposals from '../pages/PolicyProposals.vue';
import Entry from '../pages/index.vue';
import { PRODUCT_NAME } from '../types/runtime-enforcer';

const routes = [
  {
    name:      `c-cluster-${ PRODUCT_NAME }-entry`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/entry`,
    component: Entry,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ PRODUCT_NAME }-policy-proposals`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/policy-proposals`,
    component: PolicyProposals,
    meta:      { product: PRODUCT_NAME },
  },
];

export default routes;
