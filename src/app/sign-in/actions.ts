"use server"

import { redirect } from "next/navigation"
import { db } from "@/db"
import { dummyVerify, verifyPassword } from "@/lib/password"
import { safeNext, startSession } from "@/lib/session-cookie"

export type AuthState = { error?: string; hint?: string; email?: string; name?: string }

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const password = String(formData.get("password") ?? "")
  const next = String(formData.get("next") ?? "")

  const fail: AuthState = {
    error: "Invalid email or password.",
    hint: "Created your account before passwords? Sign up with the same email to set one.",
    email,
  }
  if (!email || !password || password.length > 200) return fail

  const user = await db.user.findUnique({ where: { email } })
  if (!user || !user.passwordHash) {
    await dummyVerify(password)
    return fail
  }
  if (!(await verifyPassword(password, user.passwordHash))) return fail

  await startSession({ id: user.id, email: user.email, name: user.name })
  redirect(safeNext(next))
}
