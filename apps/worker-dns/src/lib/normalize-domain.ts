const DOMAIN_PATTERN = /^(?!-)([a-z0-9-]{1,63}(?<!-)\.)+[a-z]{2,63}$/i;

export class InvalidDomainError extends Error {
  constructor(input: string) {
    super(`"${input}" is not a valid domain name`);
    this.name = "InvalidDomainError";
  }
}

/**
 * Accepts messy caller input (a bare domain, a full URL, a domain with a
 * trailing slash/path/port) and returns the canonical lowercase hostname, or
 * throws `InvalidDomainError` if no valid domain can be extracted.
 */
export function normalizeDomain(input: string): string {
  const trimmed = input.trim();
  const withoutScheme = trimmed.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "");
  const hostname = withoutScheme.split(/[/?#]/)[0] ?? "";
  const withoutPort = hostname.split(":")[0] ?? "";
  const normalized = withoutPort.toLowerCase().replace(/\.$/, "");

  if (!DOMAIN_PATTERN.test(normalized)) {
    throw new InvalidDomainError(input);
  }

  return normalized;
}
