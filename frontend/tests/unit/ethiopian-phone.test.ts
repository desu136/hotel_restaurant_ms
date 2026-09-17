import { describe, expect, it } from 'vitest';
import {
  ETHIOPIAN_PHONE_ERROR,
  isEmailIdentifier,
  isValidEthiopianPhone,
  normalizeEthiopianPhone,
} from '@/lib/ethiopian-phone';

describe('ethiopian-phone', () => {
  it('normalizes +251, 09, and 9 formats to E.164', () => {
    expect(normalizeEthiopianPhone('0912345678')).toBe('+251912345678');
    expect(normalizeEthiopianPhone('912345678')).toBe('+251912345678');
    expect(normalizeEthiopianPhone('+251 91 234 5678')).toBe('+251912345678');
  });

  it('rejects non-Ethiopian and incomplete numbers', () => {
    expect(normalizeEthiopianPhone('555-0100')).toBeNull();
    expect(normalizeEthiopianPhone('0812345678')).toBeNull();
    expect(isValidEthiopianPhone('091234567')).toBe(false);
  });

  it('treats emails as identifiers and phones as not emails', () => {
    expect(isEmailIdentifier('owner@example.com')).toBe(true);
    expect(isEmailIdentifier('0912345678')).toBe(false);
  });

  it('exports a user-facing error string', () => {
    expect(ETHIOPIAN_PHONE_ERROR).toMatch(/ethiopian number/i);
  });
});
