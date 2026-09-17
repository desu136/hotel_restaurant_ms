/** Ethiopian mobile numbers starting with 9 (Ethio Telecom). */

export const ETHIOPIAN_PHONE_HINT = "Accepted: +2519XXXXXXXX, 09XXXXXXXX, or 9XXXXXXXX";
export const ETHIOPIAN_PHONE_ERROR = "Enter a valid Ethiopian number: +2519..., 09..., or 9...";

/**
 * Normalize +2519..., 09..., or 9... into E.164 (+2519XXXXXXXX).
 * Returns null when the value is not a valid Ethiopian mobile number.
 */
export function normalizeEthiopianPhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  let national: string | null = null;

  if (digits.startsWith("251") && digits.length === 12) {
    national = digits.slice(3);
  } else if (digits.startsWith("09") && digits.length === 10) {
    national = digits.slice(1);
  } else if (digits.startsWith("9") && digits.length === 9) {
    national = digits;
  }

  if (!national || !/^9\d{8}$/.test(national)) return null;
  return `+251${national}`;
}

export function isValidEthiopianPhone(value: string): boolean {
  return normalizeEthiopianPhone(value) !== null;
}

export function isEmailIdentifier(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
