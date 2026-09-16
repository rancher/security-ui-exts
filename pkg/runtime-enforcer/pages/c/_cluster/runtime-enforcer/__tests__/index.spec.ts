import { shallowMount } from '@vue/test-utils';
import { createStore } from 'vuex';
import { nextTick } from 'vue';

import Entry from '../index.vue';
import { PRODUCT_NAME, RESOURCE } from '@runtime-enforcer/types';

const mockRouter = {
  push:         jest.fn(),
  replace:      jest.fn(),
  currentRoute: { value: { params: { cluster: 'cluster-1' } } },
};

jest.mock('vue-router', () => ({ useRouter: () => mockRouter }));

const createWrapper = (hasSchema = false) => {
  const store = createStore({
    state:     () => ({ hasSchema }),
    mutations: {
      setSchema(state: any, value: boolean) {
        state.hasSchema = value;
      },
    },
    modules: {
      cluster: {
        namespaced: true,
        getters:    { schemaFor: (_state, _getters, rootState: any) => () => rootState.hasSchema },
      },
    },
  });

  const wrapper = shallowMount(Entry as any, {
    global: {
      plugins: [store],
      stubs:   { InstallView: true },
    },
  });

  return { wrapper, store };
};

describe('runtime-enforcer entry page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const expectedRoute = {
    name:   `c-cluster-${ PRODUCT_NAME }-resource`,
    params: {
      resource: RESOURCE.ACTIVE_POLICIES,
      cluster:  'cluster-1',
      product:  PRODUCT_NAME,
    },
  };

  it('replaces rather than pushes so the entry page stays out of the history', () => {
    createWrapper(true);

    expect(mockRouter.replace).toHaveBeenCalledWith(expectedRoute);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('redirects once the schema arrives after the first render', async() => {
    const { store } = createWrapper(false);

    expect(mockRouter.replace).not.toHaveBeenCalled();

    store.commit('setSchema', true);
    await nextTick();

    expect(mockRouter.replace).toHaveBeenCalledWith(expectedRoute);
    expect(mockRouter.push).not.toHaveBeenCalled();
  });

  it('shows the install view and stays put when the schema is missing', () => {
    const { wrapper } = createWrapper(false);

    expect(wrapper.findComponent({ name: 'InstallView' }).exists()).toBe(true);
    expect(mockRouter.replace).not.toHaveBeenCalled();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
