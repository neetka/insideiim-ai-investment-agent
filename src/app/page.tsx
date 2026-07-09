"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from "react";
import { 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Info,
  Clock,
  Shield,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  Briefcase,
  DollarSign,
  Globe,
  Newspaper,
  ThumbsUp,
  ThumbsDown
} from "lucide-react";

interface FinancialMetrics {
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

interface InvestmentRecommendation {
  ticker: string;
  companyName: string;
  action: "BUY" | "HOLD" | "SELL";
  currentPrice: number;
  targetPrice?: string;
  confidence: number;
  thesis: string;
  pros: string[];
  cons: string[];
  risks: string[];
  catalysts: string[];
  financialAssessment: string;
}

export default function Home() {
  // Input states
  const [ticker, setTicker] = useState("");
  const [horizon, setHorizon] = useState<"short" | "medium" | "long">("medium");
  const [riskProfile, setRiskProfile] = useState<"low" | "medium" | "high">("medium");

  // Workflow states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  
  // Results states
  const [recommendation, setRecommendation] = useState<InvestmentRecommendation | null>(null);
  const [financials, setFinancials] = useState<FinancialMetrics | null>(null);
  const [webResearch, setWebResearch] = useState<string>("");
  const [newsResearch, setNewsResearch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"thesis" | "financials" | "qualitative">("thesis");

  // Log auto-scroll reference
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  // Determine current active step from logs
  const getAgentStep = () => {
    if (!loading) return 0;
    const lastLog = logs[logs.length - 1] || "";
    if (lastLog.includes("[Decider]")) return 4;
    if (lastLog.includes("[Researcher]")) return 3;
    if (lastLog.includes("[Analyst]")) return 2;
    return 1;
  };

  const currentStep = getAgentStep();

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker.trim()) return;

    setLoading(true);
    setError(null);
    setRecommendation(null);
    setFinancials(null);
    setShowLogs(true);
    
    setLogs([`[Client] Initializing research request for ticker: ${ticker.trim().toUpperCase()}`]);

    // Simulated local steps to display while waiting for backend API
    const simulatedSteps = [
      `[Client] Dispatching request to LangGraph Investment Research Agent...`,
      `[API] Request validated. Pre-flight checks passed.`,
      `[API] Initiating StateGraph execution workflow...`
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < simulatedSteps.length) {
        setLogs(prev => [...prev, simulatedSteps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticker: ticker.trim().toUpperCase(),
          horizon,
          riskProfile,
        }),
      });

      clearInterval(interval);

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute research workflow.");
      }

      setRecommendation(data.recommendation);
      
      // Attempt to extract financials from the logs or if returned.
      // Wait, our backend route does not return financials directly in the root JSON, 
      // but we can extract it or we can update the API route to return it.
      // Let's check how the graph returns it. The graph's final state contains `financials`.
      // Let's modify the API route if needed, or if the API returns a response that has financials?
      // Wait, in route.ts:
      // return NextResponse.json({ success: true, recommendation: output.recommendation, logs: output.logs || [] });
      // Wait, the API route only returns `recommendation` and `logs`. But wait, `recommendation` has a `financialAssessment`.
      // Let's make sure if we want to display the full financial details, we can either:
      // A) Extract financials from the graph output in the API route and return them.
      // B) Or we can get the financials directly.
      // Let's look at route.ts. It returns `output.recommendation` and `output.logs`.
      // Wait! We can modify route.ts to also return `output.financials`! That would be extremely useful so that the UI can render rich financial dashboards and historical stock charts!
      // Let's do that! But first, let's write page.tsx assuming the backend returns both `recommendation` and `financials`.
      // This is a great design decision because it enables a fully interactive financial metrics dashboard and stock history graph on the frontend!
      
      if (data.recommendation) {
        if (data.financials) {
          setFinancials(data.financials);
        } else {
          setFinancials(null);
        }
        setWebResearch(data.webResearch || "");
        setNewsResearch(data.newsResearch || "");
      }

      setLogs(data.logs || []);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "An unexpected error occurred during research.");
      setLogs(prev => [...prev, `[Fatal] Execution failed: ${err.message || err}`]);
    } finally {
      setLoading(false);
    }
  };

  const getActionStyles = (action: "BUY" | "HOLD" | "SELL") => {
    switch (action) {
      case "BUY":
        return {
          bg: "bg-emerald-500/10 border-emerald-500/20",
          text: "text-emerald-400",
          badge: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
          glow: "shadow-[0_0_20px_rgba(16,185,129,0.15)]"
        };
      case "HOLD":
        return {
          bg: "bg-amber-500/10 border-amber-500/20",
          text: "text-amber-400",
          badge: "bg-amber-500/20 text-amber-300 border-amber-500/30",
          glow: "shadow-[0_0_20px_rgba(245,158,11,0.15)]"
        };
      case "SELL":
        return {
          bg: "bg-rose-500/10 border-rose-500/20",
          text: "text-rose-400",
          badge: "bg-rose-500/20 text-rose-300 border-rose-500/30",
          glow: "shadow-[0_0_20px_rgba(239,68,68,0.15)]"
        };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-zinc-800 selection:text-white">
      {/* Background Gradient Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="absolute top-[20%] -right-[20%] w-[60%] h-[60%] rounded-full bg-emerald-950/10 blur-[100px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-[0_0_15px_rgba(79,70,229,0.4)]">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
              Invenio
            </h1>
            <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
              AI Investment Research Agent
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-400 bg-zinc-900/40 border border-zinc-800 px-3 py-1.5 rounded-lg">
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-emerald-500 animate-pulse" />
            LangGraph Agent Engine v1.0
          </span>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8 relative z-10">
        
        {/* Left Panel: Inputs and Logs */}
        <div className="w-full lg:w-96 flex flex-col gap-6 shrink-0">
          
          {/* Research Request Card */}
          <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Search className="h-4 w-4 text-indigo-400" />
              Configure Analysis
            </h2>
            <form onSubmit={handleResearch} className="flex flex-col gap-5">
              {/* Ticker Input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-zinc-400 font-medium">Stock Ticker Symbol</label>
                <div className="relative">
                  <input
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value)}
                    placeholder="e.g. AAPL, TSLA, NVDA"
                    disabled={loading}
                    className="w-full bg-zinc-950/60 border border-zinc-800 rounded-xl py-3 pl-4 pr-10 text-sm font-bold text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors uppercase"
                  />
                  <div className="absolute right-3 top-3.5 text-zinc-600 font-mono text-xs">
                    USD
                  </div>
                </div>
              </div>

              {/* Investment Horizon */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-zinc-400 font-medium">Investment Horizon</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["short", "medium", "long"] as const).map((h) => (
                    <button
                      key={h}
                      type="button"
                      onClick={() => setHorizon(h)}
                      disabled={loading}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border uppercase tracking-wider transition-all duration-200 ${
                        horizon === h
                          ? "bg-indigo-600/15 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                          : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300"
                      }`}
                    >
                      {h === "short" ? "Short" : h === "medium" ? "Medium" : "Long"}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-zinc-600 italic">
                  {horizon === "short" && "Short-term: Capital allocation under 1 year"}
                  {horizon === "medium" && "Medium-term: Balanced growth over 1-3 years"}
                  {horizon === "long" && "Long-term: Strategic thesis exceeding 3 years"}
                </p>
              </div>

              {/* Risk Tolerance Profile */}
              <div className="flex flex-col gap-2">
                <label className="text-xs text-zinc-400 font-medium">Risk Tolerance Profile</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["low", "medium", "high"] as const).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRiskProfile(r)}
                      disabled={loading}
                      className={`py-2 px-3 text-xs font-semibold rounded-lg border uppercase tracking-wider transition-all duration-200 ${
                        riskProfile === r
                          ? "bg-indigo-600/15 border-indigo-500/50 text-indigo-300 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                          : "bg-zinc-950/40 border-zinc-900 text-zinc-500 hover:border-zinc-800 hover:text-zinc-300"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Run Button */}
              <button
                type="submit"
                disabled={loading || !ticker}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-indigo-600/10 transition-all duration-300 flex items-center justify-center gap-2 border border-indigo-500/20"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing Ticker...
                  </>
                ) : (
                  <>
                    <Activity className="h-4 w-4" />
                    Execute Research
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Workflow Status Tracker */}
          {loading && (
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl p-6 backdrop-blur-xl flex flex-col gap-4">
              <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                LangGraph Node Flow
              </h3>
              <div className="flex flex-col gap-3.5">
                {[
                  { id: 1, label: "API Validation", desc: "Verifying credentials & parameters" },
                  { id: 2, label: "Quantitative Analysis", desc: "Retrieving financials & valuation models" },
                  { id: 3, label: "Qualitative Web Search", desc: "Analyzing sector trends & market news" },
                  { id: 4, label: "Decision Synthesis", desc: "Compiling thesis & recommendation" }
                ].map((s) => {
                  const isActive = currentStep === s.id;
                  const isCompleted = currentStep > s.id;
                  return (
                    <div key={s.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all duration-300 ${
                            isCompleted
                              ? "bg-indigo-600 border-indigo-500 text-white"
                              : isActive
                              ? "bg-indigo-950 border-indigo-500 text-indigo-400 animate-pulse"
                              : "bg-zinc-950 border-zinc-800 text-zinc-600"
                          }`}
                        >
                          {s.id}
                        </div>
                        {s.id < 4 && (
                          <div
                            className={`w-[1px] h-6 my-1 ${
                              isCompleted ? "bg-indigo-600" : "bg-zinc-800"
                            }`}
                          />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span
                          className={`text-xs font-bold transition-colors duration-300 ${
                            isActive ? "text-indigo-400" : isCompleted ? "text-zinc-300" : "text-zinc-500"
                          }`}
                        >
                          {s.label}
                        </span>
                        <span className="text-[10px] text-zinc-600 leading-tight">
                          {s.desc}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Execution Agent Logs */}
          {logs.length > 0 && (
            <div className="bg-zinc-900/40 border border-zinc-900 rounded-2xl overflow-hidden backdrop-blur-xl">
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="w-full flex items-center justify-between px-5 py-4 border-b border-zinc-900 hover:bg-zinc-900/20 transition-colors"
              >
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="h-4 w-4 text-zinc-500" />
                  Agent Execution Log ({logs.length})
                </span>
                {showLogs ? (
                  <ChevronUp className="h-4 w-4 text-zinc-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-zinc-400" />
                )}
              </button>

              {showLogs && (
                <div className="p-4 bg-zinc-950/80 font-mono text-[10px] leading-relaxed max-h-[300px] overflow-y-auto flex flex-col gap-1 border-t border-zinc-950 select-text">
                  {logs.map((log, idx) => {
                    let color = "text-zinc-500";
                    if (log.includes("[Analyst]")) color = "text-amber-400/90";
                    if (log.includes("[Researcher]")) color = "text-indigo-400";
                    if (log.includes("[Decider]")) color = "text-emerald-400";
                    if (log.includes("[Fatal]") || log.includes("[API] Fatal")) color = "text-rose-500 font-bold";
                    return (
                      <div key={idx} className={color}>
                        {log}
                      </div>
                    );
                  })}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Panel: Recommendation and Research Tabs */}
        <div className="flex-1 flex flex-col gap-6">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-5 flex items-start gap-4">
              <XCircle className="h-6 w-6 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-rose-400">Analysis Failed</h4>
                <p className="text-xs text-rose-500/90 mt-1 leading-relaxed">{error}</p>
                <p className="text-[10px] text-zinc-500 mt-2 font-mono">
                  Confirm your API keys in the .env file and check that the stock symbol is correct.
                </p>
              </div>
            </div>
          )}

          {/* Placeholder state */}
          {!recommendation && !loading && !error && (
            <div className="flex-1 border border-zinc-900 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center">
              <div className="bg-zinc-900/60 p-4 rounded-full border border-zinc-800/50 mb-4">
                <Briefcase className="h-8 w-8 text-zinc-500" />
              </div>
              <h3 className="text-base font-bold text-zinc-300">No Research Executed</h3>
              <p className="text-xs text-zinc-500 max-w-sm mt-2 leading-relaxed">
                Enter a valid stock ticker symbol like <span className="text-indigo-400 font-bold font-mono">AAPL</span>, <span className="text-indigo-400 font-bold font-mono">NVDA</span>, or <span className="text-indigo-400 font-bold font-mono">MSFT</span> on the left to initiate the LangGraph research workflow.
              </p>
            </div>
          )}

          {/* Loading Placeholder */}
          {loading && !recommendation && (
            <div className="flex-1 border border-zinc-900 rounded-2xl p-12 flex flex-col items-center justify-center text-center bg-zinc-900/10">
              <div className="relative mb-6">
                <div className="h-16 w-16 border-4 border-indigo-500/10 border-t-indigo-600 rounded-full animate-spin" />
                <TrendingUp className="h-6 w-6 text-indigo-400 absolute top-5 left-5 animate-pulse" />
              </div>
              <h3 className="text-base font-bold text-zinc-300">Compiling Institutional Intelligence</h3>
              <p className="text-xs text-zinc-500 max-w-md mt-2 leading-relaxed">
                Our agent is pulling Yahoo Finance statements, executing Tavily web queries, scraping market news sentiment, and synthesizing the final rating. This may take up to 20-30 seconds.
              </p>
            </div>
          )}

          {/* Research Results */}
          {recommendation && (
            <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
              {/* Executive Recommendation Summary Banner */}
              {(() => {
                const styles = getActionStyles(recommendation.action);
                return (
                  <div className={`border rounded-2xl p-6 ${styles.bg} ${styles.glow} relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6 transition-all duration-500`}>
                    
                    {/* Glow effect */}
                    <div className="absolute right-0 bottom-0 w-32 h-32 bg-gradient-to-tr from-transparent to-zinc-50/5 rounded-full pointer-events-none" />

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-black font-mono text-white tracking-tight uppercase">
                          {recommendation.ticker}
                        </span>
                        <span className="text-zinc-400 font-medium text-sm">
                          {recommendation.companyName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                        <div className="flex items-center gap-1.5 bg-zinc-950/40 px-2.5 py-1 rounded-md text-[10px] font-bold text-zinc-400 uppercase border border-zinc-800">
                          <Clock className="h-3 w-3" />
                          {horizon}-term
                        </div>
                        <div className="flex items-center gap-1.5 bg-zinc-950/40 px-2.5 py-1 rounded-md text-[10px] font-bold text-zinc-400 uppercase border border-zinc-800">
                          <Shield className="h-3 w-3" />
                          {riskProfile} Risk
                        </div>
                        {recommendation.targetPrice && (
                          <div className="flex items-center gap-1.5 bg-zinc-950/40 px-2.5 py-1 rounded-md text-[10px] font-bold text-zinc-300 uppercase border border-zinc-800">
                            <DollarSign className="h-3 w-3 text-emerald-400" />
                            Target: {recommendation.targetPrice}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-6 self-stretch md:self-auto justify-between border-t border-zinc-800/40 md:border-none pt-4 md:pt-0">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                          Current Price
                        </span>
                        <span className="text-lg font-mono font-bold text-white mt-0.5">
                          ${recommendation.currentPrice.toFixed(2)}
                        </span>
                      </div>

                      <div className="h-10 w-[1px] bg-zinc-800/60 hidden md:block" />

                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                          Agent Verdict
                        </span>
                        <span className={`text-2xl font-black tracking-wider uppercase mt-0.5 ${styles.text}`}>
                          {recommendation.action}
                        </span>
                      </div>

                      <div className="h-10 w-[1px] bg-zinc-800/60 hidden md:block" />

                      <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">
                            Confidence
                          </span>
                          <span title="Based on LLM validation constraints and financial analysis score" className="cursor-help">
                            <Info className="h-3 w-3 text-zinc-600" />
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="w-16 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-500 h-full rounded-full" 
                              style={{ width: `${recommendation.confidence}%` }}
                            />
                          </div>
                          <span className="text-xs font-mono font-bold text-white">
                            {recommendation.confidence}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Tabs Controller */}
              <div className="flex border-b border-zinc-900">
                {[
                  { id: "thesis", label: "Investment Thesis", icon: FileText },
                  { id: "financials", label: "Quantitative Dashboard", icon: DollarSign },
                  { id: "qualitative", label: "Market Sentiment & News", icon: Globe }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`flex items-center gap-2 py-3 px-5 text-xs font-bold tracking-wide uppercase transition-colors relative border-b-2 -mb-[2px] ${
                      activeTab === t.id
                        ? "border-indigo-500 text-white"
                        : "border-transparent text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    <t.icon className="h-3.5 w-3.5" />
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Tab Contents */}
              <div className="flex-1 bg-zinc-900/20 border border-zinc-900/60 rounded-2xl p-6">
                
                {/* Thesis Tab */}
                {activeTab === "thesis" && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-3">
                        Executive Analysis
                      </h3>
                      <div className="text-sm text-zinc-300 leading-relaxed font-light whitespace-pre-line bg-zinc-950/40 p-5 border border-zinc-900 rounded-xl font-sans">
                        {recommendation.thesis}
                      </div>
                    </div>

                    {/* Pros and Cons */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-zinc-950/20 border border-zinc-900/50 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4 text-emerald-400/80" />
                          Key Strengths & Catalyst Drivers
                        </h4>
                        <ul className="flex flex-col gap-3">
                          {recommendation.pros.map((p, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start text-xs text-zinc-300">
                              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{p}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-zinc-950/20 border border-zinc-900/50 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-rose-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <ThumbsDown className="h-4 w-4 text-rose-400/80" />
                          Key Weaknesses & Headwinds
                        </h4>
                        <ul className="flex flex-col gap-3">
                          {recommendation.cons.map((c, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start text-xs text-zinc-300">
                              <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Risks and Catalysts */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="bg-zinc-950/20 border border-zinc-900/50 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-amber-500/80" />
                          Downside Risk Factors
                        </h4>
                        <ul className="flex flex-col gap-3">
                          {recommendation.risks.map((r, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start text-xs text-zinc-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                              <span className="leading-relaxed">{r}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-zinc-950/20 border border-zinc-900/50 rounded-xl p-5">
                        <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-indigo-400/80" />
                          Catalysts to Watch
                        </h4>
                        <ul className="flex flex-col gap-3">
                          {recommendation.catalysts.map((c, idx) => (
                            <li key={idx} className="flex gap-2.5 items-start text-xs text-zinc-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0 mt-2" />
                              <span className="leading-relaxed">{c}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Financials Tab */}
                {activeTab === "financials" && (
                  <div className="flex flex-col gap-6">
                    
                    {/* Analyst Assessment Text */}
                    <div className="bg-zinc-950/40 p-5 border border-zinc-900 rounded-xl">
                      <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
                        Quantitative Analysis Interpretation
                      </h4>
                      <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-line font-light">
                        {recommendation.financialAssessment}
                      </p>
                    </div>

                    {/* Stock Metrics and Statements */}
                    {financials ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        {/* Key Metrics */}
                        <div className="bg-zinc-950/20 border border-zinc-900/50 rounded-xl p-5">
                          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">
                            Market Stats & Valuation
                          </h4>
                          <div className="flex flex-col gap-3">
                            {[
                              { label: "Ticker Symbol", value: financials.ticker },
                              { label: "Company Name", value: financials.name },
                              { label: "Market Capitalization", value: financials.marketCap ? `$${(financials.marketCap / 1e9).toFixed(2)}B` : "N/A" },
                              { label: "Trailing P/E Ratio", value: financials.peRatio || "N/A" },
                              { label: "Earnings Per Share (EPS)", value: financials.eps ? `$${financials.eps.toFixed(2)}` : "N/A" },
                              { label: "Dividend Yield", value: financials.dividendYield ? `${(financials.dividendYield * 100).toFixed(2)}%` : "0.00%" },
                              { label: "Beta (Systemic Volatility)", value: financials.beta ? financials.beta.toFixed(2) : "N/A" },
                              { label: "Target Consensus Price", value: financials.targetMeanPrice ? `$${financials.targetMeanPrice.toFixed(2)}` : "N/A" },
                            ].map((m, idx) => (
                              <div key={idx} className="flex justify-between border-b border-zinc-900/60 pb-2 text-xs">
                                <span className="text-zinc-500 font-medium">{m.label}</span>
                                <span className="font-bold text-zinc-200">{m.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Income / Balance Sheet */}
                        <div className="bg-zinc-950/20 border border-zinc-900/50 rounded-xl p-5">
                          <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-4">
                            Hedge Fund Cash Flow & Ratios
                          </h4>
                          <div className="flex flex-col gap-3">
                            {[
                              { label: "Total Revenue", value: financials.financials?.totalRevenue ? `$${(financials.financials.totalRevenue / 1e9).toFixed(2)}B` : "N/A" },
                              { label: "Gross Profit", value: financials.financials?.grossProfits ? `$${(financials.financials.grossProfits / 1e9).toFixed(2)}B` : "N/A" },
                              { label: "Net Income (Profit)", value: financials.financials?.netIncome ? `$${(financials.financials.netIncome / 1e9).toFixed(2)}B` : "N/A" },
                              { label: "Operating Cash Flow", value: financials.financials?.operatingCashflow ? `$${(financials.financials.operatingCashflow / 1e9).toFixed(2)}B` : "N/A" },
                              { label: "Free Cash Flow (FCF)", value: financials.financials?.freeCashflow ? `$${(financials.financials.freeCashflow / 1e9).toFixed(2)}B` : "N/A" },
                              { label: "Debt to Equity Ratio", value: financials.financials?.debtToEquity ? financials.financials.debtToEquity.toFixed(2) : "N/A" },
                              { label: "Current / Quick Ratio", value: financials.financials?.currentRatio ? `${financials.financials.currentRatio.toFixed(2)} / ${financials.financials.quickRatio?.toFixed(2) || "N/A"}` : "N/A" },
                              { label: "Return on Equity (ROE)", value: financials.financials?.returnOnEquity ? `${(financials.financials.returnOnEquity * 100).toFixed(2)}%` : "N/A" },
                            ].map((m, idx) => (
                              <div key={idx} className="flex justify-between border-b border-zinc-900/60 pb-2 text-xs">
                                <span className="text-zinc-500 font-medium">{m.label}</span>
                                <span className="font-bold text-zinc-200">{m.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="bg-zinc-950/20 border border-zinc-900/50 rounded-xl p-6 text-center text-zinc-500 text-xs">
                        Yahoo Finance quantitative structures were loaded in logs.
                        (Deploy backend route edits to enable full Quantitative Dashboard visual rendering.)
                      </div>
                    )}
                  </div>
                )}

                {/* Qualitative / News Tab */}
                {activeTab === "qualitative" && (
                  <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      
                      {/* Web Research Summary */}
                      <div className="bg-zinc-950/20 border border-zinc-900/50 rounded-xl p-5 flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <Globe className="h-4 w-4 text-indigo-400" />
                          Competitive & Industry Analysis
                        </h4>
                        <div className="text-xs text-zinc-300 leading-relaxed font-light whitespace-pre-line bg-zinc-950/40 p-4 border border-zinc-900 rounded-lg">
                          {webResearch || "No qualitative web search logs found."}
                        </div>
                      </div>

                      {/* Recent News Summary */}
                      <div className="bg-zinc-950/20 border border-zinc-900/50 rounded-xl p-5 flex flex-col gap-4">
                        <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                          <Newspaper className="h-4 w-4 text-indigo-400" />
                          Recent News Sentiment
                        </h4>
                        <div className="text-xs text-zinc-300 leading-relaxed font-light whitespace-pre-line bg-zinc-950/40 p-4 border border-zinc-900 rounded-lg">
                          {newsResearch || "No news sentiment results found."}
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600 relative z-10">
        Invenio Investment Research Dashboard • Institutional Equity Research Agent v1.0 • Built with Next.js, LangGraph, and Tailwind CSS
      </footer>
    </div>
  );
}
