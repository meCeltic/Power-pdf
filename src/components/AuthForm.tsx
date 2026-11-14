"use client"

import { useFormState, useFormStatus } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { AuthState } from "@/app/sign-in/actions"

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Please wait..." : label}
    </Button>
  )
}

export default function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "sign-in" | "sign-up"
  action: (prev: AuthState, fd: FormData) => Promise<AuthState>
  next: string
}) {
  const [state, formAction] = useFormState(action, {} as AuthState)
  const up = mode === "sign-up"
  return (
    <form action={formAction} className="mt-8 flex w-full max-w-sm flex-col gap-3">
      <input type="hidden" name="next" value={next} />
      {up ? <Input name="name" type="text" maxLength={100} placeholder="Name (optional)" defaultValue={state.name} /> : null}
      <Input name="email" type="email" required placeholder="you@example.com" defaultValue={state.email} />
      <Input
        name="password"
        type="password"
        required
        minLength={up ? 8 : undefined}
        maxLength={200}
        autoComplete={up ? "new-password" : "current-password"}
        placeholder="Password"
      />
      {up ? (
        <Input name="confirm" type="password" required maxLength={200} autoComplete="new-password" placeholder="Confirm password" />
      ) : null}
      {state.error ? (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      ) : null}
      {state.hint ? <p className="text-xs text-zinc-500">{state.hint}</p> : null}
      <Submit label={up ? "Create account" : "Sign in"} />
    </form>
  )
}
