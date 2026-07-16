export interface MetadataProperty {
  type: 'text' | 'tags' | 'link' | 'route' | 'date';
  label?: string;
  value?: string;
  tags?: string[];
  route?: object;
}
