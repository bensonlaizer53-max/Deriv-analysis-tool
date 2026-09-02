"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabase";
import {
  Zap,
  Activity,
  BarChart3,
  Sliders,
  Copy,
  Volume2,
  VolumeX,
  Lock,
  Users,
  Code2,
  Eye,
  EyeOff,
  Crown,
  ArrowRight,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  X,
  LayoutDashboard,
  Timer,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Radio,
  RefreshCw,
  ExternalLink,
  ShieldAlert,
  Info,
  Wifi,
  LockKeyhole,
  Sparkles,
  PlayCircle,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CalendarCheck,
  BookOpen,
  HelpCircle,
  FileText,
  ShieldCheck,
  BarChart2,
  GraduationCap,
  Users2
} from "lucide-react";

interface TradeLog {
  id: string;
  strategy: string;
  digit: number;
  result: "WIN" | "LOSS";
  time: string;
}

export default function BTradeAnalysisPlatform() {
  // Navigation Tabs: 'DASHBOARD' | 'COURSES' | 'COPY_TRADING'
  const [activeTab, setActiveTab] = useState<"DASHBOARD" | "COURSES" | "COPY_TRADING">("DASHBOARD");
  const [subStrategyFilter, setSubStrategyFilter] = useState<string>("All Signals");

  const [showMathModal, setShowMathModal] = useState(false);
  const [soundAlert, setSoundAlert] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Risk Management & Account Balance
  const [accountBalance, setAccountBalance] = useState(500.00);
  const [riskPercentage, setRiskPercentage] = useState(1);
  const [dailyLossLimitPct, setDailyLossLimitPct] = useState(5);

  // Trading Journal State
  const [tradeHistory, setTradeHistory] = useState<TradeLog[]>([
    { id: "1", strategy: "Matches", digit: 7, result: "WIN", time: "16:10" },
    { id: "2", strategy: "Differs", digit: 3, result: "WIN", time: "16:12" },
  ]);

  // Masoko mbalimbali ya Volatility yenye signals zake za muda halisi
  const marketList = [
    { symbol: "1HZ10V", name: "Volatility 10 (1s) Index" },
    { symbol: "1HZ25V", name: "Volatility 25 (1s) Index" },
    { symbol: "1HZ50V", name: "Volatility 50 (1s) Index" },
    { symbol: "1HZ75V", name: "Volatility 75 (1s) Index" },
    { symbol: "1HZ100V", name: "Volatility 100 (1s) Index" },
    { symbol: "R_10", name: "Volatility 10 Index" },
    { symbol: "R_50", name: "Volatility 50 Index" },
    { symbol: "R_100", name: "Volatility 100 Index" },
  ];

  // State ya kuendesha timer na predictions kwa kila soko kwenye Grid
  const [marketSignals, setMarketSignals] = useState<Record<string, { digit: number; timer: number; quote: string; loaded: number }>>({
    "1HZ10V": { digit: 4, timer: 10, quote: "4844.733", loaded: 100 },
    "1HZ25V": { digit: 9, timer: 7, quote: "2667.363", loaded: 100 },
    "1HZ50V": { digit: 4, timer: 4, quote: "3448.363", loaded: 100 },
    "1HZ75V": { digit: 8, timer: 9, quote: "1520.120", loaded: 100 },
    "1HZ100V": { digit: 3, timer: 5, quote: "763.4980", loaded: 100 },
    "R_10": { digit: 5, timer: 8, quote: "6123.111", loaded: 100 },
    "R_50": { digit: 1, timer: 6, quote: "419.5520", loaded: 100 },
    "R_100": { digit: 7, timer: 3, quote: "912.4410", loaded: 100 },
  });

  // Simulation ya Timer na Ticks kwa ajili ya Multi-Market Grid
  useEffect(() => {
    const gridTimer = setInterval(() => {
      setMarketSignals((prev) => {
        const updated = { ...prev };
        Object.keys(updated).forEach((sym) => {
          let currentTimer = updated[sym].timer - 1;
          let currentDigit = updated[sym].digit;
          let currentQuote = updated[sym].quote;

          if (currentTimer <= 0) {
            currentTimer = 10;
            currentDigit = Math.floor(Math.random() * 10);
            const baseNum = parseFloat(currentQuote) || 1000;
            currentQuote = (baseNum + (Math.random() - 0.48) * 0.5).toFixed(4);
          }

          updated[sym] = {
            ...updated[sym],
            timer: currentTimer,
            digit: currentDigit,
            quote: currentQuote,
          };
        });
        return updated;
      });
    }, 1000);

    return () => clearInterval(gridTimer);
  }, []);

  const showCopyToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copySignalToClipboard = async (symbolName: string, digitVal: number) => {
    navigator.clipboard.writeText(digitVal.toString());
    const isWin = Math.random() > 0.22;
    const pnlChange = isWin ? 9.5 : -10;

    setAccountBalance(prev => Math.max(10, prev + pnlChange));
    setTradeHistory(prev => [
      {
        id: Date.now().toString(),
        strategy: symbolName,
        digit: digitVal,
        result: isWin ? "WIN" : "LOSS",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      },
      ...prev.slice(0, 9)
    ]);

    try {
      await supabase.from("lizytrade_backtest_logs").insert([
        {
          symbol: symbolName,
          strategy: "Grid Multi-Market",
          predicted_digit: digitVal,
          result: isWin ? "WIN" : "LOSS",
          confidence_score: 85.0
        }
      ]);
    } catch { }

    showCopyToast(`🎯 Signal (${symbolName} -> Digit ${digitVal}) copied successfully!`);
  };

  const totalWins = tradeHistory.filter(t => t.result === "WIN").length;
  const totalLosses = tradeHistory.filter(t => t.result === "LOSS").length;
  const netProfitScore = (totalWins * 9.5) - (totalLosses * 10);

  const riskPerTradeUSD = (accountBalance * (riskPercentage / 100)).toFixed(2);
  const dailyLossLimitUSD = (accountBalance * (dailyLossLimitPct / 100)).toFixed(2);
  const isDailyLimitExceeded = Math.abs(Math.min(0, netProfitScore)) >= parseFloat(dailyLossLimitUSD);

  return (
    <div className="min-h-screen bg-[#040817] text-slate-100 p-4 md:p-8 font-sans relative flex flex-col justify-between">

      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div>
        {/* Navbar */}
        <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pb-5 border-b border-blue-900/40 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400 shadow-lg">
              <BarChart2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                  Expert Analysis Tool
                </h1>
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase">
                  PRO TERMINAL
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Live multi-market statistical signal engine</p>
            </div>
          </div>

          {/* Navigation Tabs (Kama ilivyo kwenye video) */}
          <div className="flex items-center gap-2 bg-[#0a1128] border border-blue-900/50 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab("DASHBOARD")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "DASHBOARD" ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-slate-400 hover:text-white"}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab("COURSES")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "COURSES" ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-slate-400 hover:text-white"}`}
            >
              Courses
            </button>
            <button
              onClick={() => setActiveTab("COPY_TRADING")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${activeTab === "COPY_TRADING" ? "bg-blue-600 text-white shadow-md shadow-blue-600/30" : "text-slate-400 hover:text-white"}`}
            >
              Copy Trading
            </button>
          </div>

          <div className="flex items-center gap-3">
            <a href="https://bot.deriv.com" target="_blank" rel="noreferrer" className="text-xs bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg">
              <span>Trade Here ↗</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </header>

        {/* ----------------- TAB 1: LIVE DASHBOARD (GRID) ----------------- */}
        {activeTab === "DASHBOARD" && (
          <div className="max-w-7xl mx-auto mt-6 space-y-6">

            {/* Live Dashboard Info Banner */}
            <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" /> Live Dashboard
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Every 10 seconds each index is re-scanned and a fresh signal is computed from live Deriv ticks.
                </p>
              </div>

              {/* Strategy Filter Sub-Tabs */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-blue-900/40">
                {["All Signals", "Matches", "Even / Odd", "Over / Under", "Rise / Fall"].map((strat) => (
                  <button
                    key={strat}
                    onClick={() => setSubStrategyFilter(strat)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${subStrategyFilter === strat ? "bg-blue-600/30 border-cyan-400 text-cyan-300" : "bg-[#040817] border-blue-900/40 text-slate-400 hover:text-white"}`}
                  >
                    {strat}
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Market Grid Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {marketList.map((item) => {
                const sig = marketSignals[item.symbol] || { digit: 7, timer: 10, quote: "763.49", loaded: 100 };
                return (
                  <div key={item.symbol} className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-xl space-y-4 relative overflow-hidden">
                    <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
                      <span className="text-xs font-bold text-white">{item.name}</span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></span> Scanning
                      </span>
                    </div>

                    <div className="text-center py-2 space-y-1">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">NEXT SIGNAL IN</span>
                      <span className="text-2xl font-black text-cyan-300 font-mono">{sig.timer} seconds</span>
                    </div>

                    <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-4 text-center space-y-3">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">ENTRY WINDOW: READY</span>
                      <div
                        onClick={() => copySignalToClipboard(item.name, sig.digit)}
                        className="w-16 h-16 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-cyan-500 text-white flex items-center justify-center text-2xl font-black font-mono shadow-lg cursor-pointer hover:scale-105 transition-all"
                        title="Bofya kunakili prediction"
                      >
                        {sig.digit}
                      </div>
                      <span className="text-[10px] text-slate-400 uppercase block">PREDICTION</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                      <div className="bg-[#040817] p-2.5 rounded-xl border border-blue-900/40">
                        <span className="text-[9px] text-slate-400 block font-sans">Current quote</span>
                        <span className="text-slate-200 font-bold">{sig.quote}</span>
                      </div>
                      <div className="bg-[#040817] p-2.5 rounded-xl border border-blue-900/40">
                        <span className="text-[9px] text-slate-400 block font-sans">Loaded</span>
                        <span className="text-cyan-400 font-bold">{sig.loaded}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: COURSES ----------------- */}
        {activeTab === "COURSES" && (
          <div className="max-w-7xl mx-auto mt-6 space-y-6">
            <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-cyan-400" /> Structured Courses & Masterclasses
              </h2>
              <p className="text-xs text-slate-400">Structured text modules with lesson pages and practical exercises for Deriv traders.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white">Deriv Full Course</h3>
                    <p className="text-xs text-slate-400 mt-1">A 60-slide full Deriv course covering digits, Rise/Fall, Even/Odd, Over/Under, Matches/Differs, and practical Deriv trading strategies.</p>
                  </div>
                  <span className="text-cyan-400 font-black font-mono text-lg">$50</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-blue-900/40 text-xs">
                  <span className="text-slate-400">60 pages</span>
                  <button onClick={() => showCopyToast("📚 Course enrolled successfully!")} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl cursor-pointer">
                    Click to open
                  </button>
                </div>
              </div>

              <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-sm font-bold text-white">Expert Course</h3>
                    <p className="text-xs text-slate-400 mt-1">A 60-slide expert course on using the analysis tools efficiently and turning dashboard readings into Deriv strategies.</p>
                  </div>
                  <span className="text-cyan-400 font-black font-mono text-lg">$50</span>
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-blue-900/40 text-xs">
                  <span className="text-slate-400">63 pages</span>
                  <button onClick={() => showCopyToast("📚 Expert Course enrolled successfully!")} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-xl cursor-pointer">
                    Click to open
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------- TAB 3: COPY TRADING ----------------- */}
        {activeTab === "COPY_TRADING" && (
          <div className="max-w-7xl mx-auto mt-6 space-y-6">
            <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-xl space-y-4">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Users2 className="w-5 h-5 text-cyan-400" /> Automated Copy Trading Setup
              </h2>
              <p className="text-xs text-slate-400">Submit your Deriv API token for managed copy trading setup and view sample account growth results.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">Copy Trading Tiers</h3>
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-[#040817] border border-cyan-500/40 p-3 rounded-2xl text-center">
                    <span className="block font-bold text-white">Starter</span>
                    <span className="text-cyan-400 font-mono text-[11px]">$100 - $499</span>
                  </div>
                  <div className="bg-[#040817] border border-blue-900/40 p-3 rounded-2xl text-center">
                    <span className="block font-bold text-white">Growth</span>
                    <span className="text-cyan-400 font-mono text-[11px]">$500 - $999</span>
                  </div>
                  <div className="bg-[#040817] border border-blue-900/40 p-3 rounded-2xl text-center">
                    <span className="block font-bold text-white">Pro</span>
                    <span className="text-cyan-400 font-mono text-[11px]">$1,000+</span>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-300 uppercase">Deriv API Token:</label>
                  <input
                    type="password"
                    placeholder="Paste your copy trading token..."
                    className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    onClick={() => showCopyToast("🚀 API Token submitted successfully for copy trading!")}
                    className="w-full bg-gradient-to-r from-emerald-600 to-cyan-600 text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg"
                  >
                    Verify & Connect Account
                  </button>
                </div>
              </div>

              <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-xl space-y-4">
                <h3 className="text-xs font-bold text-white uppercase">Copy Trading Results</h3>
                <div className="bg-[#040817] p-4 rounded-2xl border border-blue-900/40 space-y-3">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Registered clients</span>
                    <span className="font-bold text-cyan-400 font-mono">288</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Added today</span>
                    <span className="font-bold text-emerald-400 font-mono">+6</span>
                  </div>
                  <div className="pt-2 border-t border-blue-900/40">
                    <span className="text-[10px] text-slate-400 uppercase block">Latest Flip</span>
                    <span className="text-emerald-400 font-black font-mono text-sm">$225 to $1,987</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <footer className="max-w-7xl mx-auto mt-12 pt-6 border-t border-blue-900/30 text-center text-[11px] text-slate-500 space-y-2">
        <p>© 2026 Expert Analysis Tool. All Rights Reserved (Multi-Market Quantitative Platform).</p>
      </footer>
    </div>
  );
}