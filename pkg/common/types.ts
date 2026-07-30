export interface MetadataProperty {
  type: 'text' | 'tags' | 'link' | 'route' | 'date' | 'icon';
  label?: string;
  value?: string;
  tags?: string[];
  route?: object;
  imgSrc?: string;
}
