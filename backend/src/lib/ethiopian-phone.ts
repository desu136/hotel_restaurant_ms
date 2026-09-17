/** Ethiopian mobile numbers starting with 9 (Ethio Telecom). */

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

export function ethiopianPhoneLookupValues(value: string): string[] {
  const normalized = normalizeEthiopianPhone(value);
  if (!normalized) return [];
  const national = normalized.slice(4);
  return Array.from(new Set([normalized, `251${national}`, `0${national}`, national]));
}

export function isEmailIdentifier(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function phonesMatch(stored: string | null | undefined, input: string): boolean {
  const left = stored ? normalizeEthiopianPhone(stored) : null;
  const right = normalizeEthiopianPhone(input);
  return Boolean(left && right && left === right);
}

export function coerceEthiopianPhone(
  value: unknown,
  required = false
): { ok: true; phone: string | null } | { ok: false; error: string } {
  const raw = String(value ?? "").trim();
  if (!raw) {
    if (required) {
      return { ok: false, error: "A valid Ethiopian phone number is required" };
    }
    return { ok: true, phone: null };
  }
  const phone = normalizeEthiopianPhone(raw);
  if (!phone) {
    return { ok: false, error: "Enter a valid Ethiopian number: +2519..., 09..., or 9..." };
  }
  return { ok: true, phone };
}
