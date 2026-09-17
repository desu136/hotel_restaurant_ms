import {
  coerceEthiopianPhone,
  ethiopianPhoneLookupValues,
  isEmailIdentifier,
  normalizeEthiopianPhone,
  phonesMatch,
} from '../../src/lib/ethiopian-phone';

describe('ethiopian-phone', () => {
  describe('normalizeEthiopianPhone', () => {
    test.each([
      ['0912345678', '+251912345678'],
      ['912345678', '+251912345678'],
      ['+251912345678', '+251912345678'],
      ['251912345678', '+251912345678'],
      ['+251 91 234 5678', '+251912345678'],
      ['09-123-45678', '+251912345678'],
    ])('accepts %s', (input, expected) => {
      expect(normalizeEthiopianPhone(input)).toBe(expected);
    });

    test.each(['', '   ', '555-0100', '0812345678', '91234567', '09123456789', '123456789', 'not-a-phone'])(
      'rejects %s',
      (input) => {
        expect(normalizeEthiopianPhone(input)).toBeNull();
      }
    );
  });

  describe('ethiopianPhoneLookupValues', () => {
    test('returns all stored formats for a valid number', () => {
      expect(ethiopianPhoneLookupValues('0912345678').sort()).toEqual(
        ['+251912345678', '0912345678', '251912345678', '912345678'].sort()
      );
    });

    test('returns empty for invalid input', () => {
      expect(ethiopianPhoneLookupValues('555-0100')).toEqual([]);
    });
  });

  describe('isEmailIdentifier', () => {
    test('detects emails', () => {
      expect(isEmailIdentifier('Owner@Example.com')).toBe(true);
    });

    test('rejects phones and empty strings', () => {
      expect(isEmailIdentifier('0912345678')).toBe(false);
      expect(isEmailIdentifier('')).toBe(false);
    });
  });

  describe('phonesMatch', () => {
    test('matches equivalent formats', () => {
      expect(phonesMatch('+251912345678', '0912345678')).toBe(true);
      expect(phonesMatch('912345678', '251912345678')).toBe(true);
    });

    test('does not match different numbers or missing stored values', () => {
      expect(phonesMatch('+251912345678', '0911111111')).toBe(false);
      expect(phonesMatch(null, '0912345678')).toBe(false);
    });
  });

  describe('coerceEthiopianPhone', () => {
    test('returns null when optional and empty', () => {
      expect(coerceEthiopianPhone('', false)).toEqual({ ok: true, phone: null });
    });

    test('requires a number when asked', () => {
      const result = coerceEthiopianPhone('  ', true);
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.error).toMatch(/required/i);
    });

    test('normalizes valid input', () => {
      expect(coerceEthiopianPhone('0912345678')).toEqual({ ok: true, phone: '+251912345678' });
    });

    test('rejects invalid input', () => {
      const result = coerceEthiopianPhone('555-0100');
      expect(result.ok).toBe(false);
    });
  });
});
