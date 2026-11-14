/** Pure helpers for validating Blob pathnames (no I/O, unit-checkable). */

export const blobPrefixFor = (userId: string) => `users/${userId}/`

/** Accepts a pathname or a blob URL and returns the store pathname, or null. */
export function toPathname(input: string): string | null {
  if (typeof input !== "string" || !input) return null
  let p = input
  if (/^https?:\/\//i.test(input)) {
    try {
      p = decodeURIComponent(new URL(input).pathname)
    } catch {
      return null
    }
  }
  p = p.replace(/^\/+/, "")
  return p || null
}

/** True only if the pathname is a normal key strictly under users/<userId>/ . */
export function isOwnedBlobPath(pathname: string, userId: string): boolean {
  if (!userId || /[\/\\]/.test(userId)) return false
  if (!pathname.startsWith(blobPrefixFor(userId))) return false
  const rest = pathname.slice(blobPrefixFor(userId).length)
  if (!rest || rest.includes("..") || rest.includes("\\") || rest.includes("//")) return false
  return true
}
