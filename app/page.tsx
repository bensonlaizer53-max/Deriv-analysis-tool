"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Activity,
  TrendingUp,
  Zap,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Copy,
  Check,
  BarChart3,
  PieChart,
  Eye
} from "lucide-react";

interface SignalData {
  status: string;
  symbol: string;
  totalTicks: number;
  analysis: {
    evenPercentage: string;
    oddPercentage: string;
    overPercentage: string;
    underPercentage: string;
    digitFrequency: Record<number, number>;
  };
  aiRecommendation: {
    action: string;
    target: string;
    confidenceScore: string;
    highProbabilityEdge: boolean;
    reason: string;
  };
}

export default function SignalDashboard() {
  const [email, setEmail] = useState("bensonlaizer53@gmail.com");
  const [symbol, setSymbol] = useState("1HZ100V");
  const [ticksCount, setTicksCount] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SignalData | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSignals = async () => {
    try {
      setLoading(true);
      const res = await fetch(
        `/api/signals?email=${encodeURIComponent(email)}&symbol=${symbol}&ticks=${ticksCount}`
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Failed to fetch signals", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    if (autoRefresh) {
      timerRef.current = setInterval(fetchSignals, 2500);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [symbol, ticksCount, autoRefresh]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 p-4 md:p-8 font-sans">
      {/* Top Navigation Bar */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pb-6 border-b border-[#152454] gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-cyan-400">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              LizyTrade AI Signal Engine
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                Pro Live
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Uchambuzi wa namba kwa Synthetic Indices na Bots za LizyTrade
            </p>
          </div>
        </div>

        {/* User Badge & Status */}
        <div className="flex items-center gap-3 bg-[#0d1838] border border-[#152454] px-4 py-2 rounded-2xl text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <div className="font-mono">
            <span className="text-slate-400 block text-[10px]">VERIFIED USER:</span>
            <span className="text-slate-200 font-bold">{email}</span>
          </div>
        </div>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Controls & Configuration */}
        <div className="space-y-6">
          <div className="bg-[#0d1838] border border-[#152454] rounded-3xl p-6 shadow-xl space-y-5">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Mipangilio ya Soko
            </h2>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Chagua Synthetic Index:
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-[#070d1e] border border-[#152454] rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="1HZ100V">Volatility 100 (1s) Index</option>
                <option value="R_100">Volatility 100 Index</option>
                <option value="1HZ75V">Volatility 75 (1s) Index</option>
                <option value="R_75">Volatility 75 Index</option>
                <option value="1HZ50V">Volatility 50 (1s) Index</option>
                <option value="R_50">Volatility 50 Index</option>
                <option value="1HZ25V">Volatility 25 (1s) Index</option>
                <option value="R_25">Volatility 25 Index</option>
                <option value="1HZ10V">Volatility 10 (1s) Index</option>
                <option value="R_10">Volatility 10 Index</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                Idadi ya Ticks za Kuchambua:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTicksCount(count)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${ticksCount === count
                        ? "bg-blue-600 border-blue-400 text-white shadow-lg shadow-blue-600/30"
                        : "bg-[#070d1e] border-[#152454] text-slate-400 hover:text-white"
                      }`}
                  >
                    {count} Ticks
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-[#152454] flex items-center justify-between">
              <span className="text-xs text-slate-300">Uchambuzi wa Moja kwa Moja</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${autoRefresh
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
              >
                <RefreshCw className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "Auto ON" : "Paused"}
              </button>
            </div>
          </div>

          {/* Quick Helper for Lizytrade Bots */}
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-500/20 rounded-3xl p-6">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4" />
              Matumizi kwenye Bots
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Angalia <strong>AI Live Signal</strong> hapa kando, kisha weka tarakimu ya <em>Prediction/Barrier</em> au aina ya trade (Differs/Even/Odd) kwenye bot yako iliyo wazi kwenye <strong>lizytrade.site</strong>.
            </p>
          </div>
        </div>

        {/* Center & Right Column: Live Signal & Matrix Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Signal Card */}
          <div className="bg-[#0d1838] border border-[#152454] rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-[#152454]">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="text-sm font-bold text-white uppercase">Mwelekeo wa AI Signal</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Imesasishwa: {lastUpdated || "Inapakia..."}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Action */}
              <div className="bg-[#070d1e] border border-[#152454] rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase block">Mapendekezo</span>
                <span className={`text-xl font-black mt-1 block ${data?.aiRecommendation.highProbabilityEdge ? "text-emerald-400" : "text-amber-400"
                  }`}>
                  {data?.aiRecommendation.action || "ANALYZING..."}
                </span>
              </div>

              {/* Target / Prediction */}
              <div className="bg-[#070d1e] border border-[#152454] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block">Prediction / Target</span>
                  <span className="text-xl font-black text-cyan-400 mt-1 block font-mono">
                    {data?.aiRecommendation.target || "--"}
                  </span>
                </div>
                {data?.aiRecommendation.target && (
                  <button
                    onClick={() => copyToClipboard(data.aiRecommendation.target.replace("DIGIT ", ""))}
                    className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-all"
                    title="Copy Prediction"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Confidence Score */}
              <div className="bg-[#070d1e] border border-[#152454] rounded-2xl p-4">
                <span className="text-[11px] font-semibold text-slate-400 uppercase block">Uhakika (Confidence)</span>
                <span className="text-xl font-black text-blue-400 mt-1 block font-mono">
                  {data?.aiRecommendation.confidenceScore || "--"}
                </span>
              </div>
            </div>

            {/* AI Explanation Reason */}
            <div className="mt-4 bg-[#070d1e]/60 border border-[#152454] rounded-2xl p-4">
              <span className="text-[11px] font-bold text-slate-400 uppercase block mb-1">Sababu ya Kiufundi:</span>
              <p className="text-xs text-slate-300 italic">
                {data?.aiRecommendation.reason || "Inakusanya ticks na kuhesabu probabilities..."}
              </p>
            </div>
          </div>

          {/* Digit Frequency Breakdown (0 to 9) */}
          <div className="bg-[#0d1838] border border-[#152454] rounded-3xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Mzunguko wa Tarakimu (Digit Statistics 0 - 9)
            </h3>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: 10 }).map((_, digit) => {
                const pct = data?.analysis.digitFrequency[digit] || 0;
                const isLowest = pct <= 7;
                const isHighest = pct >= 14;

                return (
                  <div
                    key={digit}
                    className={`border rounded-2xl p-2.5 text-center transition-all ${isLowest
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : isHighest
                          ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                          : "bg-[#070d1e] border-[#152454] text-slate-300"
                      }`}
                  >
                    <span className="text-sm font-black block">{digit}</span>
                    <span className="text-[11px] font-mono block mt-0.5">{pct}%</span>
                  </div>
                );
              })}
            </div>

            {/* Even vs Odd & Over vs Under Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-[#152454]">
              {/* Even vs Odd */}
              <div className="bg-[#070d1e] border border-[#152454] rounded-2xl p-4">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-cyan-400">EVEN: {data?.analysis.evenPercentage || "0%"}</span>
                  <span className="text-purple-400">ODD: {data?.analysis.oddPercentage || "0%"}</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-500"
                    style={{ width: data?.analysis.evenPercentage || "50%" }}
                  />
                  <div
                    className="bg-purple-500 h-full transition-all duration-500"
                    style={{ width: data?.analysis.oddPercentage || "50%" }}
                  />
                </div>
              </div>

              {/* Over vs Under */}
              <div className="bg-[#070d1e] border border-[#152454] rounded-2xl p-4">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-blue-400">UNDER (0-4): {data?.analysis.underPercentage || "0%"}</span>
                  <span className="text-emerald-400">OVER (5-9): {data?.analysis.overPercentage || "0%"}</span>
                </div>
                <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{ width: data?.analysis.underPercentage || "50%" }}
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: data?.analysis.overPercentage || "50%" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}