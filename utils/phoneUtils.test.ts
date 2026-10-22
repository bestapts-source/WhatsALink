import { describe, expect, it } from 'vitest';
import { extractPhoneNumber, formatPhoneNumber } from './phoneUtils';

describe('formatPhoneNumber', () => {
  it('keeps explicit international numbers', () => {
    expect(formatPhoneNumber('+44 7911 123456')).toBe('447911123456');
    expect(formatPhoneNumber('+1 (415) 555-2671')).toBe('14155552671');
    expect(formatPhoneNumber('+81 90-1234-5678')).toBe('819012345678');
  });
  it('treats 00 as +', () => {
    expect(formatPhoneNumber('0044 7911 123456')).toBe('447911123456');
  });
  it('applies the selected country and drops the trunk zero', () => {
    expect(formatPhoneNumber('07911 123456', 'GB')).toBe('447911123456');
    expect(formatPhoneNumber('0912345678', 'VN')).toBe('84912345678');
    expect(formatPhoneNumber('0171 1234567', 'DE')).toBe('491711234567');
  });
  it('keeps the Israeli 05 shortcut working', () => {
    expect(formatPhoneNumber('050-123-4567', 'IL')).toBe('972501234567');
  });
  it('rejects junk', () => {
    expect(formatPhoneNumber('abc')).toBeNull();
    expect(formatPhoneNumber('123')).toBeNull();
  });
});

describe('extractPhoneNumber', () => {
  it('finds numbers from many countries in messy text', () => {
    expect(extractPhoneNumber('Call John: +49 171 1234567 after 5pm')).toBe('491711234567');
    expect(extractPhoneNumber('Cell +1 (415) 555-2671, office 212-555-0100')).toBe('14155552671');
    expect(extractPhoneNumber('contact 0044 7911 123456 thanks')).toBe('447911123456');
    expect(extractPhoneNumber('Sig: Maria, tel +55 11 91234-5678')).toBe('5511912345678');
  });
  it('uses the selected country for local numbers', () => {
    expect(extractPhoneNumber('my number is 07911 123456', 'GB')).toBe('447911123456');
    expect(extractPhoneNumber('חייגו 050-1234567 תודה', 'IL')).toBe('972501234567');
  });
  it('returns null when there is nothing', () => {
    expect(extractPhoneNumber('hello world, no digits here')).toBeNull();
  });
});
