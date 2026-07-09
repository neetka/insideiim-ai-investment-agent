import { Annotation } from "@langchain/langgraph";
import { FinancialMetrics } from "../tools/yahooFinance";

export interface InvestmentRecommendation {
  ticker: string;
  companyName: string;
  action: "BUY" | "HOLD" | "SELL";
  currentPrice: number;
  targetPrice?: string;
  confidence: number; // 0 to 100
  thesis: string;
  pros: string[];
  cons: string[];
  risks: string[];
  catalysts: string[];
  financialAssessment: string;
}

export const ResearchStateAnnotation = Annotation.Root({
  ticker: Annotation<string>(),
  horizon: Annotation<"short" | "medium" | "long">(),
  riskProfile: Annotation<"low" | "medium" | "high">(),
  financials: Annotation<FinancialMetrics | undefined>(),
  webResearch: Annotation<string>(),
  newsResearch: Annotation<string>(),
  logs: Annotation<string[]>({
    reducer: (x, y) => x.concat(y),
    default: () => [],
  }),
  recommendation: Annotation<InvestmentRecommendation | undefined>(),
});

export type ResearchState = typeof ResearchStateAnnotation.State;
