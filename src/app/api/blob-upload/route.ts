import { NextResponse } from "next/server"
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { getUser } from "@/lib/auth"
import { blobPrefixFor, isOwnedBlobPath } from "@/lib/blobPath"
import { MAX_UPLOAD_MB } from "@/config/limits"

export const runtime = "nodejs"

/** Issues short-lived client tokens so the browser can upload straight to Vercel Blob. */
export async function POST(request: Request) {
  const user = await getUser()
  if (!user) return new NextResponse("UNAUTHORIZED", { status: 401 })
  if (!process.env.BLOB_READ_WRITE_TOKEN) return new NextResponse("Blob storage is not configured", { status: 400 })

  const body = (await request.json()) as HandleUploadBody
  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!isOwnedBlobPath(pathname, user.id) || !pathname.toLowerCase().endsWith(".pdf")) {
          throw new Error(`Pathname must start with ${blobPrefixFor(user.id)} and end with .pdf`)
        }
        return {
          allowedContentTypes: ["application/pdf"],
          maximumSizeInBytes: MAX_UPLOAD_MB * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: false,
        }
      },
      // Not relied upon (never fires on localhost). The client calls /api/files/register instead.
      onUploadCompleted: async () => {},
    })
    return NextResponse.json(json)
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Upload error" }, { status: 400 })
  }
}
