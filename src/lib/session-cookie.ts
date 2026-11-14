import "server-only"
import { cookies } from "next/headers"
import { SESSION_COOKIE, sessionMaxAgeSeconds, signSession } from "./session"

export async function startSession(user: { id: string; email: string; name: string | null }) {
  const token = await signSession(user)
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  })
}

export function safeNext(next: string) {
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : "/dashboard"
}
