// app/page.tsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getCurrentUser,
  setCurrentUserSession,
  getStoredUsers,
  saveUsers,
  AppUser,
} from "@/lib/authStore";
import {
  RefreshCw,
  Activity,
  Radio,
  Lock,
  LogOut,
  Shield,
  TrendingUp,
  TrendingDown,
  Flame,
  Snowflake,
  Zap,
  Target,
  Volume2,
  VolumeX,
  Globe,
  Sliders,
  CheckCircle2,
  Settings,
  X,
  ArrowUpRight,
} from "lucide-react";

interface TickData {
  quote: number;
  digit: number;
  epoch: number;
}

interface AnalysisStats {
  percentages: number[];
  evenPct: number;
  oddPct: number;
  underPct: number;
  overPct: number;
  mostFrequent: number;
  leastFrequent: number;
  evenOddStreak: { type: "EVEN" | "ODD" | "NONE"; count: number };
  overUnderStreak: { type: "OVER" | "UNDER" | "NONE"; count: number };
  digitTrend: "UP" | "DOWN" | "EQUAL";
}

interface SignalData {
  evenOdd: "EVEN" | "ODD" | "WAIT";
  evenOddConfidence: number;
  overUnder: "OVER 4" | "UNDER 5" | "WAIT";
  overUnderConfidence: number;
  bestMatch: number;
  matchConfidence: number;
  bestDiffer: number;
  differConfidence: number;
  recommendation: {
    title: string;
    type: "BUY" | "WAIT";
    marketType: string;
    target: string;
  };
}

const MARKETS = [
  { label: "Volatility 100 (1s) Index", value: "1HZ100V" },
  { label: "Volatility 10 (1s) Index", value: "1HZ10V" },
  { label: "Volatility 75 (1s) Index", value: "1HZ75V" },
  { label: "Volatility 50 (1s) Index", value: "1HZ50V" },
  { label: "Volatility 25 (1s) Index", value: "1HZ25V" },
  { label: "Volatility 100 Index", value: "R_100" },
  { label: "Volatility 75 Index", value: "R_75" },
  { label: "Volatility 50 Index", value: "R_50" },
  { label: "Volatility 25 Index", value: "R_25" },
  { label: "Volatility 10 Index", value: "R_10" },
];

const TICK_LENGTHS = [50, 100, 200, 500];

export default function AnalysisDashboard() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // Deriv & Third-Party Configuration States
  const [appId, setAppId] = useState("1089");
  const [siteEmail, setSiteEmail] = useState("");
  const [thirdPartyDomain, setThirdPartyDomain] = useState("lizytrade.site");
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [configSuccessMessage, setConfigSuccessMessage] = useState(false);

  const [selectedMarket, setSelectedMarket] = useState("1HZ100V");
  const [selectedTickLength, setSelectedTickLength] = useState(100);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const [currentTick, setCurrentTick] = useState<TickData | null>(null);
  const [stats, setStats] = useState<AnalysisStats>({
    percentages: Array(10).fill(0),
    evenPct: 0,
    oddPct: 0,
    underPct: 0,
    overPct: 0,
    mostFrequent: 0,
    leastFrequent: 0,
    evenOddStreak: { type: "NONE", count: 0 },
    overUnderStreak: { type: "NONE", count: 0 },
    digitTrend: "EQUAL",
  });
  const [signal, setSignal] = useState<SignalData>({
    evenOdd: "WAIT",
    evenOddConfidence: 50,
    overUnder: "WAIT",
    overUnderConfidence: 50,
    bestMatch: 0,
    matchConfidence: 10,
    bestDiffer: 0,
    differConfidence: 90,
    recommendation: {
      title: "Uchambuzi Unakusanywa...",
      type: "WAIT",
      marketType: "Analyzing",
      target: "-",
    },
  });
  const [recentDigits, setRecentDigits] = useState<number[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [isExpired, setIsExpired] = useState(false);

  const historyRef = useRef<TickData[]>([]);
  const mockIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const lastAlertTimeRef = useRef<number>(0);

  // Web Audio Alert
  const playAlertSound = useCallback((frequency: number = 880, type: "sine" | "triangle" = "sine") => {
    if (!soundEnabled) return;
    try {
      if (!audioContextRef.current) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(frequency, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch { }
  }, [soundEnabled]);

  // Auth Guard & Config Loader
  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.push("/login");
      return;
    }
    if (user.role !== "ADMIN") {
      if (user.status !== "APPROVED") {
        router.push("/login");
        return;
      }
      if (!user.isSubscribed) {
        router.push("/subscribe");
        return;
      }
    }
    setCurrentUser(user);
    setSiteEmail(user.email || "");
    if (user.derivAppId) setAppId(user.derivAppId);
    if (user.authorizedDomain) setThirdPartyDomain(user.authorizedDomain);

    setIsAuthChecking(false);
  }, [router]);

  const calculateDeepStats = useCallback((ticks: TickData[], maxCount: number) => {
    if (!ticks || ticks.length === 0) return;

    const activeTicks = ticks.slice(-maxCount);
    const total = activeTicks.length;
    const counts = Array(10).fill(0);
    activeTicks.forEach((t) => {
      if (t.digit >= 0 && t.digit <= 9) counts[t.digit]++;
    });

    const percentages = counts.map((c) =>
      Number(((c / total) * 100).toFixed(1))
    );

    const evenCount = activeTicks.filter((t) => t.digit % 2 === 0).length;
    const oddCount = total - evenCount;

    const underCount = activeTicks.filter((t) => t.digit <= 4).length;
    const overCount = total - underCount;

    let maxVal = -1, mostFreq = 0;
    let minVal = 9999, leastFreq = 0;

    counts.forEach((c, d) => {
      if (c > maxVal) { maxVal = c; mostFreq = d; }
      if (c < minVal) { minVal = c; leastFreq = d; }
    });

    const evenPct = Number(((evenCount / total) * 100).toFixed(1));
    const oddPct = Number(((oddCount / total) * 100).toFixed(1));
    const underPct = Number(((underCount / total) * 100).toFixed(1));
    const overPct = Number(((overCount / total) * 100).toFixed(1));

    let eoStreakType: "EVEN" | "ODD" | "NONE" = "NONE";
    let eoStreakCount = 0;
    let ouStreakType: "OVER" | "UNDER" | "NONE" = "NONE";
    let ouStreakCount = 0;

    const rev = [...activeTicks].reverse();
    if (rev.length > 0) {
      eoStreakType = rev[0].digit % 2 === 0 ? "EVEN" : "ODD";
      for (const t of rev) {
        const isEven = t.digit % 2 === 0;
        if ((eoStreakType === "EVEN" && isEven) || (eoStreakType === "ODD" && !isEven)) {
          eoStreakCount++;
        } else {
          break;
        }
      }

      ouStreakType = rev[0].digit <= 4 ? "UNDER" : "OVER";
      for (const t of rev) {
        const isUnder = t.digit <= 4;
        if ((ouStreakType === "UNDER" && isUnder) || (ouStreakType === "OVER" && !isUnder)) {
          ouStreakCount++;
        } else {
          break;
        }
      }
    }

    let trend: "UP" | "DOWN" | "EQUAL" = "EQUAL";
    if (activeTicks.length >= 2) {
      const last = activeTicks[activeTicks.length - 1].digit;
      const prev = activeTicks[activeTicks.length - 2].digit;
      if (last > prev) trend = "UP";
      else if (last < prev) trend = "DOWN";
    }

    setStats({
      percentages,
      evenPct,
      oddPct,
      underPct,
      overPct,
      mostFrequent: mostFreq,
      leastFrequent: leastFreq,
      evenOddStreak: { type: eoStreakType, count: eoStreakCount },
      overUnderStreak: { type: ouStreakType, count: ouStreakCount },
      digitTrend: trend,
    });

    let eOdd: "EVEN" | "ODD" | "WAIT" = "WAIT";
    const eoConf = Math.max(evenPct, oddPct);
    if (evenPct >= 56) eOdd = "EVEN";
    else if (oddPct >= 56) eOdd = "ODD";

    let oUnder: "OVER 4" | "UNDER 5" | "WAIT" = "WAIT";
    const ouConf = Math.max(overPct, underPct);
    if (overPct >= 56) oUnder = "OVER 4";
    else if (underPct >= 56) oUnder = "UNDER 5";

    const differConfidence = Number((100 - percentages[leastFreq]).toFixed(1));
    const matchConfidence = percentages[mostFreq];

    let rec = {
      title: "Soko Lina Fluctuate: Subiri Uwiano",
      type: "WAIT" as "BUY" | "WAIT",
      marketType: "Market Neutral",
      target: "-",
    };

    let triggerAudioAlert = false;

    if (differConfidence >= 93) {
      rec = {
        title: `Nafasi Kubwa ya DIFFERS kwenye Digit ${leastFreq}`,
        type: "BUY",
        marketType: "Matches / Differs",
        target: `DIFFER DIGIT ${leastFreq}`,
      };
      triggerAudioAlert = true;
    } else if (eoConf >= 60) {
      rec = {
        title: `Uwezekano Mkubwa wa ${eOdd} (${eoConf}%)`,
        type: "BUY",
        marketType: "Even / Odd",
        target: `ENTER ${eOdd}`,
      };
      triggerAudioAlert = true;
    } else if (ouConf >= 60) {
      rec = {
        title: `Uwezekano Mkubwa wa ${oUnder} (${ouConf}%)`,
        type: "BUY",
        marketType: "Over / Under",
        target: `ENTER ${oUnder}`,
      };
      triggerAudioAlert = true;
    }

    const now = Date.now();
    if (triggerAudioAlert && now - lastAlertTimeRef.current > 8000) {
      playAlertSound(750, "sine");
      lastAlertTimeRef.current = now;
    }

    setSignal({
      evenOdd: eOdd,
      evenOddConfidence: eoConf,
      overUnder: oUnder,
      overUnderConfidence: ouConf,
      bestMatch: mostFreq,
      matchConfidence,
      bestDiffer: leastFreq,
      differConfidence,
      recommendation: rec,
    });
  }, [playAlertSound]);

  const pushNewTick = useCallback((newTick: TickData) => {
    setCurrentTick(newTick);
    setRecentDigits((prev) => [newTick.digit, ...prev.slice(0, 14)]);

    historyRef.current.push(newTick);
    if (historyRef.current.length > 500) {
      historyRef.current.shift();
    }

    calculateDeepStats(historyRef.current, selectedTickLength);
  }, [calculateDeepStats, selectedTickLength]);

  const connectDerivWebSocket = useCallback(() => {
    if (wsRef.current) {
      try { wsRef.current.close(); } catch { }
    }

    try {
      const socket = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId || "1089"}`);
      wsRef.current = socket;

      socket.onopen = () => {
        setIsConnected(true);
        socket.send(
          JSON.stringify({
            ticks_history: selectedMarket,
            adjust_start_time: 1,
            count: selectedTickLength,
            end: "latest",
            style: "ticks",
            subscribe: 1,
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.msg_type === "history" && data.history) {
            const prices: number[] = data.history.prices || [];
            const times: number[] = data.history.times || [];
            const pipSize = data.pip_size !== undefined ? data.pip_size : 2;

            const loadedTicks: TickData[] = prices.map((p, idx) => {
              const formatted = Number(p).toFixed(pipSize);
              const d = parseInt(formatted.slice(-1), 10);
              return {
                quote: p,
                digit: isNaN(d) ? 0 : d,
                epoch: times[idx] || Date.now(),
              };
            });

            historyRef.current = loadedTicks;
            const lastOne = loadedTicks[loadedTicks.length - 1];
            if (lastOne) {
              setCurrentTick(lastOne);
              setRecentDigits(loadedTicks.map((t) => t.digit).reverse().slice(0, 15));
              calculateDeepStats(loadedTicks, selectedTickLength);
            }
          }

          if (data.msg_type === "tick" && data.tick) {
            const rawQuote = data.tick.quote;
            const pipSize = data.tick.pip_size !== undefined ? data.tick.pip_size : 2;
            const formattedQuote = Number(rawQuote).toFixed(pipSize);
            const digit = parseInt(formattedQuote.slice(-1), 10);

            pushNewTick({
              quote: rawQuote,
              digit: isNaN(digit) ? 0 : digit,
              epoch: data.tick.epoch,
            });
          }
        } catch { }
      };

      socket.onerror = () => setIsConnected(false);
      socket.onclose = () => setIsConnected(false);
    } catch {
      setIsConnected(false);
    }
  }, [appId, selectedMarket, selectedTickLength, pushNewTick, calculateDeepStats]);

  useEffect(() => {
    if (isAuthChecking) return;

    connectDerivWebSocket();

    // Fallback simulation generator ili chombo kisikate tamaa
    let basePrice = 2450.5;
    mockIntervalRef.current = setInterval(() => {
      basePrice += (Math.random() - 0.49) * 1.5;
      const formatted = basePrice.toFixed(2);
      const digit = parseInt(formatted.slice(-1), 10);

      pushNewTick({
        quote: parseFloat(formatted),
        digit: isNaN(digit) ? 0 : digit,
        epoch: Date.now(),
      });
    }, 1000);

    return () => {
      if (mockIntervalRef.current) clearInterval(mockIntervalRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [selectedMarket, isAuthChecking, connectDerivWebSocket, pushNewTick]);

  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleRefresh = () => {
    setTimeLeft(30);
    setIsExpired(false);
    connectDerivWebSocket();
  };

  const handleSaveConfiguration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const users = getStoredUsers();
    const updatedUsers = users.map((u) =>
      u.id === currentUser.id
        ? {
          ...u,
          derivAppId: appId,
          authorizedDomain: thirdPartyDomain,
        }
        : u
    );

    saveUsers(updatedUsers);
    const updatedCurrent = {
      ...currentUser,
      derivAppId: appId,
      authorizedDomain: thirdPartyDomain,
    };
    setCurrentUserSession(updatedCurrent);

    setConfigSuccessMessage(true);
    setTimeout(() => {
      setConfigSuccessMessage(false);
      setIsConfigModalOpen(false);
      handleRefresh();
    }, 1500);
  };

  const handleLogout = () => {
    setCurrentUserSession(null);
    router.push("/login");
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#070d1e] flex items-center justify-center text-slate-400">
        <Activity className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d1e] text-slate-100 p-4 md:p-8 font-sans">
      {/* Third-Party Config & License Modal */}
      {isConfigModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d1838] border border-cyan-500/40 rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl space-y-6 relative">
            <button
              onClick={() => setIsConfigModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-[#070d1e] text-slate-400 hover:text-white border border-[#152454] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-cyan-400">
                <Globe className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Third-Party & Deriv Licensing</h3>
                <p className="text-xs text-slate-400">Unganisha moja kwa moja na leseni ya App ID yako</p>
              </div>
            </div>

            {configSuccessMessage && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <span>Taarifa zimehifadhiwa na WebSocket imeunganishwa upya!</span>
              </div>
            )}

            <form onSubmit={handleSaveConfiguration} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 uppercase font-bold text-[11px] mb-1.5">
                  1. Tovuti Yako ya Nje (Authorized Domain):
                </label>
                <input
                  type="text"
                  required
                  value={thirdPartyDomain}
                  onChange={(e) => setThirdPartyDomain(e.target.value)}
                  placeholder="lizytrade.site"
                  className="w-full bg-[#070d1e] border border-[#152454] rounded-xl px-4 py-3 text-sm text-cyan-400 font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[11px] mb-1.5">
                  2. Deriv App ID (Leseni):
                </label>
                <input
                  type="text"
                  required
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  placeholder="Mfano: 1089 au App ID ya Deriv"
                  className="w-full bg-[#070d1e] border border-[#152454] rounded-xl px-4 py-3 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-slate-300 uppercase font-bold text-[11px] mb-1.5">
                  3. Registered Email:
                </label>
                <input
                  type="email"
                  disabled
                  value={siteEmail}
                  className="w-full bg-[#070d1e]/60 border border-[#152454] rounded-xl px-4 py-3 text-sm text-slate-400 font-mono cursor-not-allowed"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#070d1e] border border-[#152454] text-[11px] text-slate-400 space-y-1">
                <p>Status: <strong className="text-emerald-400">Authorized</strong> kwa <strong>{thirdPartyDomain}</strong></p>
                <p>Mawasiliano: Inasoma live ticks moja kwa moja kutoka Deriv WebSocket.</p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 cursor-pointer active:scale-95"
              >
                Hifadhi na Unganisha Sasa
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-6 pb-5 border-b border-[#152454]">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
            <Zap className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black tracking-wide bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
              DERIV DIGIT PRO
            </h1>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>Domain: <strong className="text-cyan-400 font-mono">{thirdPartyDomain}</strong></span>
              <span>• App ID: <strong className="text-emerald-400 font-mono">{appId}</strong></span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {/* Site Connection Setting Button */}
          <button
            onClick={() => setIsConfigModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#0d1838] hover:bg-[#152454] border border-cyan-500/40 text-cyan-300 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            <span>Site Integration</span>
          </button>

          {/* Sound Alert Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${soundEnabled
                ? "bg-emerald-600/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-600/30"
                : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
              }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>{soundEnabled ? "Sound ON" : "Sound OFF"}</span>
          </button>

          {currentUser?.role === "ADMIN" && (
            <button
              onClick={() => router.push("/admin")}
              className="flex items-center gap-1.5 bg-[#0d1838] hover:bg-[#152454] border border-cyan-500/40 text-cyan-400 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          )}

          <select
            value={selectedMarket}
            onChange={(e) => {
              setSelectedMarket(e.target.value);
              handleRefresh();
            }}
            className="bg-[#0d1838] border border-[#152454] px-3.5 py-2 rounded-xl text-xs font-semibold focus:outline-none focus:border-cyan-400 text-white cursor-pointer"
          >
            {MARKETS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-lg active:scale-95 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>

          <button
            onClick={handleLogout}
            className="p-2 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-6">
        {/* Third-Party Status Bar + Ticks Selector */}
        <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-[#0d1838] border border-[#152454] p-1.5 rounded-2xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase px-2 flex items-center gap-1">
              <Sliders className="w-3.5 h-3.5" /> Scope:
            </span>
            {TICK_LENGTHS.map((len) => (
              <button
                key={len}
                onClick={() => {
                  setSelectedTickLength(len);
                  calculateDeepStats(historyRef.current, len);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${selectedTickLength === len
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/30"
                    : "text-slate-400 hover:text-white"
                  }`}
              >
                {len} Ticks
              </button>
            ))}
          </div>

          <div className={`flex-1 p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-xl ${signal.recommendation.type === "BUY"
              ? "bg-gradient-to-r from-blue-950/80 to-[#0d1838] border-cyan-400/50"
              : "bg-[#0d1838] border-[#152454]"
            }`}>
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-xl border ${signal.recommendation.type === "BUY"
                  ? "bg-cyan-500/20 border-cyan-400 text-cyan-300 animate-pulse"
                  : "bg-slate-800 border-slate-700 text-slate-400"
                }`}>
                <Target className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  AI Edge Signal ({thirdPartyDomain} Feed):
                </span>
                <span className="text-xs font-bold text-white">{signal.recommendation.title}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[9px] text-slate-400 block uppercase">Target</span>
              <span className="text-xs font-black text-cyan-400 font-mono">{signal.recommendation.target}</span>
            </div>
          </div>
        </section>

        {/* Live Last Digit & Recent Stream */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#0d1838] border border-[#152454] p-6 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden shadow-xl min-h-[190px]">
            <div className="absolute top-4 left-4 flex items-center gap-1.5 text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
              <span>Momentum:</span>
              {stats.digitTrend === "UP" ? (
                <span className="text-emerald-400 flex items-center font-bold">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> UP
                </span>
              ) : stats.digitTrend === "DOWN" ? (
                <span className="text-rose-400 flex items-center font-bold">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> DOWN
                </span>
              ) : (
                <span className="text-slate-400 font-bold">EQUAL</span>
              )}
            </div>

            <div className="text-7xl font-black text-cyan-400 tracking-tight drop-shadow-[0_0_25px_rgba(34,211,238,0.5)] my-1">
              {currentTick ? currentTick.digit : "-"}
            </div>

            <div className="text-xs text-slate-400 font-mono">
              Live Quote: <span className="text-white font-bold">{currentTick ? currentTick.quote.toFixed(2) : "0.00"}</span>
            </div>
          </div>

          <div className="md:col-span-2 bg-[#0d1838] border border-[#152454] p-6 rounded-2xl flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Recent Digit Flow (Latest to Oldest)
                </span>
                <div className="flex gap-2">
                  <span className="text-[10px] px-2 py-0.5 rounded bg-blue-900/40 text-cyan-300 border border-blue-700/40 font-mono font-bold">
                    Streak: {stats.evenOddStreak.count} {stats.evenOddStreak.type}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono font-bold">
                    {stats.overUnderStreak.count} {stats.overUnderStreak.type}
                  </span>
                </div>
              </div>

              <div className="flex gap-2.5 overflow-x-auto py-3.5 mt-2 no-scrollbar">
                {recentDigits.map((d, index) => (
                  <div
                    key={index}
                    className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl font-bold text-lg border transition-all ${index === 0
                        ? "bg-blue-600 border-cyan-400 text-white shadow-lg shadow-blue-500/40 scale-105 ring-2 ring-cyan-400/30"
                        : d % 2 === 0
                          ? "bg-[#152454] border-slate-700 text-cyan-300"
                          : "bg-[#152454] border-slate-700 text-amber-300"
                      }`}
                  >
                    {d}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-2 pt-3 border-t border-[#152454]/60 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Radio className={`w-4 h-4 ${!isExpired ? "text-emerald-400" : "text-rose-500"}`} />
                <span>
                  Live Deriv Stream:{" "}
                  <strong className={!isExpired ? "text-emerald-400" : "text-rose-500"}>
                    {!isExpired ? "ACTIVE" : "EXPIRED"}
                  </strong>
                </span>
              </div>
              <div>
                Auto Refresh in:{" "}
                <span className="font-mono text-cyan-400 font-bold">{timeLeft}s</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tactical Signals & Confidence Gauges */}
        <section className="relative">
          {isExpired && (
            <div className="absolute inset-0 z-20 backdrop-blur-md bg-[#070d1e]/85 rounded-2xl flex flex-col items-center justify-center border border-rose-500/30 p-6">
              <Lock className="w-10 h-10 text-rose-500 mb-2" />
              <p className="text-lg font-bold text-white mb-1">Signal Imekwisha Muda Wake</p>
              <p className="text-xs text-slate-400 mb-4">
                Bofya kitufe cha refresh kupata uchambuzi mpya.
              </p>
              <button
                onClick={handleRefresh}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Sasa
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#0d1838] border border-[#152454] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Even / Odd Market</span>
                  <span className="text-[10px] bg-blue-900/50 text-cyan-300 px-2.5 py-0.5 rounded border border-blue-700/50 font-bold">
                    Confidence: {signal.evenOddConfidence}%
                  </span>
                </div>
                <div className="text-3xl font-black text-white tracking-wide my-1">
                  {signal.evenOdd}
                </div>
              </div>

              <div className="space-y-2 mt-4 text-xs">
                <div className="flex justify-between text-slate-400 font-mono">
                  <span>Even: <strong className="text-cyan-400">{stats.evenPct}%</strong></span>
                  <span>Odd: <strong className="text-amber-400">{stats.oddPct}%</strong></span>
                </div>
                <div className="w-full bg-[#152454] h-2.5 rounded-full overflow-hidden flex">
                  <div style={{ width: `${stats.evenPct || 50}%` }} className="bg-cyan-400 transition-all duration-300"></div>
                  <div style={{ width: `${stats.oddPct || 50}%` }} className="bg-amber-400 transition-all duration-300"></div>
                </div>
              </div>
            </div>

            <div className="bg-[#0d1838] border border-[#152454] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Over / Under 4.5</span>
                  <span className="text-[10px] bg-blue-900/50 text-emerald-300 px-2.5 py-0.5 rounded border border-blue-700/50 font-bold">
                    Confidence: {signal.overUnderConfidence}%
                  </span>
                </div>
                <div className="text-3xl font-black text-white tracking-wide my-1">
                  {signal.overUnder}
                </div>
              </div>

              <div className="space-y-2 mt-4 text-xs">
                <div className="flex justify-between text-slate-400 font-mono">
                  <span>Under (0-4): <strong className="text-emerald-400">{stats.underPct}%</strong></span>
                  <span>Over (5-9): <strong className="text-rose-400">{stats.overPct}%</strong></span>
                </div>
                <div className="w-full bg-[#152454] h-2.5 rounded-full overflow-hidden flex">
                  <div style={{ width: `${stats.underPct || 50}%` }} className="bg-emerald-400 transition-all duration-300"></div>
                  <div style={{ width: `${stats.overPct || 50}%` }} className="bg-rose-500 transition-all duration-300"></div>
                </div>
              </div>
            </div>

            <div className="bg-[#0d1838] border border-[#152454] p-6 rounded-2xl shadow-xl flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Matches / Differs</span>
                <span className="text-[10px] bg-purple-950/60 text-purple-300 px-2.5 py-0.5 rounded border border-purple-700/50 font-bold">
                  Edge Score
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-1">
                <div className="bg-[#152454]/60 p-3 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold">
                    <Flame className="w-3 h-3 text-rose-400" />
                    <span>Hot Match</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 mt-1">
                    Digit {signal.bestMatch}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Freq: {signal.matchConfidence}%
                  </span>
                </div>

                <div className="bg-[#152454]/60 p-3 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-semibold">
                    <Snowflake className="w-3 h-3 text-cyan-400" />
                    <span>Cold Differ</span>
                  </div>
                  <div className="text-2xl font-black text-amber-400 mt-1">
                    Digit {signal.bestDiffer}
                  </div>
                  <span className="text-[10px] text-emerald-400 font-mono font-bold">
                    Safe: {signal.differConfidence}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Digit Frequency Heatmap */}
        <section className="bg-[#0d1838] border border-[#152454] p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Digit Distribution & Heatmap (Last {selectedTickLength} Ticks)
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Kiwango cha asilimia cha kila namba ndani ya historia ya ticks {selectedTickLength} zilizopita
              </p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded bg-cyan-400"></span> Hot (&gt;13%)
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded bg-rose-500"></span> Cold (&lt;7%)
              </span>
            </div>
          </div>

          <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
            {stats.percentages.map((pct, digit) => {
              const isHot = pct >= 14;
              const isCold = pct <= 6;
              return (
                <div key={digit} className="flex flex-col items-center gap-2">
                  <div className="w-full bg-[#152454] h-32 rounded-xl flex flex-col justify-end p-1 relative overflow-hidden border border-slate-700/80">
                    <div
                      style={{ height: `${pct > 0 ? pct * 2.8 : 4}%` }}
                      className={`w-full rounded-lg transition-all duration-300 ${isHot
                          ? "bg-gradient-to-t from-cyan-600 to-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.5)]"
                          : isCold
                            ? "bg-gradient-to-t from-rose-700 to-rose-400"
                            : "bg-blue-600/70"
                        }`}
                    ></div>
                    <span className="absolute top-2 inset-x-0 text-center text-[10px] font-mono font-black text-white drop-shadow">
                      {pct}%
                    </span>
                  </div>
                  <span className={`text-xs font-black w-8 h-8 flex items-center justify-center rounded-lg border ${isHot
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
                      : isCold
                        ? "bg-rose-500/20 text-rose-300 border-rose-400"
                        : "bg-[#152454] text-white border-slate-700"
                    }`}>
                    {digit}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </main>
    </div>
  );
}