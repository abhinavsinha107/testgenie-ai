import { createAgent, HumanMessage } from "langchain";
import { BASE_SYSTEM_PROMPT } from "./prompts";
import { LLM } from "@/llm";
import { searchTools } from "@/tools/web.tool";
import { toolMonitoringMiddleware } from "@/app/middleware/tool.monitor";

export const BrowserAgent = async () => {
    const llm = LLM.getInstance("openai_mini");
    const agent = createAgent({
        model: llm,
        tools: [...searchTools],
        systemPrompt: BASE_SYSTEM_PROMPT,
        middleware: [toolMonitoringMiddleware]
    });

    const invokeBrowserAgent = async (userInput: string) => {
        const agentOutput = await agent.invoke(
            {
                messages: [
                    new HumanMessage(userInput)
                ]
            }
        );
        const aiResponse = agentOutput.messages[agentOutput.messages.length - 1].content as string;
        return aiResponse;
    }

    const streamBrowserAgent = async (userInput: string, config: any) => {
        let fullContent = "";
        for await (const chunk of await agent.stream(
            { messages: [{ role: "user", content: userInput }] },
            {
                streamMode: "updates",
                configurable: {}
            }
        )) {
            const updates = chunk?.tools?.messages;
            const req = chunk?.model_request?.messages;
            if (updates && updates.length > 0) {
                // tool result
            }
            if (req && req.length > 0) {
                const aiMsg = req[0];
                const content = aiMsg?.content ?? "";
                const hasToolCalls = (aiMsg as any)?.tool_calls && (aiMsg as any).tool_calls.length > 0;
                if (hasToolCalls) {
                    // ai thinking
                    config.writer({
                        manager_name: "BrowserAgent",
                        content: '<think>' + content + '</think>'
                    });
                } else {
                    fullContent += content;
                    config.writer({
                        manager_name: "BrowserAgent",
                        content: content
                    });
                }
            }
        }
        return { fullContent }
    }

    return {
        invokeBrowserAgent,
        streamBrowserAgent
    }
}