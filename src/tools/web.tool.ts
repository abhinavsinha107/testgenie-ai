import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { ExaSearchResults } from "@langchain/exa";
import Exa from "exa-js";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";

const client = new Exa(process.env.EXA_SEARCH_API_KEY);

export const searchTool = tool(
    async ({ query }) => {
        try {
            const exaTool = new ExaSearchResults({
                client,
                searchArgs: {
                    numResults: 1,
                    type: "auto"
                }
            });

            const results = await exaTool.invoke(query);
            return results;
        } catch (error) {
            return JSON.stringify({
                error: "Failed to make web research, error"
            })
        }
    },
    {
        name: "web_search",
        description: "Search the web to find real-time information",
        schema: z.object({ query: z.string() })
    }
);

export const webScrapperTool = tool(
    async ({ webLink }) => {
        try {
            const loader = new CheerioWebBaseLoader(webLink);
            const docs = await loader.load();
            const serializedData = JSON.stringify(docs);
            return serializedData;
        } catch (error) {
            return JSON.stringify({
                error: "Failed to make web research, error"
            })
        }
    },
    {
        name: "scrape_url",
        description: "Scrape the page to retrieve data",
        schema: z.object({ webLink: z.string() })
    }
);

export const searchTools = [
    searchTool,
    webScrapperTool
];