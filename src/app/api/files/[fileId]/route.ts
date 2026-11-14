import { NextRequest } from "next/server"
import { db } from "@/db"
import { getUser } from "@/lib/auth"
import { readPdf } from "@/lib/storage"

export const runtime = "nodejs"

export async function GET(_req: NextRequest, { params }: { params: { fileId: string } }) {
  const user = await getUser()
  if (!user) return new Response("UNAUTHORIZED", { status: 401 })

  const file = await db.file.findFirst({ where: { id: params.fileId, userId: user.id } })
  if (!file) return new Response("NOT_FOUND", { status: 404 })

  const data = await readPdf(file)
  if (!data) return new Response("NOT_FOUND", { status: 404 })
  return new Response(data, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  })
}
