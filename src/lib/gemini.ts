import { GoogleGenAI } from "@google/genai"

let client: GoogleGenAI | null = null

// Lazy: never throws at import/build time when the key is absent.
function getClient() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error("GEMINI_API_KEY is not set")
  if (!client) client = new GoogleGenAI({ apiKey })
  return client
}

export const chatModel = () => process.env.GEMINI_CHAT_MODEL || "gemini-4-hydrogen"
export const embedModel = () => process.env.GEMINI_EMBED_MODEL || "gemini-embedding-001"

export const EMBED_DIMENSIONS = 768 // keeps Neon free-tier storage small
const BATCH_SIZE = 100 // Gemini batchEmbedContents limit

export async function embedTexts(
  texts: string[],
  taskType: "RETRIEVAL_DOCUMENT" | "RETRIEVAL_QUERY" = "RETRIEVAL_DOCUMENT"
): Promise<number[][]> {
  const ai = getClient()
  const out: number[][] = []
  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE)
    const res = await ai.models.embedContent({
      model: embedModel(),
      contents: batch,
      config: { taskType, outputDimensionality: EMBED_DIMENSIONS },
    })
    const embeddings = res.embeddings ?? []
    if (embeddings.length !== batch.length) {
      throw new Error("Embedding count mismatch")
    }
    for (const e of embeddings) out.push(e.values ?? [])
  }
  return out
}

/** Yields text chunks from Gemini. */
export async function* streamChat(opts: {
  system?: string
  prompt: string
  temperature?: number
}): AsyncGenerator<string> {
  const ai = getClient()
  // Google moved new API keys to the Interactions API; generateContent returns
  // 404 for current models on new keys. Text arrives as step.delta events.
  const stream = await ai.interactions.create({
    model: chatModel(),
    input: opts.prompt,
    system_instruction: opts.system,
    generation_config: { temperature: opts.temperature ?? 0 },
    store: false,
    stream: true,
  })
  for await (const ev of stream as AsyncIterable<any>) {
    if (ev.event_type === "step.delta" && ev.delta?.type === "text" && ev.delta.text) {
      yield ev.delta.text as string
    }
    if (ev.event_type === "error") throw new Error(ev.error?.message ?? "Gemini stream error")
  }
}
