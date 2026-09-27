import { START, END, StateGraph, Annotation, MessagesAnnotation, Command } from "@langchain/langgraph";
import { AIMessage } from "@langchain/core/messages";
import { BrowserAgent } from "@/browser-agent";

// Define the Graph State
const StateAnnotation = Annotation.Root({
    ...MessagesAnnotation.spec,
    userId: Annotation(),
    nextNode: Annotation(),
});

// Coordinator
const BrowserAgentNode = async (state: any, config: any) => {
    const { userId } = state;
    const last = state.messages
        .filter((m: any) => m._getType() === "human")
        .slice(-1)[0];
    const { streamBrowserAgent } = await BrowserAgent();
    const { fullContent } = await streamBrowserAgent(last?.content, config);
    return new Command({
        update: { messages: [new AIMessage(fullContent)], nextNode: END },
        goto: END
    });
}

const workflow = new StateGraph(StateAnnotation)
    .addNode("BrowserAgent", BrowserAgentNode)
    .addEdge(START, "BrowserAgent")
    .addEdge("BrowserAgent", END)

export const graph = workflow.compile();