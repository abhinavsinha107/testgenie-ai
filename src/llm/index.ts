import { ChatOpenAI } from "@langchain/openai";

type LLMType = "openai" | "openai_mini" | "openai_reasoning";

export class LLM {
    private static instances: Partial<Record<LLMType, ChatOpenAI>> = {};

    // Private constructor
    private constructor() { }

    /**
     * Get singleton instance of a model
     * @param type "openai" | "openai_mini" | "openai_reasoning"
     */
    public static getInstance(type: LLMType = "openai"): ChatOpenAI {
        if (!LLM.instances[type]) {
            if (!process.env.OPENAI_API_KEY) {
                throw new Error("OPENAI_API_KEY is not set");
            }

            switch (type) {
                case "openai":
                    LLM.instances[type] = new ChatOpenAI({
                        model: "gpt-4",
                        temperature: 0.7,
                        apiKey: process.env.OPENAI_API_KEY
                    });
                    break;
                case "openai_mini":
                    LLM.instances[type] = new ChatOpenAI({
                        model: "gpt-4o-mini",
                        temperature: 0.7,
                        apiKey: process.env.OPENAI_API_KEY
                    });
                    break;
                case "openai_reasoning":
                    LLM.instances[type] = new ChatOpenAI({
                        model: "o1",
                        temperature: 0.7,
                        apiKey: process.env.OPENAI_API_KEY
                    });
                    break;
                default:
                    throw new Error(`Unsupported LLM Type: ${type}`);
            }
        }
        return LLM.instances[type]!;
    }
}

export const openaiModel = LLM.getInstance("openai");