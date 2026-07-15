export interface MetadataProperty {
  type: 'text' | 'tags' | 'link' | 'route';
  label?: string;
  value?: string;
  tags?: string[];
  route: object;
}
