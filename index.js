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

    const messages = [{
        role: "system",
        content: `You are a smart assistant.
        You can use webSearch tool.`
      },
      {
        role: "user",
        content: "What is current weather in New Delhi?",
    },];

    while (true) {
      const completions = await groq.chat.completions.create({
    temperature: 0,
    model: "llama-3.1-8b-instant",
    messages: messages,
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

  messages.push(completions.choices[0].message);


  const tool_calls = completions.choices[0].message.tool_calls;

  if (!tool_calls) {
    console.log("Assistant:", completions.choices[0].message.content);
    break;
  }

  for (const tool of tool_calls) {
    // console.log("tool:", tool);
    const functionName = tool.function.name;
    const functionParams = tool.function.arguments;

    if (functionName === "webSearch") {
      const toolResult = await webSearch(JSON.parse(functionParams));
      // console.log("toolResult:", toolResult);
      messages.push({
        tool_call_id: tool.id,
        role: "tool",
        name: functionName,
        content: toolResult,
      });
    }
  }

}
    }


async function webSearch({ query }) {
  console.log("Calling web search...");

  const response = await tvly.search(query);
  // console.log("Web search response:", response);

  const finalResult = response.results.map((result) => result.content).join("\n\n");
  console.log("Final result:", finalResult);

  return finalResult;
}

run();