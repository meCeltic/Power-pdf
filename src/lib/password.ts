import "server-only"
import { randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto"

const N = 16384
const R = 8
const P = 1
const KEYLEN = 64

function scryptAsync(password: string, salt: Buffer, n: number, r: number, p: number, keylen: number) {
  const opts: ScryptOptions = { N: n, r, p, maxmem: 128 * n * r * 2 }
  return new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, keylen, opts, (err, key) => (err ? reject(err) : resolve(key)))
  )
}

// Format: scrypt$N$r$p$saltHex$hashHex
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16)
  const key = await scryptAsync(password, salt, N, R, P, KEYLEN)
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${key.toString("hex")}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [alg, n, r, p, saltHex, hashHex] = stored.split("$")
    if (alg !== "scrypt" || !saltHex || !hashHex) return false
    const expected = Buffer.from(hashHex, "hex")
    const key = await scryptAsync(password, Buffer.from(saltHex, "hex"), +n, +r, +p, expected.length)
    return key.length === expected.length && timingSafeEqual(key, expected)
  } catch {
    return false
  }
}

let dummyHash: Promise<string> | null = null
/** Burn roughly one scrypt verification (used when the user does not exist). */
export async function dummyVerify(password: string) {
  dummyHash ??= hashPassword("dummy-password")
  await verifyPassword(password, await dummyHash)
}
