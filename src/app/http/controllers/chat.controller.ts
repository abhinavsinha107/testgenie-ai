import type { Request, Response } from "express";
import { graph } from "@/graph/agent-collaboration";

export const postChatStream = async (req: Request, res: Response) => {
    try {
        const { message, userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "Provide userId and threadId" });
        }

        res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();

        const sendSSE = (event: string, data: any) => {
            res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
            (res as any).flush?.();
        };

        // if existing threadId exists, resume the graph as it means that user sent message to existing conversation
        const input: any = { messages: [{ role: "user", content: message }], userId };
        const config = {
            streamMode: "custom" as const,
            subgraphs: true,
            recursionLimit: 400,
            configurable: {}
        }

        const graphStream = await graph.stream(input, config);

        // chat history tool
        let streamingText = "";
        let thinkingBuffer = "";
        let isThinking = false;

        try {
            for await (const [namespace, chunk] of graphStream) {
                if ((chunk as any).manager_name || (chunk as any).content) {
                    const content = (chunk as any)?.content;
                    const parts = content.split(/(<think>|<\/think>)/);
                    parts.forEach((part: string) => {
                        if (part === "<think>") {
                            isThinking = true;
                        } else if (part === "</think>") {
                            isThinking = false;
                        } else if (part.length > 0) {
                            if (isThinking) {
                                thinkingBuffer += part;
                                sendSSE("thinking", { thinking: part });
                            } else {
                                streamingText += part;
                                sendSSE("message", { message: part });
                            }
                        }
                    })
                }
            }
            // write to chat history
            sendSSE("end", { ok: true });
            res.end();
        } catch (error) {
            console.error("Streaming Error: ", (error as Error));
            sendSSE("error", { error: (error as Error).message });
            res.end();
        }
    } catch (err: any) {
        console.error("Route Error: ", err);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, error: err.message });
        } else {
            res.end();
        }
    }
}