export function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0
  const n = Math.min(a.length, b.length)
  for (let i = 0; i < n; i++) {
    dot += a[i] * b[i]
    na += a[i] * a[i]
    nb += b[i] * b[i]
  }
  return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb))
}

export function topK<T extends { embedding: number[] }>(
  query: number[],
  items: T[],
  k = 4
): T[] {
  return items
    .map((item) => ({ item, score: cosine(query, item.embedding) }))
    .sort((x, y) => y.score - x.score)
    .slice(0, k)
    .map((x) => x.item)
}
