import { z } from "zod";

const envSchema = z.object({
  LLM_PROVIDER: z.enum(["gemini", "openai"]).default("gemini"),
  GEMINI_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  TAVILY_API_KEY: z.string().min(1, "TAVILY_API_KEY is required for web research"),
  NEWS_API_KEY: z.string().optional().default(""),
}).refine(
  (data) => {
    if (data.LLM_PROVIDER === "gemini" && !data.GEMINI_API_KEY) {
      return false;
    }
    return true;
  },
  {
    message: "GEMINI_API_KEY is required when LLM_PROVIDER is 'gemini'",
    path: ["GEMINI_API_KEY"],
  }
).refine(
  (data) => {
    if (data.LLM_PROVIDER === "openai" && !data.OPENAI_API_KEY) {
      return false;
    }
    return true;
  },
  {
    message: "OPENAI_API_KEY is required when LLM_PROVIDER is 'openai'",
    path: ["OPENAI_API_KEY"],
  }
);

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  // Read variables
  const payload = {
    LLM_PROVIDER: process.env.LLM_PROVIDER || "gemini",
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    TAVILY_API_KEY: process.env.TAVILY_API_KEY,
    NEWS_API_KEY: process.env.NEWS_API_KEY,
  };

  const parsed = envSchema.safeParse(payload);

  if (!parsed.success) {
    console.error("❌ Invalid environment variables:", parsed.error.flatten().fieldErrors);
    throw new Error("Invalid environment variables. Please check your .env file.");
  }

  return parsed.data;
}
