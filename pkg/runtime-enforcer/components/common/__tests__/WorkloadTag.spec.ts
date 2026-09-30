import { mount } from '@vue/test-utils';

jest.mock('@shell/components/Resource/Detail/CopyToClipboard.vue', () => ({
  __esModule: true,
  default:    {
    name: 'CopyToClipboard', props: ['value'], template: '<button class="cp-board" />'
  },
}));

import WorkloadTag from '../WorkloadTag.vue';

describe('WorkloadTag.vue', () => {
  it('renders the label text in the tag', () => {
    const wrapper = mount(WorkloadTag, { props: { label: 'runtimeenforcer.kubewarden.io/policy : policy-a' } });

    expect(wrapper.find('.tag-data').text()).toBe('runtimeenforcer.kubewarden.io/policy : policy-a');
  });

  it('passes the label as the value to copy', () => {
    const wrapper = mount(WorkloadTag, { props: { label: 'runtimeenforcer.kubewarden.io/policy : policy-a' } });

    expect(wrapper.findComponent({ name: 'CopyToClipboard' }).props('value')).toBe('runtimeenforcer.kubewarden.io/policy : policy-a');
  });
});
