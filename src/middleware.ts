import { NextResponse, type NextRequest } from "next/server"
import { SESSION_COOKIE, verifySession } from "./lib/session"

export default async function middleware(req: NextRequest) {
  const session = await verifySession(req.cookies.get(SESSION_COOKIE)?.value)
  if (!session) {
    const url = new URL("/sign-in", req.url)
    url.searchParams.set("next", req.nextUrl.pathname)
    return NextResponse.redirect(url)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
