/* eslint-disable @typescript-eslint/no-explicit-any */
import { validateEnv } from "../lib/env";


export interface SearchResult {
  title: string;
  url: string;
  content: string;
  publishedDate?: string;
  score?: number;
}

/**
 * Perform a general web search using Tavily API.
 */
export async function searchWeb(query: string, maxResults = 5): Promise<SearchResult[]> {
  let env;
  try {
    env = validateEnv();
  } catch (error) {
    // If environment variables are missing during compile/build time, fail gracefully in API usage
    console.error("Environment variables validation failed:", error);
    throw new Error("Missing Tavily API key configuration.");
  }

  const apiKey = env.TAVILY_API_KEY;

  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: apiKey,
        query: query,
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: false,
        include_raw_content: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((r: any) => ({
      title: r.title || "No Title",
      url: r.url || "",
      content: r.content || "",
      score: r.score,
    }));
  } catch (error: any) {
    console.error("Error during Tavily web search:", error);
    throw new Error(`Web search failed: ${error.message || error}`);
  }
}

/**
 * Fetch recent news about a company or stock ticker.
 * Prioritizes NewsAPI if a NEWS_API_KEY is provided, falling back to Tavily News Search.
 */
export async function searchNews(query: string, maxResults = 5): Promise<SearchResult[]> {
  let env;
  try {
    env = validateEnv();
  } catch (error) {
    console.error("Environment variables validation failed:", error);
    throw new Error("Missing API key configuration.");
  }

  const newsApiKey = env.NEWS_API_KEY;
  const tavilyApiKey = env.TAVILY_API_KEY;

  // 1. Try NewsAPI if key is available
  if (newsApiKey && newsApiKey !== "your_news_api_key_here") {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(
        query
      )}&sortBy=publishedAt&language=en&pageSize=${maxResults}&apiKey=${newsApiKey}`;
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.status === "ok" && Array.isArray(data.articles)) {
          return data.articles.map((art: any) => ({
            title: art.title || "No Title",
            url: art.url || "",
            content: art.description || art.content || "",
            publishedDate: art.publishedAt,
          }));
        }
      }
      console.warn("NewsAPI query failed or returned bad status. Falling back to Tavily...");
    } catch (error) {
      console.warn("NewsAPI failed with error, falling back to Tavily:", error);
    }
  }

  // 2. Fallback to Tavily News Search
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        api_key: tavilyApiKey,
        query: query,
        topic: "news", // Uses Tavily's dedicated news search API
        search_depth: "advanced",
        max_results: maxResults,
        include_answer: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Tavily News API responded with status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const results = data.results || [];

    return results.map((r: any) => ({
      title: r.title || "No Title",
      url: r.url || "",
      content: r.content || "",
      publishedDate: r.published_date || undefined,
      score: r.score,
    }));
  } catch (error: any) {
    console.error("Error during Tavily news search:", error);
    throw new Error(`News search failed: ${error.message || error}`);
  }
}
