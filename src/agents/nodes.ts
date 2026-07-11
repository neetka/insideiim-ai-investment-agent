/* eslint-disable @typescript-eslint/no-explicit-any */
import { z } from "zod";
import { getFinancialData } from "../tools/yahooFinance";
import { searchWeb, searchNews } from "../tools/webSearch";
import { getChatModel } from "../lib/llm";
import { ResearchState } from "./state";

// Zod Schema for Structured LLM Investment Recommendation
const recommendationSchema = z.object({
  ticker: z.string().describe("Stock ticker symbol of the company"),
  companyName: z.string().describe("Full name of the company"),
  action: z.enum(["BUY", "HOLD", "SELL"]).describe("Investment recommendation action"),
  currentPrice: z.number().describe("Current stock price"),
  targetPrice: z.string().optional().describe("Expected target price in 12 months, if applicable"),
  confidence: z.number().min(0).max(100).describe("Confidence score of the recommendation from 0 to 100"),
  thesis: z.string().describe("Comprehensive, institutional-grade investment thesis justifying the action"),
  pros: z.array(z.string()).describe("List of key strengths or upside drivers (minimum 3)"),
  cons: z.array(z.string()).describe("List of key weaknesses or headwinds (minimum 3)"),
  risks: z.array(z.string()).describe("Key risks that could invalidate the thesis"),
  catalysts: z.array(z.string()).describe("Key positive triggers or milestones to watch out for"),
  financialAssessment: z.string().describe("Summary assessment of the financial statements and quantitative health"),
});

/**
 * Analyst Node: Fetches and analyzes quantitative financial data from Yahoo Finance.
 */
export async function analystNode(state: ResearchState) {
  const ticker = state.ticker;
  const logs: string[] = [];
  
  logs.push(`[Analyst] Initiating financial analysis for ticker ${ticker}...`);
  
  try {
    const financials = await getFinancialData(ticker);
    logs.push(`[Analyst] Successfully retrieved financial metrics and history from Yahoo Finance.`);
    
    // Analyze financials using LLM to generate a structured interpretation
    const model = getChatModel(0.1);
    const prompt = `
You are a Senior Wall Street Equity Research Analyst.
Analyze the following financial metrics for ${ticker} (${financials.name}):

Price Information:
- Current Price: $${financials.price}
- Previous Close: $${financials.previousClose}
- Day's Range: $${financials.dayLow} - $${financials.dayHigh}

Key Valuation & Ratios:
- Market Capitalization: ${financials.marketCap ? `$${(financials.marketCap / 1e9).toFixed(2)}B` : "N/A"}
- P/E Ratio: ${financials.peRatio || "N/A"}
- EPS (Trailing): ${financials.eps || "N/A"}
- Dividend Yield: ${financials.dividendYield ? `${(financials.dividendYield * 100).toFixed(2)}%` : "N/A"}
- Beta (Volatility): ${financials.beta || "N/A"}

Financial Performance:
- Total Revenue: ${financials.financials?.totalRevenue ? `$${(financials.financials.totalRevenue / 1e9).toFixed(2)}B` : "N/A"}
- Net Income: ${financials.financials?.netIncome ? `$${(financials.financials.netIncome / 1e9).toFixed(2)}B` : "N/A"}
- Free Cash Flow: ${financials.financials?.freeCashflow ? `$${(financials.financials.freeCashflow / 1e9).toFixed(2)}B` : "N/A"}
- Operating Cash Flow: ${financials.financials?.operatingCashflow ? `$${(financials.financials.operatingCashflow / 1e9).toFixed(2)}B` : "N/A"}
- Debt to Equity Ratio: ${financials.financials?.debtToEquity || "N/A"}
- Return on Equity (ROE): ${financials.financials?.returnOnEquity ? `${(financials.financials.returnOnEquity * 100).toFixed(2)}%` : "N/A"}
- Current / Quick Ratio: ${financials.financials?.currentRatio || "N/A"} / ${financials.financials?.quickRatio || "N/A"}

Please write a concise quantitative assessment (150-250 words) evaluating the company's valuation, profitability, balance sheet health, and cash flow generation. Focus on whether the valuation is reasonable relative to growth and if the financial foundation is solid.
`;

    const response = await model.invoke(prompt);
    const assessment = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    
    logs.push(`[Analyst] Quantitative assessment completed.`);
    logs.push(`[Analyst] Quantitative Assessment Result:\n${assessment}`);

    return {
      financials,
      logs,
    };
  } catch (error: any) {
    console.error(`[Analyst] Detailed error for ${ticker}:`, error);
    logs.push(`[Analyst] Error during financial analysis: ${error.message || error}`);
    return {
      logs,
    };
  }
}

/**
 * Researcher Node: Performs qualitative web and recent news searches using Tavily/NewsAPI.
 */
export async function researcherNode(state: ResearchState) {
  const ticker = state.ticker;
  const logs: string[] = [];
  
  logs.push(`[Researcher] Initiating qualitative search on recent developments for ${ticker}...`);

  try {
    // 1. Fetch general web research (competitors, products, macro context)
    logs.push(`[Researcher] Querying Tavily for company background, key competitors, and industry trends...`);
    const webResults = await searchWeb(`${ticker} stock analysis company competitors industry outlook 2026`, 5);
    
    // 2. Fetch recent news
    logs.push(`[Researcher] Querying for recent news developments and sentiment updates...`);
    const newsResults = await searchNews(`${ticker} company stock news earnings merger product announcement`, 5);

    const model = getChatModel(0.2);

    // 3. Summarize Web Results
    const webContext = webResults.map((r) => `Title: ${r.title}\nURL: ${r.url}\nContent: ${r.content}\n---`).join("\n");
    const webPrompt = `
You are a Senior Investment Researcher. Summarize the key qualitative findings, industry trends, competitive positioning, and macro headwinds/tailwinds for the company with ticker ${ticker} based on these web search results:

${webContext}

Provide a concise, factual summary (200-300 words). Highlighting key product developments, competition, and market share.
`;
    logs.push(`[Researcher] Synthesizing web research...`);
    const webSummaryRes = await model.invoke(webPrompt);
    const webResearch = typeof webSummaryRes.content === "string" ? webSummaryRes.content : JSON.stringify(webSummaryRes.content);

    // 4. Summarize News Results
    const newsContext = newsResults.map((r) => `Title: ${r.title}\nURL: ${r.url}\nDate: ${r.publishedDate || "N/A"}\nContent: ${r.content}\n---`).join("\n");
    const newsPrompt = `
You are a Senior News Analyst. Synthesize the recent news and sentiment regarding ticker ${ticker} from the following articles:

${newsContext}

Summarize the key recent news events (e.g., earnings releases, regulatory actions, management changes) and identify the overall sentiment (positive, neutral, negative) (150-250 words).
`;
    logs.push(`[Researcher] Synthesizing recent news and sentiment...`);
    const newsSummaryRes = await model.invoke(newsPrompt);
    const newsResearch = typeof newsSummaryRes.content === "string" ? newsSummaryRes.content : JSON.stringify(newsSummaryRes.content);

    logs.push(`[Researcher] Qualitative research and news synthesis complete.`);

    return {
      webResearch,
      newsResearch,
      logs,
    };
  } catch (error: any) {
    console.error(`[Researcher] Detailed error for ${ticker}:`, error);
    logs.push(`[Researcher] Error during qualitative research: ${error.message || error}`);
    return {
      logs,
    };
  }
}

/**
 * Decider Node: Synthesizes quantitative and qualitative data to generate a structured investment thesis and recommendation.
 */
export async function deciderNode(state: ResearchState) {
  const { ticker, horizon, riskProfile, financials, webResearch, newsResearch } = state;
  const logs: string[] = [];

  logs.push(`[Decider] Synthesizing all research inputs to generate final investment recommendation...`);

  if (!financials) {
    logs.push(`[Decider] Warning: Quantitative financials are missing. Attempting recommendation with available data only.`);
    console.error(`[Decider] financials is missing for ${ticker}. webResearch length: ${webResearch?.length || 0}, newsResearch length: ${newsResearch?.length || 0}`);
  }

  try {
    const model = getChatModel(0.1);
    
    // Bind structured output schema
    const structuredModel = model.withStructuredOutput(recommendationSchema, {
      name: "investment_recommendation",
    });

    const prompt = `
You are the Investment Committee Chair at a premier global hedge fund.
You must synthesize all provided research inputs and formulate a final, definitive investment recommendation (BUY, HOLD, or SELL) for ${ticker}${financials?.name ? ` (${financials.name})` : ""}.

User Profile and Context:
- Investment Horizon: ${horizon.toUpperCase()} term (Short-term: <1yr, Medium-term: 1-3yrs, Long-term: >3yrs)
- Risk Tolerance Profile: ${riskProfile.toUpperCase()} (Low: capital preservation, Medium: balanced growth, High: aggressive growth/high volatility tolerated)

Quantitative Financial Data & Analyst Assessment:
${financials ? `Current Price: $${financials.price}
Market Cap: ${financials.marketCap ? `$${(financials.marketCap / 1e9).toFixed(2)}B` : "N/A"}
PE Ratio: ${financials.peRatio || "N/A"}
EPS: ${financials.eps || "N/A"}

Qualitative Financial Analysis:
${financials.financials ? JSON.stringify(financials.financials) : "N/A"}` : "Financial data was unavailable. Base your analysis on the qualitative research below."}

Web Research Summary (Competition & Market Dynamics):
${webResearch || "No web research available."}

Recent News & Sentiment Summary:
${newsResearch || "No recent news available."}

Requirements:
1. Provide a clear, definitive BUY, HOLD, or SELL rating.
2. Consider the user's investment horizon and risk profile in your decision. For instance, a highly volatile high-growth stock may be a BUY for a High risk tolerance and Long horizon, but a HOLD or SELL for a Low risk tolerance and Short horizon.
3. Formulate an institutional-grade investment thesis that connects the financial metrics, competition, and recent news.
4. Set a realistic target price if appropriate (or state "N/A" if not applicable).${!financials ? ` Since financial data is unavailable, use currentPrice: 0 in your response.` : ""}
5. Specify key pros (upside triggers), cons (headwinds), risks (events that could break the thesis), and catalysts (upcoming events like earnings, product launches, FDA approvals, etc.).
`;

    logs.push(`[Decider] Requesting structured recommendation from LLM...`);
    const recommendation = await structuredModel.invoke(prompt) as any;

    logs.push(`[Decider] Recommendation generated successfully with ${recommendation.action} rating (Confidence: ${recommendation.confidence}%).`);

    return {
      recommendation,
      logs,
    };
  } catch (error: any) {
    logs.push(`[Decider] Error during recommendation synthesis: ${error.message || error}`);
    return {
      logs,
    };
  }
}
