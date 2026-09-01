"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  ShieldCheck,
  Lock,
  CheckCircle2,
  TrendingUp,
  Activity,
  BarChart3,
  Sliders,
  Copy,
  Check,
  RefreshCw,
  Radio,
  UserCheck,
  CreditCard,
  Volume2,
  VolumeX,
  ExternalLink
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

export default function ProfessionalToolDashboard() {
  // Authentication & Subscription States
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [email, setEmail] = useState("bensonlaizer53@gmail.com");
  const [derivAccountId, setDerivAccountId] = useState("CR9182345");
  const [accessCode, setAccessCode] = useState("");
  const [subType, setSubType] = useState<"PRO_VIP" | "TRIAL" | "EXPIRED">("PRO_VIP");
  const [expiryDays, setExpiryDays] = useState(30);

  // Signal & Engine States
  const [symbol, setSymbol] = useState("1HZ100V");
  const [ticksCount, setTicksCount] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundAlert, setSoundAlert] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SignalData | null>(null);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Kuingia kwenye mfumo (Verify Subscription & Deriv ID)
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !derivAccountId) {
      alert("Tafadhali weka Barua Pepe na Deriv Account ID!");
      return;
    }
    setIsAuthenticated(true);
  };

  const fetchSignals = async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await fetch(
        `/api/signals?email=${encodeURIComponent(email)}&symbol=${symbol}&ticks=${ticksCount}`
      );
      const result = await res.json();
      if (result.status === "success") {
        setData(result);
        setLastUpdated(new Date().toLocaleTimeString());

        // Cheza sauti ya alert iwapo kuna High Probability Edge
        if (result.aiRecommendation.highProbabilityEdge && soundAlert) {
          playAlertSound();
        }
      }
    } catch (e) {
      console.error("Signal Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  };

  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch { }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchSignals();
      if (autoRefresh) {
        timerRef.current = setInterval(fetchSignals, 2000);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isAuthenticated, symbol, ticksCount, autoRefresh]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 1. UKURASA WA KUSAJILI NA KUINGIA (PRO SUBSCRIPTION GATE)
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#040817] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-[#0a1128]/90 border border-blue-900/40 backdrop-blur-2xl rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Glowing Top bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500" />

          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex p-3 bg-blue-600/10 border border-blue-500/30 rounded-2xl text-cyan-400 shadow-inner">
              <Zap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">LizyTrade AI Pro</h1>
            <p className="text-xs text-slate-400">
              Uchambuzi Mahiri wa Tarakimu & Kanuni za AI kwa Tovuti ya LizyTrade
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Barua Pepe (LizyTrade / Deriv Email):
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="mfano@gmail.com"
                className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Deriv Account ID:
              </label>
              <input
                type="text"
                required
                value={derivAccountId}
                onChange={(e) => setDerivAccountId(e.target.value)}
                placeholder="mfano: CR918234 au VRTC12345"
                className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-all font-mono uppercase"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Subscription Access Key (Hiari):
              </label>
              <input
                type="password"
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="Weka VIP Key au acha wazi kwa Pro Access"
                className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-cyan-400 transition-all font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>Thibitisha & Fungua Dashibodi</span>
              </button>
            </div>
          </form>

          <div className="mt-6 pt-5 border-t border-blue-900/40 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-4 h-4" /> Deriv OAuth2 Verified
            </span>
            <span className="text-cyan-400 font-semibold">LizyTrade v2.6 Pro</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. DASHIBODI KUU YA KITAALAMU (ENTERPRISE PRO DASHBOARD)
  return (
    <div className="min-h-screen bg-[#040817] text-slate-100 p-4 md:p-8 font-sans">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pb-6 border-b border-blue-900/40 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                LizyTrade AI Signal Engine
              </h1>
              <span className="bg-gradient-to-r from-emerald-500 to-teal-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-md shadow-emerald-500/20">
                PRO ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Uchambuzi wa moja kwa moja wa Synthetic Indices kwa ajili ya Bots za <span className="text-cyan-400 font-bold">lizytrade.site</span>
            </p>
          </div>
        </div>

        {/* User License Status Card */}
        <div className="flex flex-wrap items-center gap-3 bg-[#0a1128] border border-blue-900/40 px-4 py-2.5 rounded-2xl">
          <div className="flex items-center gap-2 pr-3 border-r border-blue-900/40">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <div className="text-[11px] font-mono">
              <span className="text-slate-400 block text-[9px] uppercase">Account:</span>
              <span className="text-white font-bold">{derivAccountId}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pr-3 border-r border-blue-900/40">
            <CreditCard className="w-4 h-4 text-cyan-400" />
            <div className="text-[11px]">
              <span className="text-slate-400 block text-[9px] uppercase">Plan:</span>
              <span className="text-cyan-300 font-bold">{subType} ({expiryDays}D)</span>
            </div>
          </div>

          <button
            onClick={() => setIsAuthenticated(false)}
            className="text-[11px] text-rose-400 hover:text-rose-300 bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20 transition-all font-semibold"
          >
            Toka
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Market Controls & Integration Helper */}
        <div className="space-y-6">
          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Mipangilio ya Soko
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSoundAlert(!soundAlert)}
                  className={`p-1.5 rounded-lg border transition-all ${soundAlert ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-slate-800 border-slate-700 text-slate-500"
                    }`}
                  title="Audio Alerts"
                >
                  {soundAlert ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">
                Chagua Synthetic Index:
              </label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-medium cursor-pointer"
              >
                <option value="1HZ100V">Volatility 100 (1s) Index (Recommended)</option>
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
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">
                Sample Size (Ticks Window):
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTicksCount(count)}
                    className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${ticksCount === count
                        ? "bg-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                        : "bg-[#040817] border-blue-900/40 text-slate-400 hover:text-white"
                      }`}
                  >
                    {count} Ticks
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Auto Real-Time Feed</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${autoRefresh
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                  }`}
              >
                <RefreshCw className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "Live Active" : "Paused"}
              </button>
            </div>
          </div>

          {/* Integration Guide Box */}
          <div className="bg-gradient-to-br from-blue-950/40 to-slate-900 border border-cyan-500/20 rounded-3xl p-6 space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Muunganisho na lizytrade.site
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              1. Angalia <strong>AI Recommendation</strong> upande wa kulia.<br />
              2. Bonyeza kitufe cha <strong>Copy</strong> kwenye Prediction Target.<br />
              3. Fungua bot yako ndani ya <strong>lizytrade.site</strong> na uweke prediction hiyo kuanza biashara.
            </p>
          </div>
        </div>

        {/* Right Columns: AI Intelligence Signal Cards & Statistical Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Action Recommendation Card */}
          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-blue-900/40">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Edge Real-Time Signal
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Imesasishwa: {lastUpdated || "Inakusanya Data..."}
              </span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Action Box */}
              <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-4 relative overflow-hidden">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                  Uamuzi (Action)
                </span>
                <span className={`text-xl font-black mt-1 block tracking-tight ${data?.aiRecommendation.highProbabilityEdge ? "text-emerald-400 animate-pulse" : "text-amber-400"
                  }`}>
                  {data?.aiRecommendation.action || "ANALYZING..."}
                </span>
              </div>

              {/* Target / Prediction Box with One-Click Copy */}
              <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                    Prediction Target
                  </span>
                  <span className="text-2xl font-black text-cyan-400 mt-0.5 block font-mono">
                    {data?.aiRecommendation.target || "--"}
                  </span>
                </div>
                {data?.aiRecommendation.target && data.aiRecommendation.target !== "--" && (
                  <button
                    onClick={() => copyToClipboard(data.aiRecommendation.target.replace("DIGIT ", ""))}
                    className="p-2.5 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-cyan-300 rounded-xl transition-all cursor-pointer"
                    title="Copy Prediction"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                )}
              </div>

              {/* Confidence Score Box */}
              <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">
                  Confidence Score
                </span>
                <span className="text-2xl font-black text-blue-400 mt-0.5 block font-mono">
                  {data?.aiRecommendation.confidenceScore || "--"}
                </span>
              </div>
            </div>

            {/* Technical Reason */}
            <div className="mt-4 bg-[#040817]/80 border border-blue-900/30 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                Uchambuzi wa Kiufundi wa AI:
              </span>
              <p className="text-xs text-slate-300 italic leading-relaxed">
                {data?.aiRecommendation.reason || "Inakusanya ticks na kuhesabu probabilities za namba..."}
              </p>
            </div>
          </div>

          {/* Digit Frequency Heatmap (0 - 9) */}
          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-400" />
                Mzunguko wa Tarakimu (Digit Heatmap 0 - 9)
              </h3>
              <span className="text-[11px] text-slate-400">Ticks 100 za Mwisho</span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: 10 }).map((_, digit) => {
                const pct = data?.analysis.digitFrequency[digit] || 0;
                const isCold = pct <= 7;
                const isHot = pct >= 14;

                return (
                  <div
                    key={digit}
                    className={`border rounded-2xl p-2.5 text-center transition-all ${isCold
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-lg shadow-emerald-500/10"
                        : isHot
                          ? "bg-rose-500/10 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/10"
                          : "bg-[#040817] border-blue-900/40 text-slate-300"
                      }`}
                  >
                    <span className="text-sm font-black block font-mono">{digit}</span>
                    <span className="text-[11px] font-mono block mt-0.5">{pct}%</span>
                    <span className="text-[8px] font-bold uppercase block mt-0.5 text-slate-500">
                      {isCold ? "DIFF" : isHot ? "HOT" : "MID"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Binary Market Proportions (Even/Odd & Under/Over) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-blue-900/40">
              {/* Even vs Odd Bar */}
              <div className="bg-[#040817] border border-blue-900/40 rounded-2xl p-4">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-cyan-400">EVEN: {data?.analysis.evenPercentage || "0%"}</span>
                  <span className="text-indigo-400">ODD: {data?.analysis.oddPercentage || "0%"}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-500"
                    style={{ width: data?.analysis.evenPercentage || "50%" }}
                  />
                  <div
                    className="bg-indigo-500 h-full transition-all duration-500"
                    style={{ width: data?.analysis.oddPercentage || "50%" }}
                  />
                </div>
              </div>

              {/* Under vs Over Bar */}
              <div className="bg-[#040817] border border-blue-900/40 rounded-2xl p-4">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-blue-400">UNDER (0-4): {data?.analysis.underPercentage || "0%"}</span>
                  <span className="text-emerald-400">OVER (5-9): {data?.analysis.overPercentage || "0%"}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
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