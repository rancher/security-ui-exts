import { shallowMount } from '@vue/test-utils';
import ExpandableDescription from '../ExpandableDescription.vue';

describe('ExpandableDescription.vue', () => {
  let wrapper;

  const createWrapper = (props = {}) => {
    return shallowMount(ExpandableDescription, {
      props: {
        text: 'Default testing text',
        ...props
      },
      global: {
        mocks: {
          t: (key) => key
        }
      }
    });
  };

  const mockDimensions = (contentRef, scrollHeight, clientHeight) => {
    Object.defineProperty(contentRef, 'scrollHeight', { value: scrollHeight, configurable: true });
    Object.defineProperty(contentRef, 'clientHeight', { value: clientHeight, configurable: true });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
    jest.clearAllMocks();
  });

  describe('Rendering and Default State', () => {
    it('renders the provided text', () => {
      wrapper = createWrapper({ text: 'Hello World' });
      const content = wrapper.find('.content-text');
      expect(content.text()).toBe('Hello World');
    });

    it('applies the clamped class by default', () => {
      wrapper = createWrapper();
      const content = wrapper.find('.content-text');
      expect(content.classes()).toContain('clamped');
      expect(content.classes()).not.toContain('expanded');
    });

    it('sets the correct CSS variable for line clamps', () => {
      wrapper = createWrapper({ lines: 5 });
      const content = wrapper.find('.content-text');
      expect(content.attributes('style')).toContain('--line-clamp: 5');
    });
  });

  describe('Truncation Logic', () => {
    it('shows the "read more" button when scrollHeight is greater than clientHeight', async () => {
      wrapper = createWrapper();

      mockDimensions(wrapper.vm.$refs.content, 100, 60);

      wrapper.vm.checkTruncation();

      // We need TWO nextTicks:
      // 1st evaluates the height inside checkTruncation's inner $nextTick
      // 2nd allows Vue to actually update the DOM with the new button
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isTruncatable).toBe(true);
      expect(wrapper.find('.read-more-btn').exists()).toBe(true);
      expect(wrapper.find('.read-more-btn').text()).toBe('imageScanner.general.readMore');
    });

    it('hides the "read more" button when text fits perfectly', async () => {
      wrapper = createWrapper();

      mockDimensions(wrapper.vm.$refs.content, 40, 40);

      wrapper.vm.checkTruncation();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.isTruncatable).toBe(false);
      expect(wrapper.find('.read-more-btn').exists()).toBe(false);
    });
  });

  describe('User Interaction', () => {
    it('expands the text and hides the button when "read more" is clicked', async () => {
      wrapper = createWrapper();

      // Force it to be truncatable first so the button renders
      mockDimensions(wrapper.vm.$refs.content, 100, 60);
      wrapper.vm.checkTruncation();
      await wrapper.vm.$nextTick();
      await wrapper.vm.$nextTick();

      // Ensure button is there, then click it
      const btn = wrapper.find('.read-more-btn');
      expect(btn.exists()).toBe(true);
      await btn.trigger('click');

      // Verify the state changes
      expect(wrapper.vm.isExpanded).toBe(true);
      expect(wrapper.find('.content-text').classes()).toContain('expanded');
      expect(wrapper.find('.content-text').classes()).not.toContain('clamped');

      // The button should disappear after expanding
      expect(wrapper.find('.read-more-btn').exists()).toBe(false);
    });
  });

  describe('Watchers and Lifecycle Hooks', () => {
    it('re-evaluates truncation when the text prop changes', async () => {
      wrapper = createWrapper();
      const checkSpy = jest.spyOn(wrapper.vm, 'checkTruncation');

      await wrapper.setProps({ text: 'A completely new, much longer description string.' });

      expect(checkSpy).toHaveBeenCalled();
    });

    it('attaches and removes window resize listeners', () => {
      const addEventListenerSpy = jest.spyOn(window, 'addEventListener');
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      wrapper = createWrapper();

      // Listener should be added on mount
      expect(addEventListenerSpy).toHaveBeenCalledWith('resize', wrapper.vm.checkTruncation);

      wrapper.unmount(); // Updated to unmount()

      // Listener should be cleaned up on destroy
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', wrapper.vm.checkTruncation);
    });
  });
});