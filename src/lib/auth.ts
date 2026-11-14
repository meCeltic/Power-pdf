import { cookies } from "next/headers"
import { SESSION_COOKIE, verifySession } from "./session"

export type AuthUser = { id: string; email: string; name: string | null }

export async function getUser(): Promise<AuthUser | null> {
  const s = await verifySession(cookies().get(SESSION_COOKIE)?.value)
  return s ? { id: s.id, email: s.email, name: s.name } : null
}
