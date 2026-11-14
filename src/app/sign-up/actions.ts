"use server"

import { createHash } from "crypto"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { hashPassword } from "@/lib/password"
import { safeNext, startSession } from "@/lib/session-cookie"
import type { AuthState } from "../sign-in/actions"

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const name = String(formData.get("name") ?? "").trim().slice(0, 100)
  const password = String(formData.get("password") ?? "")
  const confirm = String(formData.get("confirm") ?? "")
  const next = String(formData.get("next") ?? "")
  const keep = { email, name }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254)
    return { ...keep, error: "Please enter a valid email." }
  if (password.length < 8) return { ...keep, error: "Password must be at least 8 characters." }
  if (password.length > 200) return { ...keep, error: "Password must be at most 200 characters." }
  if (password !== confirm) return { ...keep, error: "Passwords do not match." }

  const existing = await db.user.findUnique({ where: { email } })
  if (existing?.passwordHash)
    return { ...keep, error: "An account with this email already exists. Sign in instead." }

  const passwordHash = await hashPassword(password)
  let user
  if (existing) {
    // Legacy account (email-only login): claim it so the owner keeps their PDFs.
    // Conditional update so two racing claims cannot both succeed.
    const res = await db.user.updateMany({
      where: { id: existing.id, passwordHash: null },
      data: { passwordHash, ...(name ? { name } : {}) },
    })
    if (res.count === 0) return { ...keep, error: "An account with this email already exists. Sign in instead." }
    user = { id: existing.id, email: existing.email, name: name || existing.name }
  } else {
    const id = createHash("sha256").update(email).digest("hex").slice(0, 25)
    try {
      user = await db.user.create({ data: { id, email, name: name || null, passwordHash } })
    } catch {
      return { ...keep, error: "An account with this email already exists. Sign in instead." }
    }
  }

  await startSession({ id: user.id, email: user.email, name: user.name })
  redirect(safeNext(next))
}
