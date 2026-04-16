import { createOpenAI } from "@ai-sdk/openai";

export const aiProvider = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const defaultModel = aiProvider("gpt-4o");
