"use server"

import { createHash } from "crypto"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { SESSION_COOKIE, sessionMaxAgeSeconds, signSession } from "@/lib/session"

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const name = String(formData.get("name") ?? "").trim() || null
  const next = String(formData.get("next") ?? "")
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    redirect("/sign-in?error=invalid")
  }

  const id = createHash("sha256").update(email).digest("hex").slice(0, 25)
  const user = await db.user.upsert({
    where: { email },
    update: name ? { name } : {},
    create: { id, email, name },
  })

  const token = await signSession({ id: user.id, email: user.email, name: user.name })
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds,
  })
  redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard")
}
