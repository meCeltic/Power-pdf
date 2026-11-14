import { randomUUID } from "crypto"
import { mkdir, readFile, unlink, writeFile } from "fs/promises"
import path from "path"
import { del, get, head, put } from "@vercel/blob"
import { blobPrefixFor } from "./blobPath"

/**
 * Storage adapter. Vercel Blob when BLOB_READ_WRITE_TOKEN is set, local ./uploads otherwise.
 * File.key is the Blob pathname (`users/<userId>/<uuid>.pdf`) in blob mode and a bare
 * `<uuid>.pdf` on disk, so the backend is inferred from the key prefix.
 * Files are always served via the owner-checked /api/files/[fileId] route, never by blob URL.
 */

// Must match the access mode of the Blob store (created as Private by default).
export type BlobAccess = "private" | "public"
export const blobAccess = (): BlobAccess => (process.env.BLOB_ACCESS === "public" ? "public" : "private")

export const isBlobMode = () => !!process.env.BLOB_READ_WRITE_TOKEN
export const isBlobKey = (key: string) => key.startsWith("users/")

const uploadsDir = () => path.join(process.cwd(), "uploads")

/** Stores a PDF and returns the key to save on the File row. */
export async function savePdf(userId: string, data: Buffer): Promise<string> {
  if (isBlobMode()) {
    const key = `${blobPrefixFor(userId)}${randomUUID()}.pdf`
    await put(key, data, { access: blobAccess(), contentType: "application/pdf", addRandomSuffix: false })
    return key
  }
  const key = `${randomUUID()}.pdf`
  await mkdir(uploadsDir(), { recursive: true })
  await writeFile(path.join(uploadsDir(), key), data)
  return key
}

export async function readPdf(file: { key: string }): Promise<Buffer | null> {
  try {
    if (isBlobKey(file.key)) {
      const res = await get(file.key, { access: blobAccess() })
      if (!res || res.statusCode !== 200) return null
      return Buffer.from(await new Response(res.stream).arrayBuffer())
    }
    return await readFile(path.join(uploadsDir(), path.basename(file.key)))
  } catch {
    return null
  }
}

export async function deletePdf(file: { key: string }): Promise<void> {
  try {
    if (isBlobKey(file.key)) await del(file.key)
    else await unlink(path.join(uploadsDir(), path.basename(file.key)))
  } catch {
    // best effort: the DB row is the source of truth
  }
}

/** Metadata of an uploaded blob, or null if it does not exist. */
export async function headBlob(pathname: string) {
  try {
    return await head(pathname)
  } catch {
    return null
  }
}
