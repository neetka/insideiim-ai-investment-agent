import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { ChatOpenAI } from "@langchain/openai";
import { validateEnv } from "./env";

/**
 * Returns the configured ChatModel (Gemini or OpenAI) based on the environment variables.
 */
export function getChatModel(temperature = 0.2) {
  const env = validateEnv();

  if (env.LLM_PROVIDER === "openai") {
    if (!env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not defined.");
    }
    return new ChatOpenAI({
      openAIApiKey: env.OPENAI_API_KEY,
      model: "gpt-4o-mini", // Cost-effective and highly capable
      temperature,
    });
  }

  // Default to Gemini
  if (!env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not defined.");
  }
  return new ChatGoogleGenerativeAI({
    apiKey: env.GEMINI_API_KEY,
    model: "gemini-2.5-flash", // Fast, accurate and modern model in 2026
    temperature,
  });
}
