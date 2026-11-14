import path from "path"
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { getUser } from "@/lib/auth"
import { isOwnedBlobPath, toPathname } from "@/lib/blobPath"
import { processPdf } from "@/lib/processPdf"
import { deletePdf, headBlob, isBlobMode, readPdf } from "@/lib/storage"
import { MAX_UPLOAD_MB } from "@/config/limits"

export const runtime = "nodejs"
export const maxDuration = 60

/** Blob mode: called by the browser after a direct-to-Blob upload. Verifies, indexes, creates the File row. */
export async function POST(req: NextRequest) {
  const user = await getUser()
  if (!user) return new NextResponse("UNAUTHORIZED", { status: 401 })
  if (!isBlobMode()) return new NextResponse("Blob storage is not configured", { status: 400 })

  let payload: { pathname?: string; url?: string; name?: string }
  try {
    payload = await req.json()
  } catch {
    return new NextResponse("Invalid JSON", { status: 400 })
  }
  const pathname = toPathname(payload.pathname || payload.url || "")
  if (!pathname || !isOwnedBlobPath(pathname, user.id)) return new NextResponse("FORBIDDEN", { status: 403 })

  const meta = await headBlob(pathname)
  if (!meta) return new NextResponse("Blob not found", { status: 404 })

  const reject = async (msg: string, status: number) => {
    await deletePdf({ key: pathname })
    return new NextResponse(msg, { status })
  }
  if (meta.size > MAX_UPLOAD_MB * 1024 * 1024) return reject("File too large", 413)

  const buf = await readPdf({ key: pathname })
  if (!buf) return new NextResponse("Could not read blob", { status: 502 })
  if (buf.length > MAX_UPLOAD_MB * 1024 * 1024) return reject("File too large", 413)
  if (buf.subarray(0, 5).toString("latin1") !== "%PDF-") return reject("Only PDF files are allowed", 415)

  const existing = await db.file.findFirst({ where: { key: pathname, userId: user.id } })
  if (existing) return NextResponse.json({ id: existing.id })

  const created = await db.file.create({
    data: {
      key: pathname,
      name: path.basename(payload.name || "document.pdf"),
      url: "",
      userId: user.id,
      uploadStatus: "PROCESSING",
    },
  })
  await db.file.update({ where: { id: created.id }, data: { url: `/api/files/${created.id}` } })

  await processPdf(created.id, buf)

  return NextResponse.json({ id: created.id })
}
