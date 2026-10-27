// Cryptographic utilities for 4-digit numeric PIN protection
// Uses native Web Crypto API (SHA-256 with high-entropy salt)

export async function hashPin(pin: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${pin}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function generateSalt(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPin(
  pin: string,
  salt: string,
  expectedHash: string
): Promise<boolean> {
  if (!pin || pin.length !== 4 || !salt || !expectedHash) {
    return false;
  }
  const computed = await hashPin(pin, salt);
  return computed === expectedHash;
}
