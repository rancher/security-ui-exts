import { mount } from '@vue/test-utils';
import { jest } from '@jest/globals';
import VexHub from '../sbomscanner.kubewarden.io.vexhub.vue'; // Adjust path as needed
import { useStore } from 'vuex';
import { useI18n } from '@shell/composables/useI18n';

// 1. Mock Vuex safely
jest.mock('vuex', () => ({
  useStore: jest.fn(),
  mapGetters: jest.fn(),
  mapState: jest.fn()
}));

jest.mock('@shell/composables/useI18n', () => ({
  useI18n: jest.fn()
}));

// 2. Mock heavy Rancher @shell components at the module level
// to bypass deep import compilation errors and warnings!
jest.mock('@shell/components/Resource/Detail/Page.vue', () => ({
  default: {
    name: 'DetailPage',
    template: '<div class="detail-page-stub"><slot name="top-area" /></div>'
  }
}));

jest.mock('@shell/components/Resource/Detail/TitleBar/index.vue', () => ({
  default: {
    name: 'TitleBar',
    template: '<div class="title-bar-stub"><slot name="additional-actions" /></div>',
    props: ['resource', 'resourceName', 'resourceTypeLabel', 'resourceTo', 'badge', 'actionMenuResource', 'showViewOptions']
  }
}));

jest.mock('@shell/components/Resource/Detail/Metadata/index.vue', () => ({
  default: {
    name: 'Metadata',
    template: '<div class="metadata-stub"></div>',
    props: ['resource', 'identifyingInformation', 'annotations', 'labels']
  }
}));

jest.mock('@shell/components/formatter/Date.vue', () => ({
  default: { name: 'DateFormatter', template: '<span></span>' }
}));

describe('vexhub.vue', () => {
  let mockStore;
  let mockT;

  beforeEach(() => {
    mockStore = {
      getters: {},
      dispatch: jest.fn()
    };
    (useStore as jest.Mock).mockReturnValue(mockStore);

    // Mock translation function to return the key
    mockT = jest.fn((key) => key);
    (useI18n as jest.Mock).mockReturnValue({ t: mockT });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (propsValue = {}) => {
    return mount(VexHub, {
      props: {
        value: propsValue
      },
      global: {
        stubs: {
          // We only need to stub our own custom components here now
          ExpandableDescription: { template: '<div class="expandable-description-stub"></div>', props: ['text', 'lines'] }
        }
      }
    });
  };

  const baseVexHubValue = {
    metadata: {
      name: 'demo-vexhub',
      generation: 1,
      creationTimestamp: '2026-04-23T11:29:57Z'
    },
    spec: {
      enabled: true,
      url: 'http://test.com'
    },
    description: 'This is a test description for the vexhub.',
    listLocation: { name: 'vex-list-route' },
    toggle: {
      label: 'Disable',
      icon: 'icon-pause',
      invoke: jest.fn()
    }
  };

  describe('Component Rendering & Layout', () => {
    it('renders the core layout components', () => {
      const wrapper = createWrapper(baseVexHubValue);

      expect(wrapper.find('.detail-page-stub').exists()).toBe(true);
      expect(wrapper.find('.title-bar-stub').exists()).toBe(true);
      expect(wrapper.find('.metadata-stub').exists()).toBe(true);
      expect(wrapper.find('.expandable-description-stub').exists()).toBe(true);
    });

    it('hides the ExpandableDescription if no description is provided', () => {
      const noDescValue = { ...baseVexHubValue, description: undefined };
      const wrapper = createWrapper(noDescValue);

      expect(wrapper.find('.expandable-description-stub').exists()).toBe(false);
    });
  });

  describe('Computed: defaultMastheadProps', () => {
    it('computes titleBarProps correctly when enabled', () => {
      const wrapper = createWrapper(baseVexHubValue);
      const titleBar = wrapper.findComponent('.title-bar-stub');

      expect(titleBar.props('resource')).toEqual(baseVexHubValue);
      expect(titleBar.props('resourceName')).toBe('demo-vexhub');
      expect(titleBar.props('resourceTypeLabel')).toBe('imageScanner.vexManagement.title');
      expect(titleBar.props('resourceTo')).toEqual({ name: 'vex-list-route' });
      expect(titleBar.props('showViewOptions')).toBe(false);

      // Check Badge
      expect(titleBar.props('badge')).toEqual({
        color: 'bg-success',
        label: 'imageScanner.enum.status.enabled'
      });
    });

    it('computes titleBarProps correctly when disabled', () => {
      const disabledValue = { ...baseVexHubValue, spec: { ...baseVexHubValue.spec, enabled: false } };
      const wrapper = createWrapper(disabledValue);
      const titleBar = wrapper.findComponent('.title-bar-stub');

      expect(titleBar.props('badge')).toEqual({
        color: 'bg-error',
        label: 'imageScanner.enum.status.disabled'
      });
    });

    it('computes metadataProps correctly for generation 1 (Rancher)', () => {
      const wrapper = createWrapper(baseVexHubValue);
      const metadata = wrapper.findComponent('.metadata-stub');
      const identifyingInfo = metadata.props('identifyingInformation');

      expect(identifyingInfo).toHaveLength(4);

      // URI
      expect(identifyingInfo[0].label).toBe('URI');
      expect(identifyingInfo[0].value).toBe('http://test.com');

      // Created by (Generation 1 = Rancher)
      expect(identifyingInfo[1].label).toBe('Created by');
      expect(identifyingInfo[1].value).toBe('Rancher');

      // Last sync
      expect(identifyingInfo[2].label).toBe('Last sync');
      expect(identifyingInfo[2].value).toBeUndefined();

      // Updated
      expect(identifyingInfo[3].label).toBe('Updated');
      expect(identifyingInfo[3].value).toBe('2026-04-23T11:29:57Z');
    });

    it('computes metadataProps correctly for generation > 1 (Manual entry)', () => {
      const manualValue = { ...baseVexHubValue, metadata: { ...baseVexHubValue.metadata, generation: 2 } };
      const wrapper = createWrapper(manualValue);
      const metadata = wrapper.findComponent('.metadata-stub');
      const identifyingInfo = metadata.props('identifyingInformation');

      // Created by (Generation != 1 = Manual entry)
      expect(identifyingInfo[1].label).toBe('Created by');
      expect(identifyingInfo[1].value).toBe('Manual entry');
    });
  });

  describe('User Interactions', () => {
    it('renders the toggle button with correct label and icon if value.toggle exists', () => {
      const wrapper = createWrapper(baseVexHubValue);
      const button = wrapper.find('[data-testid="detail-explore-button"]');

      expect(button.exists()).toBe(true);
      expect(button.text()).toContain('Disable');
      expect(button.find('i').classes()).toContain('icon-pause');
    });

    it('invokes the toggle function when the action button is clicked', async () => {
      const invokeMock = jest.fn();
      const val = { ...baseVexHubValue, toggle: { label: 'Enable', icon: 'icon-play', invoke: invokeMock } };
      const wrapper = createWrapper(val);
      const button = wrapper.find('[data-testid="detail-explore-button"]');

      await button.trigger('click');

      expect(invokeMock).toHaveBeenCalledTimes(1);
    });

    it('does not render the toggle button if value.toggle is missing', () => {
      const noToggleValue = { ...baseVexHubValue, toggle: undefined };
      const wrapper = createWrapper(noToggleValue);
      const button = wrapper.find('[data-testid="detail-explore-button"]');

      expect(button.exists()).toBe(false);
    });
  });
});