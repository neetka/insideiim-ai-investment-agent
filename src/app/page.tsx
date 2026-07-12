"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import {
  Search, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Clock, Shield, Activity, Briefcase, DollarSign, Globe,
  Newspaper, ThumbsUp, ThumbsDown, BarChart3, Target,
  Loader2, ChevronRight, Zap, ArrowUpRight, ArrowDownRight,
  Minus, Terminal,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// ─── Types ──────────────────────────────────────────────────────────────────

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
  analystOpinions?: { buy: number; hold: number; sell: number };
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
  historical?: { date: string; close: number }[];
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

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (n: number | undefined, prefix = "$", decimals = 2) =>
  n != null ? `${prefix}${n.toFixed(decimals)}` : "N/A";

const fmtB = (n: number | undefined) =>
  n != null ? `$${(n / 1e9).toFixed(2)}B` : "N/A";

const fmtPct = (n: number | undefined) =>
  n != null ? `${(n * 100).toFixed(2)}%` : "N/A";

const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.3, ease: "easeOut" as any },
};

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KPICard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.15 }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
          <p className="text-2xl font-bold text-slate-900 mt-1 font-[family-name:var(--font-mono)]">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </CardContent>
      </Card>
    </motion.div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Home() {
  const [ticker, setTicker] = useState("");
  const [horizon, setHorizon] = useState<"short" | "medium" | "long">("medium");
  const [riskProfile, setRiskProfile] = useState<"low" | "medium" | "high">("medium");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);

  const [recommendation, setRecommendation] = useState<InvestmentRecommendation | null>(null);
  const [financials, setFinancials] = useState<FinancialMetrics | null>(null);
  const [webResearch, setWebResearch] = useState<string>("");
  const [newsResearch, setNewsResearch] = useState<string>("");

  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

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
    setWebResearch("");
    setNewsResearch("");
    setShowLogs(true);
    setLogs([`Initializing research for ${ticker.trim().toUpperCase()}...`]);

    const simulatedSteps = [
      "Dispatching request to research agent...",
      "Validating API credentials...",
      "Executing analysis workflow...",
    ];
    let stepIndex = 0;
    const interval = setInterval(() => {
      if (stepIndex < simulatedSteps.length) {
        setLogs((prev) => [...prev, simulatedSteps[stepIndex]]);
        stepIndex++;
      } else {
        clearInterval(interval);
      }
    }, 800);

    try {
      const response = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: ticker.trim().toUpperCase(), horizon, riskProfile }),
      });

      clearInterval(interval);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to execute research workflow.");
      }

      setRecommendation(data.recommendation);
      if (data.financials) setFinancials(data.financials);
      setWebResearch(data.webResearch || "");
      setNewsResearch(data.newsResearch || "");
      setLogs(data.logs || []);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || "An unexpected error occurred.");
      setLogs((prev) => [...prev, `Error: ${err.message || err}`]);
    } finally {
      setLoading(false);
    }
  };

  const actionBadge = (action: "BUY" | "HOLD" | "SELL") => {
    const map = { BUY: "success", HOLD: "warning", SELL: "destructive" } as const;
    return map[action];
  };

  const actionIcon = (action: "BUY" | "HOLD" | "SELL") => {
    if (action === "BUY") return <ArrowUpRight className="h-4 w-4" />;
    if (action === "SELL") return <ArrowDownRight className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const horizonLabels = { short: "Short-term · < 1 year", medium: "Medium-term · 1–3 years", long: "Long-term · 3+ years" };
  const riskLabels = { low: "Conservative", medium: "Balanced", high: "Aggressive" };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-[family-name:var(--font-inter)]">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-600 text-white">
              <TrendingUp className="h-4 w-4" />
            </div>
            <span className="text-base font-semibold text-slate-900 tracking-tight">Invenio</span>
            <Badge variant="secondary" className="text-[10px] font-medium">Research Agent</Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span>System Online</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col lg:flex-row gap-8">
        {/* ─── Left Panel ─────────────────────────────────────────── */}
        <div className="w-full lg:w-[360px] flex flex-col gap-5 shrink-0">
          {/* Config Card */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="h-4 w-4 text-indigo-600" />
                Research Configuration
              </CardTitle>
              <CardDescription>Enter a stock ticker to analyze</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResearch} className="flex flex-col gap-5">
                {/* Ticker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-medium text-slate-600">Ticker Symbol</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={ticker}
                      onChange={(e) => setTicker(e.target.value)}
                      placeholder="AAPL, NVDA, TSLA..."
                      disabled={loading}
                      className="w-full h-10 rounded-lg border border-slate-200 bg-white px-3 pr-12 text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all uppercase disabled:opacity-50"
                    />
                    <span className="absolute right-3 top-2.5 text-[10px] font-medium text-slate-400 uppercase">USD</span>
                  </div>
                </div>

                {/* Horizon */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-600">Investment Horizon</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["short", "medium", "long"] as const).map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setHorizon(h)}
                        disabled={loading}
                        className={`h-9 text-xs font-medium rounded-lg border transition-all ${
                          horizon === h
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                        }`}
                      >
                        {h.charAt(0).toUpperCase() + h.slice(1)}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">{horizonLabels[horizon]}</p>
                </div>

                {/* Risk */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-medium text-slate-600">Risk Profile</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["low", "medium", "high"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRiskProfile(r)}
                        disabled={loading}
                        className={`h-9 text-xs font-medium rounded-lg border transition-all capitalize ${
                          riskProfile === r
                            ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                            : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">{riskLabels[riskProfile]}</p>
                </div>

                <Separator />

                <Button type="submit" disabled={loading || !ticker.trim()} className="w-full">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      Run Analysis
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Progress Stepper */}
          {loading && (
            <motion.div {...fadeUp}>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs text-slate-500 uppercase tracking-wide">Workflow Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {[
                    { id: 1, label: "Validation", icon: Shield },
                    { id: 2, label: "Financials", icon: BarChart3 },
                    { id: 3, label: "Research", icon: Globe },
                    { id: 4, label: "Synthesis", icon: Target },
                  ].map((s) => {
                    const isActive = currentStep === s.id;
                    const isDone = currentStep > s.id;
                    return (
                      <div key={s.id} className="flex items-center gap-3">
                        <div
                          className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                            isDone ? "bg-emerald-100 text-emerald-600"
                            : isActive ? "bg-indigo-100 text-indigo-600 animate-pulse"
                            : "bg-slate-100 text-slate-400"
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : <s.icon className="h-3.5 w-3.5" />}
                        </div>
                        <span className={`text-xs font-medium ${isDone ? "text-slate-900" : isActive ? "text-indigo-600" : "text-slate-400"}`}>
                          {s.label}
                        </span>
                        {isActive && <Loader2 className="h-3 w-3 animate-spin text-indigo-400 ml-auto" />}
                        {isDone && <CheckCircle2 className="h-3 w-3 text-emerald-500 ml-auto" />}
                      </div>
                    );
                  })}
                  <Progress value={currentStep * 25} className="mt-2" />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <Card>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors rounded-t-xl"
              >
                <span className="text-xs font-medium text-slate-600 flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-slate-400" />
                  Execution Log
                  <Badge variant="secondary" className="text-[10px]">{logs.length}</Badge>
                </span>
                <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${showLogs ? "rotate-90" : ""}`} />
              </button>
              {showLogs && (
                <CardContent className="pt-0">
                  <ScrollArea className="h-[200px] rounded-lg border border-slate-100 bg-slate-50 p-3">
                    <div className="flex flex-col gap-1 font-[family-name:var(--font-mono)] text-[11px]">
                      {logs.map((log, idx) => {
                        if (!log || typeof log !== "string") return null;
                        let color = "text-slate-500";
                        if (log.includes("[Analyst]")) color = "text-amber-600";
                        if (log.includes("[Researcher]")) color = "text-indigo-600";
                        if (log.includes("[Decider]")) color = "text-emerald-600";
                        if (log.includes("Error") || log.includes("Fatal")) color = "text-rose-600 font-medium";
                        return <div key={idx} className={color}>{log}</div>;
                      })}
                      <div ref={logEndRef} />
                    </div>
                  </ScrollArea>
                </CardContent>
              )}
            </Card>
          )}
        </div>

        {/* ─── Right Panel ────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div {...fadeUp}>
                <Card className="border-rose-200 bg-rose-50">
                  <CardContent className="p-5 flex items-start gap-3">
                    <XCircle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-rose-700">Analysis Failed</p>
                      <p className="text-xs text-rose-600 mt-1 leading-relaxed">{error}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {!recommendation && !loading && !error && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="mx-auto h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-5">
                  <Briefcase className="h-7 w-7 text-slate-400" />
                </div>
                <h3 className="text-base font-semibold text-slate-900">No analysis yet</h3>
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">
                  Enter a stock ticker like <span className="font-semibold text-indigo-600">AAPL</span>,{" "}
                  <span className="font-semibold text-indigo-600">NVDA</span>, or{" "}
                  <span className="font-semibold text-indigo-600">MSFT</span> to generate an investment recommendation.
                </p>
              </div>
            </div>
          )}

          {/* Loading Skeleton */}
          {loading && !recommendation && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="relative mx-auto mb-6">
                  <div className="h-14 w-14 rounded-full border-[3px] border-slate-200 border-t-indigo-600 animate-spin" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">Running Analysis</h3>
                <p className="text-xs text-slate-500 mt-1.5 max-w-xs leading-relaxed">
                  Fetching financials, analyzing market data, and synthesizing recommendations. This typically takes 15–30 seconds.
                </p>
              </div>
            </div>
          )}

          {/* ─── Results Dashboard ──────────────────────────────────── */}
          {recommendation && (
            <AnimatePresence mode="wait">
              <motion.div key="results" {...fadeUp} className="flex flex-col gap-6">
                {/* Hero Recommendation */}
                <Card className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="flex items-start gap-4">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-3">
                            <span className="text-xl font-bold text-slate-900 font-[family-name:var(--font-mono)] uppercase tracking-tight">
                              {recommendation.ticker}
                            </span>
                            <Badge variant={actionBadge(recommendation.action)} className="text-xs px-3 py-1 flex items-center gap-1">
                              {actionIcon(recommendation.action)}
                              {recommendation.action}
                            </Badge>
                          </div>
                          <span className="text-sm text-slate-500 mt-1">{recommendation.companyName}</span>
                          <div className="flex items-center gap-3 mt-3 flex-wrap">
                            <Badge variant="outline" className="text-[11px] gap-1">
                              <Clock className="h-3 w-3" />
                              {horizon}-term
                            </Badge>
                            <Badge variant="outline" className="text-[11px] gap-1">
                              <Shield className="h-3 w-3" />
                              {riskProfile} risk
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-8">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Price</p>
                          <p className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-mono)]">
                            {fmt(recommendation.currentPrice)}
                          </p>
                        </div>
                        {recommendation.targetPrice && (
                          <>
                            <Separator orientation="vertical" className="h-10" />
                            <div className="text-right">
                              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Target</p>
                              <p className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-mono)]">
                                {recommendation.targetPrice}
                              </p>
                            </div>
                          </>
                        )}
                        <Separator orientation="vertical" className="h-10" />
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">Confidence</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={recommendation.confidence} className="w-16 h-2" />
                            <span className="text-sm font-bold text-slate-900 font-[family-name:var(--font-mono)]">{recommendation.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Tabs */}
                <Tabs defaultValue="overview">
                  <TabsList className="w-full justify-start flex-wrap">
                    <TabsTrigger value="overview" className="gap-1.5"><Briefcase className="h-3.5 w-3.5" /> Overview</TabsTrigger>
                    <TabsTrigger value="financials" className="gap-1.5"><DollarSign className="h-3.5 w-3.5" /> Financials</TabsTrigger>
                    <TabsTrigger value="news" className="gap-1.5"><Newspaper className="h-3.5 w-3.5" /> News & Sentiment</TabsTrigger>
                    <TabsTrigger value="risk" className="gap-1.5"><AlertTriangle className="h-3.5 w-3.5" /> Risk Analysis</TabsTrigger>
                  </TabsList>

                  {/* ─── Overview Tab ─────────────────────────────────── */}
                  <TabsContent value="overview">
                    <motion.div {...fadeUp} className="flex flex-col gap-5">
                      {/* Thesis */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Investment Thesis</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{recommendation.thesis}</p>
                        </CardContent>
                      </Card>

                      {/* Pros / Cons */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-emerald-700">
                              <ThumbsUp className="h-4 w-4" /> Strengths
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2.5">
                              {recommendation.pros.map((p, i) => (
                                <li key={i} className="flex gap-2 text-sm text-slate-600">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                  <span className="leading-relaxed">{p}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-sm flex items-center gap-2 text-rose-700">
                              <ThumbsDown className="h-4 w-4" /> Weaknesses
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="space-y-2.5">
                              {recommendation.cons.map((c, i) => (
                                <li key={i} className="flex gap-2 text-sm text-slate-600">
                                  <XCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                                  <span className="leading-relaxed">{c}</span>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    </motion.div>
                  </TabsContent>

                  {/* ─── Financials Tab ───────────────────────────────── */}
                  <TabsContent value="financials">
                    <motion.div {...fadeUp} className="flex flex-col gap-5">
                      {/* Financial Assessment */}
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm">Quantitative Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{recommendation.financialAssessment}</p>
                        </CardContent>
                      </Card>

                      {financials ? (
                        <>
                          {/* KPI Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <KPICard label="Market Cap" value={fmtB(financials.marketCap)} />
                            <KPICard label="P/E Ratio" value={financials.peRatio?.toFixed(2) || "N/A"} />
                            <KPICard label="EPS" value={fmt(financials.eps)} />
                            <KPICard label="Beta" value={financials.beta?.toFixed(2) || "N/A"} sub="Volatility measure" />
                            <KPICard label="Revenue" value={fmtB(financials.financials?.totalRevenue)} />
                            <KPICard label="Net Income" value={fmtB(financials.financials?.netIncome)} />
                            <KPICard label="Free Cash Flow" value={fmtB(financials.financials?.freeCashflow)} />
                            <KPICard label="ROE" value={fmtPct(financials.financials?.returnOnEquity)} />
                          </div>

                          {/* Price Chart */}
                          {financials.historical && financials.historical.length > 0 && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">30-Day Price History</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="h-[280px] w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={financials.historical} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                      <defs>
                                        <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.12} />
                                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                      </defs>
                                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                      <XAxis
                                        dataKey="date"
                                        tickFormatter={(d) => d.slice(5)}
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={{ stroke: "#e2e8f0" }}
                                        tickLine={false}
                                      />
                                      <YAxis
                                        domain={["dataMin - 5", "dataMax + 5"]}
                                        tick={{ fontSize: 11, fill: "#94a3b8" }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `$${v}`}
                                      />
                                      <RechartsTooltip
                                        contentStyle={{
                                          background: "white",
                                          border: "1px solid #e2e8f0",
                                          borderRadius: 8,
                                          fontSize: 12,
                                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                                        }}
                                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Close"]}
                                      />
                                      <Area
                                        type="monotone"
                                        dataKey="close"
                                        stroke="#4f46e5"
                                        strokeWidth={2}
                                        fill="url(#priceGrad)"
                                      />
                                    </AreaChart>
                                  </ResponsiveContainer>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Analyst Opinions */}
                          {financials.analystOpinions && (
                            <Card>
                              <CardHeader className="pb-3">
                                <CardTitle className="text-sm">Analyst Consensus</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="h-[120px] w-full">
                                  <ResponsiveContainer width="100%" height="100%">
                                    <BarChart
                                      layout="vertical"
                                      data={[
                                        { name: "Buy", value: financials.analystOpinions.buy },
                                        { name: "Hold", value: financials.analystOpinions.hold },
                                        { name: "Sell", value: financials.analystOpinions.sell },
                                      ]}
                                      margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                                    >
                                      <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: "#475569", fontWeight: 500 }} axisLine={false} tickLine={false} width={40} />
                                      <RechartsTooltip
                                        contentStyle={{ background: "white", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12 }}
                                      />
                                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                                        <Cell fill="#10b981" />
                                        <Cell fill="#f59e0b" />
                                        <Cell fill="#ef4444" />
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* Financial Table */}
                          <Card>
                            <CardHeader className="pb-3">
                              <CardTitle className="text-sm">Balance Sheet & Ratios</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="divide-y divide-slate-100">
                                {[
                                  { label: "Debt to Equity", value: financials.financials?.debtToEquity?.toFixed(2) || "N/A" },
                                  { label: "Current Ratio", value: financials.financials?.currentRatio?.toFixed(2) || "N/A" },
                                  { label: "Quick Ratio", value: financials.financials?.quickRatio?.toFixed(2) || "N/A" },
                                  { label: "Operating Cash Flow", value: fmtB(financials.financials?.operatingCashflow) },
                                  { label: "Gross Profit", value: fmtB(financials.financials?.grossProfits) },
                                  { label: "Dividend Yield", value: financials.dividendYield ? `${financials.dividendYield.toFixed(2)}%` : "0.00%" },
                                  { label: "Analyst Target Price", value: fmt(financials.targetMeanPrice) },
                                ].map((row, i) => (
                                  <div key={i} className="flex justify-between py-2.5 text-sm">
                                    <span className="text-slate-500">{row.label}</span>
                                    <span className="font-medium text-slate-900 font-[family-name:var(--font-mono)]">{row.value}</span>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </>
                      ) : (
                        <Card>
                          <CardContent className="p-8 text-center">
                            <p className="text-sm text-slate-500">Financial data not available for this ticker.</p>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  </TabsContent>

                  {/* ─── News & Sentiment Tab ─────────────────────────── */}
                  <TabsContent value="news">
                    <motion.div {...fadeUp} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Globe className="h-4 w-4 text-indigo-600" />
                            Competitive & Industry Analysis
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                            {webResearch || "No competitive analysis available."}
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <Newspaper className="h-4 w-4 text-indigo-600" />
                            Recent News & Sentiment
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                            {newsResearch || "No recent news available."}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>

                  {/* ─── Risk Analysis Tab ────────────────────────────── */}
                  <TabsContent value="risk">
                    <motion.div {...fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2 text-amber-700">
                            <AlertTriangle className="h-4 w-4" />
                            Risk Factors
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2.5">
                            {recommendation.risks.map((r, i) => (
                              <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                                <Badge variant="warning" className="h-5 w-5 p-0 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">!</Badge>
                                <span className="leading-relaxed">{r}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="pb-3">
                          <CardTitle className="text-sm flex items-center gap-2 text-indigo-700">
                            <Activity className="h-4 w-4" />
                            Catalysts to Watch
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2.5">
                            {recommendation.catalysts.map((c, i) => (
                              <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                                <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center shrink-0 mt-0.5 text-[10px]">→</Badge>
                                <span className="leading-relaxed">{c}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            </AnimatePresence>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-5 text-center text-xs text-slate-400">
        Invenio Investment Research · Built with Next.js, LangGraph & Gemini
      </footer>
    </div>
  );
}
