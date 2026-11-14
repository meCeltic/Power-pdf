import { db } from "@/db";
import { embedTexts, streamChat } from "@/lib/gemini";
import { topK } from "@/lib/vector";
import { getUser } from "@/lib/auth";
import { SendMessageValidator } from "@/lib/validators/SendMessageValidator";
import { NextRequest } from "next/server";


export const POST= async (req: NextRequest)=>{
    // endpoint for asking questions to the pdf file

    const body= await req.json()

    const user= await getUser()

    if (!user) return new Response ("UNAUTHORIZED", {status: 401})


    const {id: userId}= user

        const {fileId, message} = SendMessageValidator.parse(body)

        const file = await db.file.findFirst({
            where:{
                id: fileId,
                userId,
            }
        })


        if (!file) return new Response ("NOT_FOUND", {status: 404})

        await db.message.create({
            data:{
                text: message,
                isUserMessage: true,
                userId,
                fileId
            }
        })


        // 1. vectorize the message and find the most similar chunks
        let context = ""
        try {
            const [queryVec] = await embedTexts([message], "RETRIEVAL_QUERY")
            const rows = await db.chunk.findMany({ where: { fileId } })
            const items = rows.map((r) => ({ content: r.content, embedding: JSON.parse(r.embedding) as number[] }))
            context = topK(queryVec, items, 4).map((r) => r.content).join('\n\n')
        } catch (err) {
            console.error("Retrieval failed:", err instanceof Error ? err.message : err)
            return new Response("AI_ERROR", { status: 502 })
        }

        // last 6 messages, oldest first (original code took the FIRST 6 ever)
        const prevMessages= (await db.message.findMany({
            where:{
                fileId
            },
            orderBy:{
                createdAt: "desc"
            },
            take:6
        })).reverse()

        const formattedMsgs= prevMessages.map((msg)=>({
            role: msg.isUserMessage ? "user" as const : "assistant" as const,
            content: msg.text
        }))

        const system = 'Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format.'
        const prompt = `Use the following pieces of context (or previous conversaton if needed) to answer the users question in markdown format. \nIf you don't know the answer, just say that you don't know, don't try to make up an answer.
                  
            \n----------------\n
            
            PREVIOUS CONVERSATION:
            ${formattedMsgs.map((message) => {
              if (message.role === 'user') return `User: ${message.content}\n`
              return `Assistant: ${message.content}\n`
            })}
            
            \n----------------\n
            
            CONTEXT:
            ${context}
            
            USER INPUT: ${message}`

        // stream plain text chunks back to the client in real time
        const encoder = new TextEncoder()
        const gen = streamChat({ system, prompt, temperature: 0 })
        const stream = new ReadableStream<Uint8Array>({
            async start(controller) {
                let full = ""
                try {
                    for await (const text of gen) {
                        full += text
                        controller.enqueue(encoder.encode(text))
                    }
                    await db.message.create({
                        data:{
                            text: full,
                            isUserMessage: false,
                            fileId,
                            userId
                        }
                    })
                    controller.close()
                } catch (err) {
                    console.error("Chat stream failed:", err instanceof Error ? err.message : err)
                    controller.error(err)
                }
            },
            cancel() {
                gen.return(undefined)
            },
        })

        return new Response(stream, {
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
        })
}
