import dotenv from "dotenv";
import {tavily} from "@tavily/core";

dotenv.config();

import OpenAI from "openai";

const tvly = tavily({ apiKey: process.env.TAVILY_API_KEY });

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

async function run() {

  const response = await groq.chat.completions.create({
    temperature: 0,
    model: "llama-3.1-8b-instant",
    messages: [
      {
        role: "system",
        content: `You are a smart assistant.
        You can use webSearch tool.`
      },
      {
        role: "user",
        content: "When iphone 16 launched ?",
      },
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "webSearch",
          description: "Search the web",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string" }
            },
            required: ["query"]
          }
        }
      }
    ],
    tool_choice: "auto"
  });


  const tool_calls = response.choices[0].message.tool_calls;

  if (!tool_calls) {
    console.log("Assistant:", response.choices[0].message.content);
    return;
  }

  for (const tool of tool_calls) {
    console.log("tool:", tool);
    const functionName = tool.function.name;
    const functionParams = tool.function.arguments;

    if (functionName === "webSearch") {
      const toolResult = webSearch(JSON.parse(functionParams));
      console.log("toolResult:", toolResult);
    }
  }

}

async function webSearch({ query }) {
  console.log("Calling web search...");
  const response = await tvly.search(query);
  console.log("Web search response:", response);
  return "Launched in September 2024";
}

run();