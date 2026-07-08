import { mount } from '@vue/test-utils';

import InstallWizard from '../InstallWizard.vue';

const createSteps = () => ([
  {
    name:  'auth',
    label: 'Auth',
    ready: true,
  },
  {
    name:  'repos',
    label: 'Repositories',
    ready: false,
  },
  {
    name:  'install',
    label: 'Install',
    ready: false,
  },
]);

const createWrapper = (props = {}) => {
  return mount(InstallWizard, {
    props: {
      steps: createSteps(),
      ...props,
    },
    slots: {
      auth:          '<div data-testid="auth-slot">Auth Content</div>',
      repos:         '<div data-testid="repos-slot">Repo Content</div>',
      install:       '<div data-testid="install-slot">Install Content</div>',
      bannerSubtext: '<span data-testid="banner-subtext">Banner Subtext</span>',
    },
  });
};

describe('InstallWizard.vue', () => {
  it('initializes active step from initStepIndex and renders that slot', () => {
    const wrapper = createWrapper({ initStepIndex: 1 });

    expect(wrapper.text()).toContain('Step 2');
    expect(wrapper.find('[data-testid="repos-slot"]').exists()).toBe(true);
    expect(wrapper.find('[data-testid="auth-slot"]').exists()).toBe(false);
  });

  it('renders the default title and active step label area', () => {
    const wrapper = createWrapper();

    expect(wrapper.text()).toContain('Runtime Enforcer');
    expect(wrapper.find('[data-testid="banner-subtext"]').exists()).toBe(true);
  });

  it('hides the product title when showTitle is false', () => {
    const wrapper = createWrapper({ showTitle: false });

    expect(wrapper.text()).not.toContain('Runtime Enforcer');
  });

  it('marks the first step as disabled because it is not navigable from the sequence', () => {
    const wrapper = createWrapper();

    expect(wrapper.find('#auth').classes()).toContain('disabled');
  });

  it('marks later step as disabled when a previous step is not ready', () => {
    const steps = createSteps();

    steps[0].ready = false;
    const wrapper = createWrapper({ steps });

    expect(wrapper.find('#repos').classes()).toContain('disabled');
  });

  it('goToStep emits next and changes active step when target is available', async() => {
    const steps = createSteps();

    steps[0].ready = true;
    const wrapper = createWrapper({ steps });

    await wrapper.vm.goToStep(2, true);

    expect(wrapper.emitted('next')).toEqual([[{ step: steps[1] }]]);
    expect(wrapper.find('[data-testid="repos-slot"]').exists()).toBe(true);
  });

  it('goToStep ignores invalid step numbers', async() => {
    const wrapper = createWrapper();

    await wrapper.vm.goToStep(0);

    expect(wrapper.emitted('next')).toBeUndefined();
    expect(wrapper.find('[data-testid="auth-slot"]').exists()).toBe(true);
  });

  it('goToStep does not navigate to unavailable step unless confirmedReady is true', async() => {
    const steps = createSteps();

    steps[0].ready = false;
    const wrapper = createWrapper({ steps });

    await wrapper.vm.goToStep(2);

    expect(wrapper.emitted('next')).toBeUndefined();
    expect(wrapper.find('[data-testid="auth-slot"]').exists()).toBe(true);
  });

  it('updates active step when props change', async() => {
    const wrapper = createWrapper({ initStepIndex: 0 });

    await wrapper.setProps({ initStepIndex: 2 });

    expect(wrapper.text()).toContain('Step 3');
    expect(wrapper.find('[data-testid="install-slot"]').exists()).toBe(true);
  });

  it('renders hidden step containers even when not active', () => {
    const steps = createSteps();

    steps[2].hidden = true;
    const wrapper = createWrapper({ steps });

    expect(wrapper.find('[data-testid="install-slot"]').exists()).toBe(true);
  });
});