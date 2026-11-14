import { NextRequest, NextResponse } from "next/server"
import { SESSION_COOKIE } from "@/lib/session"

const handler = (req: NextRequest) => {
  const res = NextResponse.redirect(new URL("/", req.url), 303)
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 })
  return res
}
export const GET = handler
export const POST = handler
