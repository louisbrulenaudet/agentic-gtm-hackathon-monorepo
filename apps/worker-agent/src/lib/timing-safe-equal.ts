/**
 * Constant-time byte-array comparison. Avoids pulling `node:crypto` just for
 * `timingSafeEqual` — keeps the Worker portable and the helper unit-testable
 * without a Workers runtime.
 */
export function timingSafeEqualBytes(a: Uint8Array, b: Uint8Array): boolean {
  // Fold the length mismatch into the diff instead of early-returning. With an
  // early return, an attacker can binary-search the expected length by timing
  // responses across different input lengths; here, response time only depends
  // on `a.length` (attacker-controlled at the API boundary) and never reveals
  // the secret's length.
  let diff = a.length ^ b.length;
  for (let i = 0; i < a.length; i++) {
    diff |= (a[i] ?? 0) ^ (b[i] ?? 0);
  }
  return diff === 0;
}

const textEncoder = new TextEncoder();

export function timingSafeEqualStrings(a: string, b: string): boolean {
  return timingSafeEqualBytes(textEncoder.encode(a), textEncoder.encode(b));
}
