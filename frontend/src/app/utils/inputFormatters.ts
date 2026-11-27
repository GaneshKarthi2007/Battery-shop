/**
 * Extract digits from a phone string and normalize valid Indian 10-digit numbers.
 * Strips leading +91/91 (when 12 digits) or leading 0 (when 11 digits).
 */
export function normalizeMobile10(raw: string): string {
  let digits = (raw || "").replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    digits = digits.slice(1);
  }
  return digits;
}

export function isValidMobile10(raw: string): boolean {
  return /^\d{10}$/.test(normalizeMobile10(raw));
}

/**
 * Capitalize the first letter of each word (for customer names, custom types, etc.)
 * while keeping existing uppercase acronyms intact.
 */
export function capitalizeEachWord(value: string): string {
  if (!value) return value;
  return value.replace(/(?:^|\s)\S/g, (char) => char.toUpperCase());
}

/**
 * Capitalize only the first non-whitespace character of an input (notes, addresses, details).
 */
export function capitalizeFirstLetter(value: string): string {
  if (!value) return value;
  return value.replace(/^(\s*)(\S)/, (_match, space, first) => `${space}${first.toUpperCase()}`);
}
