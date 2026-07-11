/* eslint-disable @typescript-eslint/no-explicit-any */
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();

export interface FinancialMetrics {
  ticker: string;
  name: string;
  sector?: string;
  industry?: string;
  description?: string;
  price: number;
  change: number;
  changePercent: number;
  previousClose: number;
  open: number;
  dayLow: number;
  dayHigh: number;
  volume: number;
  marketCap?: number;
  peRatio?: number;
  eps?: number;
  dividendYield?: number;
  beta?: number;
  targetMeanPrice?: number;
  recommendationKey?: string;
  analystOpinions?: {
    buy: number;
    hold: number;
    sell: number;
  };
  financials?: {
    totalRevenue?: number;
    grossProfits?: number;
    netIncome?: number;
    operatingCashflow?: number;
    freeCashflow?: number;
    debtToEquity?: number;
    quickRatio?: number;
    currentRatio?: number;
    returnOnEquity?: number;
  };
  historical?: {
    date: string;
    close: number;
  }[];
}

/**
 * Fetch comprehensive financial data and metrics for a given stock ticker.
 */
export async function getFinancialData(ticker: string): Promise<FinancialMetrics> {
  const cleanTicker = ticker.trim().toUpperCase();

  try {
    // 1. Resolve Ticker (handles cases where user inputs company name like "NVIDIA")
    let actualTicker = cleanTicker;
    try {
      const searchResult = await yahooFinance.search(cleanTicker);
      if (searchResult.quotes && searchResult.quotes.length > 0) {
        // Find the first equity quote
        const equity = searchResult.quotes.find(q => q.quoteType === "EQUITY") || searchResult.quotes[0];
        if (equity && equity.symbol) {
          actualTicker = equity.symbol as string;
        }
      }
    } catch (e) {
      console.warn(`Search failed for ${cleanTicker}, falling back to direct quote.`);
    }

    // 2. Fetch Quote Data
    const quote = (await yahooFinance.quote(actualTicker)) as any;
    if (!quote) {
      throw new Error(`Ticker ${actualTicker} not found or no quote data available.`);
    }
    // 2. Fetch Quote Summary Modules
    let summary: any = {};
    try {
      summary = await yahooFinance.quoteSummary(actualTicker, {
        modules: ["assetProfile", "financialData", "defaultKeyStatistics", "recommendationTrend"],
      });
    } catch (err) {
      console.warn(`Could not fetch quote summary modules for ${actualTicker}:`, err);
    }

    // 3. Fetch Historical Data (Last 30 days)
    let historical: { date: string; close: number }[] = [];
    try {
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 45); // fetch 45 days to ensure 30 trading days

      const historyResult = await yahooFinance.historical(actualTicker, {
        period1: thirtyDaysAgo.toISOString().split("T")[0],
        period2: today.toISOString().split("T")[0],
        interval: "1d",
      });

      if (Array.isArray(historyResult)) {
        historical = (historyResult as any[]).map((h) => ({
          date: h.date instanceof Date ? h.date.toISOString().split("T")[0] : String(h.date),
          close: h.close,
        }));
      }
    } catch (err) {
      console.warn(`Could not fetch historical data for ${actualTicker}:`, err);
    }

    // Extract modules safely
    const profile = summary?.assetProfile || {};
    const finData = summary?.financialData || {};
    const keyStats = summary?.defaultKeyStatistics || {};
    const recTrends = summary?.recommendationTrend?.trend?.[0] || {};

    const analystOpinions = {
      buy: (recTrends.strongBuy || 0) + (recTrends.buy || 0),
      hold: recTrends.hold || 0,
      sell: (recTrends.sell || 0) + (recTrends.strongSell || 0),
    };

    return {
      ticker: actualTicker,
      name: quote.longName || quote.shortName || actualTicker,
      sector: profile.sector,
      industry: profile.industry,
      description: profile.longBusinessSummary,
      price: quote.regularMarketPrice || finData.currentPrice || 0,
      change: quote.regularMarketChange || 0,
      changePercent: quote.regularMarketChangePercent || 0,
      previousClose: quote.regularMarketPreviousClose || 0,
      open: quote.regularMarketOpen || 0,
      dayLow: quote.regularMarketDayLow || 0,
      dayHigh: quote.regularMarketDayHigh || 0,
      volume: quote.regularMarketVolume || 0,
      marketCap: quote.marketCap || keyStats.marketCap,
      peRatio: quote.trailingPE || quote.forwardPE || undefined,
      eps: quote.trailingEps || undefined,
      dividendYield: quote.dividendYield || undefined,
      beta: keyStats.beta || undefined,
      targetMeanPrice: finData.targetMeanPrice || undefined,
      recommendationKey: finData.recommendationKey,
      analystOpinions: recTrends.strongBuy ? analystOpinions : undefined,
      financials: {
        totalRevenue: finData.totalRevenue,
        grossProfits: finData.grossProfits,
        netIncome: finData.netIncome,
        operatingCashflow: finData.operatingCashflow,
        freeCashflow: finData.freeCashflow,
        debtToEquity: finData.debtToEquity,
        quickRatio: finData.quickRatio,
        currentRatio: finData.currentRatio,
        returnOnEquity: finData.returnOnEquity,
      },
      historical,
    };
  } catch (error: any) {
    console.error(`Error fetching Yahoo Finance data for ${cleanTicker}:`, error);
    throw new Error(`Failed to fetch data for ${cleanTicker}: ${error.message || error}`);
  }
}
