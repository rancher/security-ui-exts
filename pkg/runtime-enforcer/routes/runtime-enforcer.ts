import Entry from '../pages/c/_cluster/runtime-enforcer/index.vue';
import RuntimeEnforcerResourceCreate from '../pages/c/_cluster/runtime-enforcer/_resource/create.vue';
import RuntimeEnforcerResourceId from '../pages/c/_cluster/runtime-enforcer/_resource/_id.vue';
import RuntimeEnforcerResourceNamespaceId from '../pages/c/_cluster/runtime-enforcer/_resource/_namespace/_id.vue';
import RuntimeEnforcerResourceList from '../pages/c/_cluster/runtime-enforcer/_resource/index.vue';
import { PRODUCT_NAME } from '../types/runtime-enforcer';

const routes = [
  {
    name:      `c-cluster-${ PRODUCT_NAME }-entry`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/entry`,
    component: Entry,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ PRODUCT_NAME }-resource-create`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/:resource/create`,
    component: RuntimeEnforcerResourceCreate,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ PRODUCT_NAME }-resource-id`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/:resource/:id`,
    component: RuntimeEnforcerResourceId,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ PRODUCT_NAME }-resource-namespace-id`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/:resource/:namespace/:id`,
    component: RuntimeEnforcerResourceNamespaceId,
    meta:      { product: PRODUCT_NAME },
  },
  {
    name:      `c-cluster-${ PRODUCT_NAME }-resource`,
    path:      `/c/:cluster/${ PRODUCT_NAME }/:resource`,
    component: RuntimeEnforcerResourceList,
    meta:      { product: PRODUCT_NAME },
  },
];

export default routes;
