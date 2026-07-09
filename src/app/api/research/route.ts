/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { z } from "zod";
import { researchGraph } from "@/agents/graph";
import { validateEnv } from "@/lib/env";

// Configure Vercel function timeout to 60 seconds to allow the LLMs and APIs to complete
export const maxDuration = 60;

const requestSchema = z.object({
  ticker: z
    .string()
    .min(1, "Ticker is required")
    .transform((t) => t.trim().toUpperCase()),
  horizon: z.enum(["short", "medium", "long"]),
  riskProfile: z.enum(["low", "medium", "high"]),
});

export async function POST(req: Request) {
  try {
    // 1. Verify Environment Variables
    try {
      validateEnv();
    } catch (envError: any) {
      return NextResponse.json(
        {
          success: false,
          error: "API Keys Configuration Error: " + envError.message,
          logs: ["[API] Pre-flight check failed: Missing API Keys."],
        },
        { status: 500 }
      );
    }

    // 2. Parse and Validate Request Payload
    const body = await req.json().catch(() => ({}));
    const parseResult = requestSchema.safeParse(body);

    if (!parseResult.success) {
      const fieldErrors = parseResult.error.flatten().fieldErrors;
      const errorMessage = Object.entries(fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(", ")}`)
        .join(" | ");

      return NextResponse.json(
        {
          success: false,
          error: `Validation Error: ${errorMessage}`,
          logs: [`[API] Validation failed for payload: ${JSON.stringify(body)}`],
        },
        { status: 400 }
      );
    }

    const { ticker, horizon, riskProfile } = parseResult.data;

    console.log(`[API] Triggering LangGraph research workflow for ticker: ${ticker}`);

    // 3. Invoke LangGraph workflow
    const output = await researchGraph.invoke({
      ticker,
      horizon,
      riskProfile,
      logs: [`[API] Triggering workflow for ${ticker} (${horizon}-term, ${riskProfile} risk profile)`],
    });

    if (!output.recommendation) {
      return NextResponse.json(
        {
          success: false,
          error: "Failed to generate recommendation. Check execution logs.",
          logs: output.logs || [],
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      recommendation: output.recommendation,
      financials: output.financials || null,
      webResearch: output.webResearch || "",
      newsResearch: output.newsResearch || "",
      logs: output.logs || [],
    });
  } catch (error: any) {
    console.error("[API] LangGraph execution error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred during research analysis.",
        logs: [`[API] Fatal execution error: ${error.message || error}`],
      },
      { status: 500 }
    );
  }
}
