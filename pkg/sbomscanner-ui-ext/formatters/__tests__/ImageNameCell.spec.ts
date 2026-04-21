import { jest } from '@jest/globals';
import { shallowMount, RouterLinkStub } from '@vue/test-utils';
import ImageNameCell from '../ImageNameCell.vue'; // Adjust this path as needed

jest.mock('@sbomscanner-ui-ext/types', () => ({
  PRODUCT_NAME: 'mocked-product',
  PAGE:         { IMAGES: 'mocked-images-page' }
}));

describe('ImageNameCell.vue', () => {
  const mockClusterId = 'c-m-xyz123';

  const mountComponent = (row) => {
    return shallowMount(ImageNameCell, {
      props:  { row },
      global: {
        mocks: { $route: { params: { cluster: mockClusterId } } },
        stubs: { RouterLink: RouterLinkStub }
      }
    });
  };

  it('should render display name from imageMetadata', () => {
    const mockRow = {
      metadata:      { name: 'my-image-resource-name', namespace: 'sbomscanner' },
      imageMetadata: {
        registryURI: 'docker.io',
        repository:  'my-repo/my-app',
        tag:         'v1.0.0'
      },
      kind: 'VulnerabilityReport',
    };
    const expectedDisplayName = 'docker.io/my-repo/my-app:v1.0.0';

    const wrapper = mountComponent(mockRow);
    const linkStub = wrapper.findComponent(RouterLinkStub);

    expect(linkStub.exists()).toBe(true);
    expect(linkStub.text()).toBe(expectedDisplayName);
  });

  it('should build imageDetailLink using metadata.name for VulnerabilityReport', () => {
    const mockRow = {
      kind:     'VulnerabilityReport',
      metadata: { name: 'report-name', namespace: 'sbomscanner' },
      name:     'image-cr-name'
    };

    const wrapper = mountComponent(mockRow);
    const receivedLink = wrapper.vm.imageDetailLink;

    expect(receivedLink.name).toBe('c-cluster-mocked-product-mocked-images-page-namespace-id');
    expect(receivedLink.params.cluster).toBe(mockClusterId);
    expect(receivedLink.params.namespace).toBe('sbomscanner');
    expect(receivedLink.params.id).toBe('report-name');
  });

  it('should build imageDetailLink using row.name for non-VulnerabilityReport', () => {
    const mockRow = {
      kind:     'Image',
      metadata: { name: 'report-name-ignored', namespace: 'sbomscanner' },
      name:     'image-cr-name'
    };

    const wrapper = mountComponent(mockRow);
    const receivedLink = wrapper.vm.imageDetailLink;

    expect(receivedLink.name).toBe('c-cluster-mocked-product-mocked-images-page-namespace-id');
    expect(receivedLink.params.cluster).toBe(mockClusterId);
    expect(receivedLink.params.namespace).toBe('sbomscanner');
    expect(receivedLink.params.id).toBe('image-cr-name');
  });
});
