import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback) as (
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
) => Promise<Buffer>;

/**
 * Password hashing with scrypt from Node core.
 *
 * scrypt is memory-hard and included in Node, so there is no native module to
 * compile — which matters because this project must build identically on
 * Windows, Linux and serverless runtimes.
 *
 * Digest format: scrypt$N$r$p$<salt-b64>$<hash-b64>
 */

const N = 16384; // CPU/memory cost
const R = 8; // block size
const P = 1; // parallelisation
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derived = await scrypt(password.normalize('NFKC'), salt, KEY_LENGTH);
  return ['scrypt', N, R, P, salt.toString('base64'), derived.toString('base64')].join('$');
}

export async function verifyPassword(password: string, digest: string): Promise<boolean> {
  const parts = digest.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;

  const saltPart = parts[4];
  const hashPart = parts[5];
  if (!saltPart || !hashPart) return false;

  let salt: Buffer;
  let expected: Buffer;
  try {
    salt = Buffer.from(saltPart, 'base64');
    expected = Buffer.from(hashPart, 'base64');
  } catch {
    return false;
  }
  if (expected.length === 0) return false;

  const actual = await scrypt(password.normalize('NFKC'), salt, expected.length);
  // Constant-time comparison: never leak how much of the hash matched.
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
