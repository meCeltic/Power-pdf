import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { getUser } from "@/lib/auth"
import { processPdf } from "@/lib/processPdf"
import { savePdf } from "@/lib/storage"
import { MAX_UPLOAD_MB } from "@/config/limits"

export const runtime = "nodejs"
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return new NextResponse("UNAUTHORIZED", { status: 401 })
  // Vercel's filesystem is read-only: disk uploads only work locally.
  if (process.env.VERCEL) {
    return new NextResponse(
      "File storage is not configured: connect a Vercel Blob store (BLOB_READ_WRITE_TOKEN) and redeploy.",
      { status: 503 }
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return new NextResponse("Invalid multipart body", { status: 400 })
  }
  const file = form.get("file")
  if (!(file instanceof File)) return new NextResponse("Missing file", { status: 400 })
  if (file.size > MAX_UPLOAD_MB * 1024 * 1024) return new NextResponse("File too large", { status: 413 })

  const buf = Buffer.from(await file.arrayBuffer())
  if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") {
    return new NextResponse("Only PDF files are allowed", { status: 415 })
  }

  const key = await savePdf(user.id, buf)

  const created = await db.file.create({
    data: {
      key,
      name: path.basename(file.name || "document.pdf"),
      url: "",
      userId: user.id,
      uploadStatus: "PROCESSING",
    },
  })
  await db.file.update({ where: { id: created.id }, data: { url: `/api/files/${created.id}` } })

  await processPdf(created.id, buf)

  return NextResponse.json({ id: created.id })
}
