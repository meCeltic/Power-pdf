// Edge-safe (Web Crypto) signed-session helpers.
export const SESSION_COOKIE = "session"
const MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30

export type SessionPayload = { id: string; email: string; name: string | null; exp: number }

const enc = new TextEncoder()

function b64url(bytes: Uint8Array) {
  let s = ""
  bytes.forEach((b) => (s += String.fromCharCode(b)))
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")
}
function fromB64url(s: string) {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"))
  return Uint8Array.from(bin, (c) => c.charCodeAt(0))
}

async function hmacKey(usage: KeyUsage[]) {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error("AUTH_SECRET is not set")
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, usage)
}

export async function signSession(user: { id: string; email: string; name: string | null }) {
  const payload: SessionPayload = { ...user, exp: Date.now() + MAX_AGE_MS }
  const body = b64url(enc.encode(JSON.stringify(payload)))
  const sig = await crypto.subtle.sign("HMAC", await hmacKey(["sign"]), enc.encode(body))
  return `${body}.${b64url(new Uint8Array(sig))}`
}

export async function verifySession(token: string | undefined | null): Promise<SessionPayload | null> {
  if (!token) return null
  try {
    const [body, sig] = token.split(".")
    if (!body || !sig) return null
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(["verify"]), fromB64url(sig), enc.encode(body))
    if (!ok) return null
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(body))) as SessionPayload
    if (!payload.exp || payload.exp < Date.now()) return null
    return payload
  } catch {
    return null
  }
}

export const sessionMaxAgeSeconds = MAX_AGE_MS / 1000
