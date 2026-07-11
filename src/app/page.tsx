"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line, Legend
} from "recharts";
import {
  Search, TrendingUp, AlertTriangle, CheckCircle2, XCircle,
  Clock, Shield, Activity, Briefcase, DollarSign, Globe,
  Newspaper, ThumbsUp, ThumbsDown, BarChart3, Target,
  Loader2, ChevronRight, Zap, ArrowUpRight, ArrowDownRight,
  Minus, Terminal, User, Building, Compass, Info, Calendar
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

// ─── Interfaces ─────────────────────────────────────────────────────────────

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

// ─── Helper Formatting ──────────────────────────────────────────────────────

const fmt = (n: number | undefined, prefix = "$", decimals = 2) =>
  n != null ? `${prefix}${n.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}` : "N/A";

const fmtB = (n: number | undefined) =>
  n != null ? `$${(n / 1e9).toFixed(2)}B` : "N/A";

const fmtPct = (n: number | undefined) =>
  n != null ? `${(n * 100).toFixed(2)}%` : "N/A";

// ─── KPI Card ───────────────────────────────────────────────────────────────

function KPICard({ label, value, sub, icon: Icon, trend }: { label: string; value: string; sub?: string; icon?: any; trend?: { value: string; positive: boolean } }) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ duration: 0.15 }}>
      <Card className="border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.015)] rounded-2xl overflow-hidden hover:shadow-[0_4px_16px_rgba(0,0,0,0.03)] transition-all">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
            {Icon && (
              <div className="h-7 w-7 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                <Icon className="h-4 w-4" />
              </div>
            )}
          </div>
          <div className="mt-3">
            <p className="text-2xl font-bold text-slate-900 font-[family-name:var(--font-mono)]">{value}</p>
            {(sub || trend) && (
              <div className="flex items-center gap-1.5 mt-1.5">
                {trend && (
                  <span className={`text-xs font-semibold flex items-center ${trend.positive ? "text-emerald-600" : "text-rose-600"}`}>
                    {trend.positive ? "+" : ""}{trend.value}
                  </span>
                )}
                {sub && <span className="text-xs text-slate-400">{sub}</span>}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default function Home() {
  const [searchInput, setSearchInput] = useState("");
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

  // Unified execution trigger
  const triggerResearch = async (tickerSymbol: string) => {
    if (!tickerSymbol.trim()) return;

    setLoading(true);
    setError(null);
    setRecommendation(null);
    setFinancials(null);
    setWebResearch("");
    setNewsResearch("");
    setShowLogs(true);
    setLogs([`Initializing research for ${tickerSymbol.trim().toUpperCase()}...`]);

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
        body: JSON.stringify({ ticker: tickerSymbol.trim().toUpperCase(), horizon, riskProfile }),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerResearch(searchInput);
  };
  const horizonLabels = { short: "Short-term · < 1 year", medium: "Medium-term · 1–3 years", long: "Long-term · 3+ years" };
  const riskLabels = { low: "Conservative", medium: "Balanced", high: "Aggressive" };

  const actionBadge = (action: "BUY" | "HOLD" | "SELL") => {
    const map = { BUY: "success", HOLD: "warning", SELL: "destructive" } as const;
    return map[action];
  };

  const actionColorClass = (action: "BUY" | "HOLD" | "SELL") => {
    if (action === "BUY") return "text-emerald-600 bg-emerald-50 border-emerald-100";
    if (action === "SELL") return "text-rose-600 bg-rose-50 border-rose-100";
    return "text-amber-600 bg-amber-50 border-amber-100";
  };

  // Upside calculation
  const getUpsidePercentage = () => {
    if (!financials || !financials.targetMeanPrice || !financials.price) return null;
    const currentPrice = financials.price;
    const targetPrice = financials.targetMeanPrice;
    const upside = ((targetPrice - currentPrice) / currentPrice) * 100;
    return {
      value: `${upside > 0 ? "+" : ""}${upside.toFixed(1)}%`,
      positive: upside > 0
    };
  };

  const upside = getUpsidePercentage();

  // Build News List from News & Sentiment Output
  const parseNewsItems = (newsText: string) => {
    if (!newsText) return [];
    // A simple parser for NewsAPI description blocks
    const lines = newsText.split("\n").filter(l => l.trim().length > 10);
    return lines.slice(0, 3).map((line, idx) => {
      const isPositive = line.toLowerCase().includes("positive") || line.toLowerCase().includes("upgrade") || line.toLowerCase().includes("record");
      const isNegative = line.toLowerCase().includes("negative") || line.toLowerCase().includes("lawsuit") || line.toLowerCase().includes("fine") || line.toLowerCase().includes("headwind");
      return {
        id: idx,
        headline: line.replace(/^-\s*/, "").substring(0, 80) + (line.length > 80 ? "..." : ""),
        source: "Market Sentiment Summary",
        timestamp: "Recently",
        sentiment: isPositive ? "POSITIVE" : isNegative ? "NEGATIVE" : "NEUTRAL" as const,
        summary: line.substring(0, 160) + (line.length > 160 ? "..." : "")
      };
    });
  };

  const mockNews = parseNewsItems(newsResearch);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-[family-name:var(--font-inter)] selection:bg-indigo-100">
      {/* ─── Top Navigation ─── */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-50 shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-600/10">
              <TrendingUp className="h-4.5 w-4.5" />
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">Invenio</span>
            <Badge variant="outline" className="text-[10px] font-medium border-slate-200 text-slate-500 bg-slate-50">Enterprise</Badge>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSubmit} className="flex-1 max-w-md relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search companies by ticker symbol (e.g. AAPL, NVDA)..."
              className="w-full h-11 rounded-xl border border-slate-200/90 bg-slate-50/60 pl-10 pr-4 text-sm font-medium text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:border-transparent transition-all uppercase"
            />
          </form>

          {/* Right Menu */}
          <div className="flex items-center gap-4">
            {financials && (
              <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                NYSE: {financials.ticker}
              </div>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-9 w-9 cursor-pointer hover:opacity-90 border border-slate-100">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold text-xs">AN</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="gap-2">
                  <User className="h-4 w-4 text-slate-400" /> Account Settings
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-2">
                  <Building className="h-4 w-4 text-slate-400" /> Subscription Plan
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 flex flex-col gap-8">
        
        {/* Empty state when no ticker researched */}
        {!recommendation && !loading && !error && (
          <div className="flex-1 py-20 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="mx-auto h-20 w-20 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center mb-6">
                <Compass className="h-9 w-9 text-indigo-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Start Your Investment Analysis</h2>
              <p className="text-sm text-slate-500 mt-2.5 leading-relaxed">
                Configure your parameters below and run institutional-grade research on any NASDAQ/NYSE stock.
              </p>

              {/* Quick Config Form in Empty State */}
              <div className="mt-8 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex flex-col gap-5 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Horizon</label>
                    <select
                      value={horizon}
                      onChange={(e: any) => setHorizon(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 mt-1.5 px-2 text-xs bg-slate-50 font-semibold"
                    >
                      <option value="short">Short Term</option>
                      <option value="medium">Medium Term</option>
                      <option value="long">Long Term</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk Profile</label>
                    <select
                      value={riskProfile}
                      onChange={(e: any) => setRiskProfile(e.target.value)}
                      className="w-full h-9 rounded-lg border border-slate-200 mt-1.5 px-2 text-xs bg-slate-50 font-semibold"
                    >
                      <option value="low">Low Risk</option>
                      <option value="medium">Medium Risk</option>
                      <option value="high">High Risk</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter ticker (e.g. AAPL)"
                    className="flex-1 h-10 border border-slate-200 rounded-lg px-3 uppercase font-semibold text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    onChange={(e) => setSearchInput(e.target.value)}
                    value={searchInput}
                  />
                  <Button onClick={() => triggerResearch(searchInput)} className="h-10">Analyze Stock</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {loading && !recommendation && (
          <div className="flex-1 py-20 flex items-center justify-center">
            <div className="text-center">
              <div className="relative mx-auto mb-6 flex items-center justify-center">
                <div className="h-16 w-16 rounded-full border-[3px] border-slate-100 border-t-indigo-600 animate-spin" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Assembling Financial Intelligence</h2>
              <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
                We are pulling statements, analyzing sentiment trends, and compiling a structured hedge fund recommendation.
              </p>

              {/* Log preview during loading */}
              <div className="mt-8 max-w-md mx-auto bg-white border border-slate-100 rounded-xl p-4 shadow-sm text-left">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Step timeline</p>
                <div className="flex flex-col gap-2">
                  {[
                    { step: 1, label: "Validation & Setup", status: currentStep > 1 ? "done" : "active" },
                    { step: 2, label: "Quantitative Analysis (Yahoo Finance)", status: currentStep > 2 ? "done" : currentStep === 2 ? "active" : "pending" },
                    { step: 3, label: "Market Research Synthesis (Tavily)", status: currentStep > 3 ? "done" : currentStep === 3 ? "active" : "pending" },
                    { step: 4, label: "Structured Thesis Construction", status: currentStep === 4 ? "active" : "pending" },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs">
                      <div className={`h-4 w-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                        item.status === "done" ? "bg-emerald-100 text-emerald-600" : item.status === "active" ? "bg-indigo-100 text-indigo-600" : "bg-slate-50 text-slate-400"
                      }`}>
                        {item.status === "done" ? "✓" : item.step}
                      </div>
                      <span className={`font-medium ${item.status === "active" ? "text-indigo-600 font-semibold" : item.status === "done" ? "text-slate-600" : "text-slate-400"}`}>
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="max-w-xl mx-auto mt-4">
            <XCircle className="h-4 w-4" />
            <AlertTitle>Execution Interrupted</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* ─── Realized Dashboard ─── */}
        {recommendation && (
          <div className="flex flex-col gap-8">
            
            {/* 1. Hero Section */}
            <Card className="border border-slate-100 bg-white shadow-[0_2px_12px_rgba(0,0,0,0.01)] rounded-2xl overflow-hidden p-6 md:p-8">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Brand & Recommendation */}
                <div className="flex flex-col">
                  <div className="flex items-center gap-3.5 flex-wrap">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight font-[family-name:var(--font-mono)] uppercase">
                      {recommendation.ticker}
                    </span>
                    <Badge className={`text-sm px-4 py-1 font-bold rounded-full border ${actionColorClass(recommendation.action)}`}>
                      {recommendation.action}
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-md border border-slate-100">
                      <Clock className="h-3 w-3" />
                      {horizonLabels[horizon].split(" · ")[0]} horizon
                    </div>
                  </div>
                  <h1 className="text-2xl font-semibold text-slate-600 mt-2">{recommendation.companyName}</h1>
                  <span className="text-xs text-slate-400 mt-1 uppercase font-semibold tracking-wider">
                    {financials?.sector || "Technology"} · {financials?.industry || "Software"}
                  </span>
                </div>

                {/* Price Details */}
                <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-10">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Price</span>
                    <span className="text-5xl font-extrabold text-slate-900 tracking-tight font-[family-name:var(--font-mono)] mt-1.5">
                      {fmt(recommendation.currentPrice)}
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-xs font-semibold">
                      {financials && financials.change >= 0 ? (
                        <span className="text-emerald-600 flex items-center gap-0.5">
                          <ArrowUpRight className="h-3.5 w-3.5" /> +{financials.changePercent.toFixed(2)}%
                        </span>
                      ) : financials ? (
                        <span className="text-rose-600 flex items-center gap-0.5">
                          <ArrowDownRight className="h-3.5 w-3.5" /> {financials.changePercent.toFixed(2)}%
                        </span>
                      ) : null}
                      <span className="text-slate-400 font-normal">today</span>
                    </div>
                  </div>

                  <Separator orientation="vertical" className="hidden md:block h-14" />

                  {/* Target and Upside */}
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Consensus Target</span>
                      <span className="text-2xl font-bold text-slate-800 font-[family-name:var(--font-mono)] mt-2">
                        {recommendation.targetPrice || fmt(financials?.targetMeanPrice)}
                      </span>
                      {upside && (
                        <span className={`text-xs font-semibold mt-1 flex items-center gap-0.5 ${upside.positive ? "text-emerald-600" : "text-rose-600"}`}>
                          {upside.positive ? "+" : ""}{upside.value} potential
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confidence</span>
                      <div className="flex items-center gap-2 mt-3">
                        <Progress value={recommendation.confidence} className="w-20 h-2 bg-slate-100" />
                        <span className="text-sm font-bold text-slate-800 font-[family-name:var(--font-mono)]">{recommendation.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Sparkline */}
                  {financials?.historical && financials.historical.length > 0 && (
                    <div className="hidden xl:block h-14 w-28 shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={financials.historical}>
                          <Area
                            type="monotone"
                            dataKey="close"
                            stroke={recommendation.action === "BUY" ? "#10b981" : recommendation.action === "SELL" ? "#ef4444" : "#f59e0b"}
                            strokeWidth={1.5}
                            fillOpacity={0.06}
                            fill={recommendation.action === "BUY" ? "#10b981" : recommendation.action === "SELL" ? "#ef4444" : "#f59e0b"}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                </div>
              </div>
            </Card>

            {/* 2. KPI Cards Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              <KPICard label="Market Cap" value={fmtB(financials?.marketCap)} icon={Briefcase} />
              <KPICard label="P/E Ratio" value={financials?.peRatio ? financials.peRatio.toFixed(1) : "N/A"} icon={Activity} />
              <KPICard label="EPS (TTM)" value={fmt(financials?.eps)} icon={DollarSign} />
              <KPICard label="Total Revenue" value={fmtB(financials?.financials?.totalRevenue)} icon={TrendingUp} />
              <KPICard label="Return on Equity" value={fmtPct(financials?.financials?.returnOnEquity)} icon={Target} />
              <KPICard label="Dividend Yield" value={financials?.dividendYield ? `${(financials.dividendYield * 100).toFixed(2)}%` : "0.00%"} icon={Clock} />
              <KPICard label="Free Cash Flow" value={fmtB(financials?.financials?.freeCashflow)} icon={DollarSign} />
              <KPICard label="Debt to Equity" value={financials?.financials?.debtToEquity ? financials.financials.debtToEquity.toFixed(2) : "N/A"} icon={Shield} />
            </div>

            {/* 3. Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Left Side: Visualizations & Historicals */}
              <div className="lg:col-span-2 flex flex-col gap-6">
                
                {/* Main Stock Chart */}
                {financials?.historical && financials.historical.length > 0 ? (
                  <Card className="border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] rounded-2xl p-6">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-base font-bold text-slate-900">Historical Price Trend</CardTitle>
                      <CardDescription>Price charts over the last 30 trading days</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[320px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={financials.historical} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <defs>
                              <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.08} />
                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                            <XAxis
                              dataKey="date"
                              tickFormatter={(val) => val.slice(5)}
                              tick={{ fontSize: 11, fill: "#94a3b8" }}
                              axisLine={{ stroke: "#f1f5f9" }}
                              tickLine={false}
                            />
                            <YAxis
                              domain={["dataMin - 3", "dataMax + 3"]}
                              tick={{ fontSize: 11, fill: "#94a3b8" }}
                              axisLine={false}
                              tickLine={false}
                              tickFormatter={(v) => `$${v}`}
                            />
                            <RechartsTooltip
                              contentStyle={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 12, fontSize: 12, boxShadow: "0 10px 15px -3px rgba(0,0,0,0.02)" }}
                              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Close"]}
                            />
                            <Area
                              type="monotone"
                              dataKey="close"
                              stroke="#4f46e5"
                              strokeWidth={2}
                              fill="url(#indigoGrad)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="border border-slate-100 bg-white p-6 text-center text-slate-400">
                    <p className="text-sm">Historical price data currently unavailable.</p>
                  </Card>
                )}

                {/* Additional Performance Charts */}
                {financials?.financials && (
                  <Card className="border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] rounded-2xl p-6">
                    <CardHeader className="p-0 pb-4">
                      <CardTitle className="text-base font-bold text-slate-900">Operating Cash flows & Income Breakdown</CardTitle>
                      <CardDescription>Comparison of Cash metrics (TTM)</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={[
                              { name: "Revenue", value: financials.financials.totalRevenue },
                              { name: "Gross Profit", value: financials.financials.grossProfits },
                              { name: "Operating CF", value: financials.financials.operatingCashflow },
                              { name: "Free CF", value: financials.financials.freeCashflow },
                              { name: "Net Income", value: financials.financials.netIncome },
                            ].filter(item => item.value != null)}
                            margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={{ stroke: "#f1f5f9" }} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${(v / 1e9).toFixed(0)}B`} />
                            <RechartsTooltip
                              contentStyle={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 12, fontSize: 12 }}
                              formatter={(value: any) => [`$${(Number(value) / 1e9).toFixed(2)}B`, "Amount"]}
                            />
                            <Bar dataKey="value" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={40} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </div>

              {/* Right Side: Key Qualitative Cases */}
              <div className="flex flex-col gap-6">
                
                {/* Summary Thesis */}
                <Card className="border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] rounded-2xl p-6">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900">Institutional Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <p className="text-sm text-slate-600 leading-relaxed font-light whitespace-pre-line">
                      {recommendation.thesis}
                    </p>
                  </CardContent>
                </Card>

                {/* Bul / Bear Case */}
                <Card className="border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] rounded-2xl p-6">
                  <Tabs defaultValue="bull" className="w-full">
                    <TabsList className="grid grid-cols-2 w-full mb-4">
                      <TabsTrigger value="bull" className="text-xs">Bull Case</TabsTrigger>
                      <TabsTrigger value="bear" className="text-xs">Bear Case</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="bull">
                      <ul className="space-y-3.5">
                        {recommendation.pros.map((pro, idx) => (
                          <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600">
                            <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{pro}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                    
                    <TabsContent value="bear">
                      <ul className="space-y-3.5">
                        {recommendation.cons.map((con, idx) => (
                          <li key={idx} className="flex gap-2.5 items-start text-xs text-slate-600">
                            <XCircle className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
                            <span className="leading-relaxed">{con}</span>
                          </li>
                        ))}
                      </ul>
                    </TabsContent>
                  </Tabs>
                </Card>

                {/* Catalysts & Risks */}
                <Card className="border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] rounded-2xl p-6">
                  <CardHeader className="p-0 pb-4">
                    <CardTitle className="text-base font-bold text-slate-900">Timeline & Risk Analysis</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 flex flex-col gap-4">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Catalysts to watch</span>
                      <ul className="space-y-2 mt-2">
                        {recommendation.catalysts.slice(0, 3).map((c, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
                            <span>{c}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Major downside risks</span>
                      <ul className="space-y-2 mt-2">
                        {recommendation.risks.slice(0, 3).map((r, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

              </div>
            </div>

            {/* 4. Analysis Tabs */}
            <Card className="border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] rounded-2xl p-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="w-full justify-start flex-wrap border-b border-slate-100 pb-px mb-6">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="valuation">Valuation</TabsTrigger>
                  <TabsTrigger value="news">News</TabsTrigger>
                  <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
                </TabsList>

                {/* Overview tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2">
                      <h4 className="text-base font-bold text-slate-800">Executive Summary</h4>
                      <p className="text-sm text-slate-600 leading-relaxed mt-2">{recommendation.thesis}</p>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Analysis Setup</h4>
                      <div className="flex flex-col gap-3 mt-4 text-xs">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Risk Profile</span>
                          <span className="font-semibold capitalize text-slate-800">{riskProfile}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Time Horizon</span>
                          <span className="font-semibold capitalize text-slate-800">{horizon}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Confidence Factor</span>
                          <span className="font-semibold text-slate-800">{recommendation.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Financials tab */}
                <TabsContent value="financials" className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3">Balance Sheet Overview</h4>
                      <div className="divide-y divide-slate-100">
                        <div className="flex justify-between py-2 text-xs">
                          <span className="text-slate-500">Debt to Equity</span>
                          <span className="font-medium text-slate-900">{financials?.financials?.debtToEquity?.toFixed(2) || "N/A"}</span>
                        </div>
                        <div className="flex justify-between py-2 text-xs">
                          <span className="text-slate-500">Current Ratio</span>
                          <span className="font-medium text-slate-900">{financials?.financials?.currentRatio?.toFixed(2) || "N/A"}</span>
                        </div>
                        <div className="flex justify-between py-2 text-xs">
                          <span className="text-slate-500">Quick Ratio</span>
                          <span className="font-medium text-slate-900">{financials?.financials?.quickRatio?.toFixed(2) || "N/A"}</span>
                        </div>
                        <div className="flex justify-between py-2 text-xs">
                          <span className="text-slate-500">Return on Equity</span>
                          <span className="font-medium text-slate-900">{fmtPct(financials?.financials?.returnOnEquity)}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800 mb-3">Cash flow summary</h4>
                      <div className="divide-y divide-slate-100">
                        <div className="flex justify-between py-2 text-xs">
                          <span className="text-slate-500">Operating Cashflow</span>
                          <span className="font-medium text-slate-900">{fmtB(financials?.financials?.operatingCashflow)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-xs">
                          <span className="text-slate-500">Free Cashflow</span>
                          <span className="font-medium text-slate-900">{fmtB(financials?.financials?.freeCashflow)}</span>
                        </div>
                        <div className="flex justify-between py-2 text-xs">
                          <span className="text-slate-500">Gross Profits</span>
                          <span className="font-medium text-slate-900">{fmtB(financials?.financials?.grossProfits)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Valuation tab */}
                <TabsContent value="valuation" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Trailing PE</span>
                      <span className="text-4xl font-extrabold text-slate-800 mt-2 font-[family-name:var(--font-mono)]">{financials?.peRatio?.toFixed(1) || "N/A"}</span>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">EPS</span>
                      <span className="text-4xl font-extrabold text-slate-800 mt-2 font-[family-name:var(--font-mono)]">{fmt(financials?.eps)}</span>
                    </div>
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 flex flex-col items-center justify-center text-center">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Price</span>
                      <span className="text-4xl font-extrabold text-slate-800 mt-2 font-[family-name:var(--font-mono)]">{fmt(financials?.targetMeanPrice)}</span>
                    </div>
                  </div>
                </TabsContent>

                {/* News tab */}
                <TabsContent value="news" className="space-y-4">
                  <div className="flex flex-col gap-4">
                    <p className="text-sm text-slate-600 font-light whitespace-pre-line">{newsResearch || "No news sentiment analysis compiled."}</p>
                  </div>
                </TabsContent>

                {/* Risk Analysis tab */}
                <TabsContent value="risk" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Upside Milestones</h4>
                      <ul className="list-disc pl-4 mt-3 text-xs text-slate-600 space-y-2">
                        {recommendation.catalysts.map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-800">Downside Threat Factors</h4>
                      <ul className="list-disc pl-4 mt-3 text-xs text-slate-600 space-y-2">
                        {recommendation.risks.map((r, i) => (
                          <li key={i}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* 5. News Section */}
            {mockNews.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-4">Latest Market Developments</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {mockNews.map((news) => (
                    <Card key={news.id} className="border border-slate-100 bg-white hover:shadow-md transition-shadow duration-200 rounded-2xl flex flex-col justify-between p-5">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{news.source}</span>
                          <Badge variant={news.sentiment === "POSITIVE" ? "success" : news.sentiment === "NEGATIVE" ? "destructive" : "secondary"} className="text-[9px]">
                            {news.sentiment}
                          </Badge>
                        </div>
                        <h4 className="text-sm font-bold text-slate-800 leading-snug line-clamp-2">{news.headline}</h4>
                        <p className="text-xs text-slate-500 leading-relaxed mt-2.5 line-clamp-3">{news.summary}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-semibold mt-4 block">{news.timestamp}</span>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Research Timeline */}
            <Card className="border border-slate-100 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.01)] rounded-2xl p-6">
              <CardHeader className="p-0 pb-4">
                <CardTitle className="text-base font-bold text-slate-900">Research Process Timeline</CardTitle>
                <CardDescription>Sequential timeline of operations performed by the agent</CardDescription>
              </CardHeader>
              <CardContent className="p-0 mt-2">
                <div className="relative pl-6 border-l border-slate-200 space-y-6">
                  {[
                    { title: "Quantitative Assessment", desc: "Parsed full balance sheet and historical metrics from Yahoo Finance." },
                    { title: "Geopolitical and Market Positioning Analysis", desc: "Queried web indices for market size, competitors, and trends." },
                    { title: "Sentiment and News Extraction", desc: "Identified overall sentiment distribution on recent corporate news." },
                    { title: "Investment Recommendation Compiled", desc: "Structured investment decision matrix using LLM reasoning models." }
                  ].map((step, index) => (
                    <div key={index} className="relative">
                      <div className="absolute -left-[31px] top-0.5 h-4.5 w-4.5 rounded-full bg-indigo-600 text-white flex items-center justify-center border-4 border-white shadow-sm">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                      </div>
                      <h4 className="text-xs font-bold text-slate-800">{step.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white py-6 text-center text-xs text-slate-400">
        Invenio Investment Analytics Platform · Institutional Research Terminal v1.0
      </footer>
    </div>
  );
}
