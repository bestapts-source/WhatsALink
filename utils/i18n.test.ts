import { describe, expect, it } from 'vitest';
import { t, lang, dir } from '../src/i18n';

describe('i18n', () => {
  it('falls back to English in the test environment', () => {
    expect(lang).toBe('en');
    expect(dir).toBe('ltr');
    expect(t('startChat')).toBe('Start Chat');
  });
  it('interpolates variables', () => {
    expect(t('digits', { n: 12 })).toBe('12 digits');
    expect(t('prefixApplied', { dial: '44' })).toBe('Prefix +44 applied');
  });
});
