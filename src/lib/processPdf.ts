import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter"
import { db } from "@/db"
import { PAGES_PER_PDF } from "@/config/limits"
import { embedTexts } from "./gemini"

/** Parses, chunks, embeds and stores a PDF. Sets SUCCESS or FAILED on the File row. */
export async function processPdf(fileId: string, data: Buffer) {
  try {
    const loader = new PDFLoader(new Blob([data]))
    const pages = await loader.load()

    if (pages.length > PAGES_PER_PDF) {
      await db.file.update({ where: { id: fileId }, data: { uploadStatus: "FAILED" } })
      return
    }

    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 })
    const docs = (await splitter.splitDocuments(pages)).filter((d) => d.pageContent.trim())
    if (docs.length === 0) throw new Error("No extractable text")

    const vectors = await embedTexts(docs.map((d) => d.pageContent), "RETRIEVAL_DOCUMENT")

    await db.chunk.deleteMany({ where: { fileId } })
    await db.chunk.createMany({
      data: docs.map((d, i) => ({
        fileId,
        content: d.pageContent,
        embedding: JSON.stringify(vectors[i]),
        page: d.metadata?.loc?.pageNumber ?? null,
      })),
    })
    await db.file.update({ where: { id: fileId }, data: { uploadStatus: "SUCCESS" } })
  } catch (err) {
    console.error("PDF processing failed:", err instanceof Error ? err.message : err)
    await db.file.update({ where: { id: fileId }, data: { uploadStatus: "FAILED" } }).catch(() => {})
  }
}
