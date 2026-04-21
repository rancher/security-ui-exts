import { shallowMount } from '@vue/test-utils';
import ScoreBadge from '../ScoreBadge.vue';
import { SEVERITY } from '@sbomscanner-ui-ext/types/image';

jest.mock('@sbomscanner-ui-ext/types/image', () => ({
  SEVERITY: {
    CRITICAL: 'critical',
    HIGH:     'high',
    MEDIUM:   'medium',
    LOW:      'low',
  }
}));

describe('ScoreBadge.vue', () => {
  describe('Display Text', () => {
    it('displays "n/a" when no score or scoreType are provided', () => {
      const wrapper = shallowMount(ScoreBadge);

      expect(wrapper.text().trim()).toBe('n/a');
    });

    it('displays "7.5" when only score is provided', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { score: '7.5' } });

      expect(wrapper.text().trim()).toBe('7.5');
    });

    it('displays empty when only scoreType is provided', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { scoreType: '' } });

      expect(wrapper.text().trim()).toBe('n/a');
    });

    it('displays formatted score and type when both are provided', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { score: '8.1', scoreType: 'v3' } });

      expect(wrapper.text().trim()).toBe('8.1 (v3)');
    });
  });

  describe('Severity Classes (computedSeverity)', () => {
    it('returns "na" when severity is not provided', () => {
      const wrapper = shallowMount(ScoreBadge);

      expect(wrapper.vm.computedSeverity).toBe('na');
    });

    it('returns "na" when score is missing even if severity is provided', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'critical' } });

      expect(wrapper.vm.computedSeverity).toBe('na');
    });

    it('returns "critical" for CRITICAL severity', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'critical', score: '9.0' } });

      expect(wrapper.vm.computedSeverity).toBe(SEVERITY.CRITICAL);
    });

    it('is case-insensitive for "Critical"', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'Critical', score: '9.0' } });

      expect(wrapper.vm.computedSeverity).toBe(SEVERITY.CRITICAL);
    });

    it('returns "high" for HIGH severity', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'high', score: '8.0' } });

      expect(wrapper.vm.computedSeverity).toBe(SEVERITY.HIGH);
    });

    it('returns "medium" for MEDIUM severity', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'medium', score: '6.0' } });

      expect(wrapper.vm.computedSeverity).toBe(SEVERITY.MEDIUM);
    });

    it('returns "low" for LOW severity', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'low', score: '3.0' } });

      expect(wrapper.vm.computedSeverity).toBe(SEVERITY.LOW);
    });

    it('returns "na" for unknown severity', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'unknown', score: '5.0' } });

      expect(wrapper.vm.computedSeverity).toBe('na');
    });

    it('applies the computed severity class to the root element', () => {
      const wrapper = shallowMount(ScoreBadge, { props: { severity: 'high', score: '8.0' } });

      expect(wrapper.classes()).toContain('high');
    });
  });
});
