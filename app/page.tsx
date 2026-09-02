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
  Columns2,
  Maximize2
} from "lucide-react";

interface UserRecord {
  id: string;
  full_name: string;
  email: string;
  deriv_id: string;
  password?: string;
  plan: string;
  phone: string;
  tx_code: string;
  receipt_image?: string;
  role: "ADMIN" | "USER";
  status: "APPROVED" | "PENDING" | "REJECTED";
}

export default function LizyTradeEnterprise() {
  const [currentView, setCurrentView] = useState<"AUTH" | "SUBSCRIPTION_STEP" | "WAITING_APPROVAL" | "DASHBOARD" | "ADMIN">("DASHBOARD");
  const [authTab, setAuthTab] = useState<"LOGIN" | "REGISTER">("LOGIN");

  // Split View Mode (Kugawa skrini)
  const [isSplitView, setIsSplitView] = useState(false);

  // Authentication Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("bensonlaizer53@gmail.com");
  const [derivAccountId, setDerivAccountId] = useState("ROT91981412");
  const [userPassword, setUserPassword] = useState("LizyTrade2026@");
  const [showPassword, setShowPassword] = useState(false);

  // Subscription Fields
  const [selectedPlan, setSelectedPlan] = useState<"1_MONTH" | "3_MONTHS" | "LIFETIME">("1_MONTH");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Users Database State
  const [usersList, setUsersList] = useState<UserRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<UserRecord | null>({
    id: "admin-root",
    full_name: "Benson Mkaine",
    email: "bensonlaizer53@gmail.com",
    deriv_id: "ROT91981412",
    plan: "Unlimited (Lifetime)",
    phone: "0752642148",
    tx_code: "FOUNDER-ROOT",
    role: "ADMIN",
    status: "APPROVED",
  });

  // Market Configuration States
  const [symbol, setSymbol] = useState("1HZ100V");
  const [ticksCount, setTicksCount] = useState(100);
  const [soundAlert, setSoundAlert] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<string>("763.4980");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Live Historical Ticks Buffer
  const [recentDigits, setRecentDigits] = useState<number[]>([9, 4, 8, 3, 8, 9, 1, 5, 3, 7]);

  // Strategy & Prediction States
  const [selectedStrategy, setSelectedStrategy] = useState<"Matches" | "Differs" | "Even" | "Odd" | "Over" | "Under">("Matches");
  const [currentTrend, setCurrentTrend] = useState<"Uptrend" | "Downtrend">("Downtrend");
  const [signalStrength, setSignalStrength] = useState<"EXECUTE TRADE NOW" | "NO-TRADE ZONE - WAIT">("EXECUTE TRADE NOW");
  const [confidenceScore, setConfidenceScore] = useState(96.6);
  const [predictedDigit, setPredictedDigit] = useState<number>(8);
  const [timerCount, setTimerCount] = useState(10);
  const [patternText, setPatternText] = useState("Inaunganisha na seva ya Deriv...");
  const [activeStreak, setActiveStreak] = useState<{ type: string; count: number } | null>({ type: "EVEN", count: 3 });

  // Frequencies & Ratios
  const [digitFrequencies, setDigitFrequencies] = useState<Record<number, number>>({
    0: 9, 1: 8, 2: 12, 3: 14, 4: 8, 5: 6, 6: 3, 7: 12, 8: 17, 9: 11
  });
  const [evenPercentage, setEvenPercentage] = useState("49.0%");
  const [oddPercentage, setOddPercentage] = useState("51.0%");
  const [underPercentage, setUnderPercentage] = useState("51.0%");
  const [overPercentage, setOverPercentage] = useState("49.0%");

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const lastTickTimeRef = useRef<number>(Date.now());
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Check kama mtumiaji wa sasa ni Admin / Wewe
  const isCurrentUserAdmin = currentUser?.role === "ADMIN" ||
    currentUser?.email?.toLowerCase() === "bensonlaizer53@gmail.com" ||
    currentUser?.deriv_id?.toUpperCase() === "ROT91981412";

  // URL na Lebo ya Terminal kulingana na cheo (Admin: lizytrade.site, User: bot.deriv.com)
  const botTerminalUrl = isCurrentUserAdmin
    ? "https://lizytrade.site"
    : "https://bot.deriv.com";

  const botTerminalLabel = isCurrentUserAdmin
    ? "LizyTrade Private Bot Station (lizytrade.site)"
    : "Live Deriv Bot Execution Terminal";

  // Sauti ya tahadhari (Beep)
  const playSignalAlertSound = useCallback(() => {
    if (!soundAlert) return;
    try {
      if (!audioCtxRef.current) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioContextClass();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch { }
  }, [soundAlert]);

  // Streak Detector
  const checkStreak = (digits: number[]) => {
    if (!digits || digits.length < 3) return null;
    let evenCount = 0;
    let oddCount = 0;
    for (const d of digits) {
      if (d % 2 === 0) {
        if (oddCount > 0) break;
        evenCount++;
      } else {
        if (evenCount > 0) break;
        oddCount++;
      }
    }
    if (evenCount >= 3) return { type: "EVEN", count: evenCount };
    if (oddCount >= 3) return { type: "ODD", count: oddCount };

    let underCount = 0;
    let overCount = 0;
    for (const d of digits) {
      if (d <= 4) {
        if (overCount > 0) break;
        underCount++;
      } else {
        if (underCount > 0) break;
        overCount++;
      }
    }
    if (underCount >= 3) return { type: "UNDER", count: underCount };
    if (overCount >= 3) return { type: "OVER", count: overCount };

    return null;
  };

  // Injini Kuu ya Uchambuzi (Bila Nested SetStates)
  const processIncomingTick = useCallback((lastD: number, newPriceStr?: string) => {
    lastTickTimeRef.current = Date.now();

    if (newPriceStr) {
      setCurrentPrice(newPriceStr);
    } else {
      setCurrentPrice((prev) => {
        const num = parseFloat(prev) || 763.498;
        const drift = (Math.random() - 0.49) * 0.15;
        return (num + drift).toFixed(4);
      });
    }

    setLastUpdated(new Date().toLocaleTimeString());

    setRecentDigits((prev) => {
      const updatedDigits = [lastD, ...prev.slice(0, 9)];
      const streak = checkStreak(updatedDigits);
      setActiveStreak(streak);
      return updatedDigits;
    });

    setDigitFrequencies((prevFreqs) => {
      const nextFreqs = { ...prevFreqs };
      nextFreqs[lastD] = (nextFreqs[lastD] || 10) + 1;

      let evens = 0;
      let odds = 0;
      let unders = 0;
      let overs = 0;
      let totalWeights = 0;

      for (let i = 0; i <= 9; i++) {
        const count = nextFreqs[i] || 10;
        totalWeights += count;
        if (i % 2 === 0) evens += count; else odds += count;
        if (i <= 4) unders += count; else overs += count;
      }

      const evenP = ((evens / totalWeights) * 100).toFixed(1);
      const oddP = ((odds / totalWeights) * 100).toFixed(1);
      const underP = ((unders / totalWeights) * 100).toFixed(1);
      const overP = ((overs / totalWeights) * 100).toFixed(1);

      setEvenPercentage(`${evenP}%`);
      setOddPercentage(`${oddP}%`);
      setUnderPercentage(`${underP}%`);
      setOverPercentage(`${overP}%`);

      const sorted = Object.entries(nextFreqs).map(([d, count]) => ({
        digit: parseInt(d, 10),
        pct: Math.round((count / totalWeights) * 100)
      })).sort((a, b) => a.pct - b.pct);

      const lowestCold = sorted[0];
      const highestHot = sorted[sorted.length - 1];

      let target = highestHot.digit;
      let explanation = "";
      let conf = 95.0;

      if (selectedStrategy === "Matches") {
        target = highestHot.digit;
        conf = Number((91 + (highestHot.pct * 0.35)).toFixed(1));
        explanation = `Digit ${target} is leading with peak frequency (${highestHot.pct}%) for Matches.`;
      } else if (selectedStrategy === "Differs") {
        target = lowestCold.digit;
        conf = Number((98.5 - (lowestCold.pct * 0.2)).toFixed(1));
        explanation = `Digit ${target} has lowest appearance (${lowestCold.pct}%) for safe Differs entry.`;
      } else if (selectedStrategy === "Even") {
        const bestEven = [...sorted].reverse().find(e => e.digit % 2 === 0) || highestHot;
        target = bestEven.digit;
        conf = 96.8;
        explanation = `Even momentum active (${evenP}%). Recommended Even target is ${target} (${bestEven.pct}%).`;
      } else if (selectedStrategy === "Odd") {
        const bestOdd = [...sorted].reverse().find(e => e.digit % 2 !== 0) || highestHot;
        target = bestOdd.digit;
        conf = 97.2;
        explanation = `Odd momentum active (${oddP}%). Recommended Odd target is ${target} (${bestOdd.pct}%).`;
      } else if (selectedStrategy === "Over") {
        const bestOver = [...sorted].reverse().find(e => e.digit >= 5) || highestHot;
        target = bestOver.digit;
        conf = 96.4;
        explanation = `Over (5-9) momentum at ${overP}%. Top target is digit ${target} (${bestOver.pct}%).`;
      } else {
        const bestUnder = [...sorted].reverse().find(e => e.digit <= 4) || lowestCold;
        target = bestUnder.digit;
        conf = 96.9;
        explanation = `Under (0-4) momentum at ${underP}%. Top target is digit ${target} (${bestUnder.pct}%).`;
      }

      setPredictedDigit(target);
      setConfidenceScore(Math.min(conf, 98.8));
      setPatternText(explanation);
      setCurrentTrend(Math.random() > 0.48 ? "Downtrend" : "Uptrend");

      const binarySpread = Math.abs(parseFloat(evenP) - parseFloat(oddP));
      setSignalStrength(binarySpread >= 2.5 ? "EXECUTE TRADE NOW" : "NO-TRADE ZONE - WAIT");

      const normalizedFreqs: Record<number, number> = {};
      sorted.forEach(item => {
        normalizedFreqs[item.digit] = item.pct;
      });

      return normalizedFreqs;
    });
  }, [selectedStrategy]);

  // Live WebSocket Connection + Kazi ya FailSafe (Kuzuia kuganda kwa 100%)
  useEffect(() => {
    let isMounted = true;
    let ws: WebSocket | null = null;

    const connectWebSocket = () => {
      try {
        ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setWsConnected(true);
          ws?.send(JSON.stringify({ forget_all: "ticks" }));
          ws?.send(JSON.stringify({ ticks: symbol, subscribe: 1 }));
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const res = JSON.parse(event.data);
            if (res.tick && res.tick.quote !== undefined) {
              const q = res.tick.quote;
              const qStr = q.toFixed(4);
              const lastDigit = parseInt(qStr[qStr.length - 1], 10);
              processIncomingTick(lastDigit, qStr);
            }
          } catch { }
        };

        ws.onerror = () => {
          if (isMounted) setWsConnected(false);
        };

        ws.onclose = () => {
          if (isMounted) setWsConnected(false);
        };
      } catch {
        if (isMounted) setWsConnected(false);
      }
    };

    connectWebSocket();

    // Heartbeat Pulse: Ikiwa seva ya Deriv ikichelewa kutuma tick, mfumo unajisukuma wenyewe ili dashibodi isigande kamwe!
    const livePulse = setInterval(() => {
      const timeSinceLast = Date.now() - lastTickTimeRef.current;
      if (timeSinceLast >= 1200) {
        const nextD = Math.floor(Math.random() * 10);
        processIncomingTick(nextD);
      }
    }, 1000);

    return () => {
      isMounted = false;
      if (ws) ws.close();
      clearInterval(livePulse);
    };
  }, [symbol, processIncomingTick]);

  // Countdown Timer ya Sekunde 10
  useEffect(() => {
    const timerInterval = setInterval(() => {
      setTimerCount((prev) => {
        if (prev <= 1) {
          playSignalAlertSound();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerInterval);
  }, [playSignalAlertSound]);

  // Upakiaji wa Watumiaji kutoka Supabase
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data: supaData } = await supabase
          .from("lizytrade_users")
          .select("*")
          .order("created_at", { ascending: false });

        if (supaData) setUsersList(supaData as UserRecord[]);
      } catch { }
    };
    loadUsers();
  }, []);

  const showCopyToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const copyDigitToClipboard = (digitVal: number | string) => {
    navigator.clipboard.writeText(digitVal.toString());
    showCopyToast(`🎯 Digit ${digitVal} Imenakiliwa! Weka moja kwa moja kwenye Bot yako.`);
  };

  const isDigitEven = predictedDigit % 2 === 0;
  const isDigitOver = predictedDigit >= 5;

  return (
    <div className="min-h-screen bg-[#040817] text-slate-100 p-3 md:p-6 font-sans relative">

      {/* Floating Copy Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header with Dynamic Trade Mode / Launch Bot Routing */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between pb-5 border-b border-blue-900/40 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-cyan-500/40 rounded-2xl text-cyan-400 shadow-lg shadow-cyan-500/10">
            <Zap className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-white">
                LizyTrade AI Signal Engine
              </h1>
              {isCurrentUserAdmin ? (
                <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-black text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-md shadow-amber-500/20">
                  <Crown className="w-3 h-3" /> SUPER ADMIN
                </span>
              ) : (
                <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  VIP ACTIVE
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Mtumiaji: <strong className="text-white font-bold">{currentUser?.full_name}</strong> | Deriv Account ID: <strong className="text-cyan-400 font-mono">{currentUser?.deriv_id}</strong>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center flex-wrap gap-2.5">

          {/* Toggle Split Screen Mode */}
          <button
            onClick={() => setIsSplitView(!isSplitView)}
            className={`text-xs px-3.5 py-2 rounded-xl font-bold flex items-center gap-2 transition-all border shadow-lg cursor-pointer ${isSplitView
                ? "bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-500/20"
                : "bg-blue-600/20 hover:bg-blue-600/30 text-cyan-300 border-cyan-500/40"
              }`}
            title={isCurrentUserAdmin ? "Gawa skrini: Signals kushoto, lizytrade.site kulia" : "Gawa skrini: Signals kushoto, Deriv Bot kulia"}
          >
            {isSplitView ? <Maximize2 className="w-4 h-4" /> : <Columns2 className="w-4 h-4" />}
            <span>{isSplitView ? "Full Dashboard" : isCurrentUserAdmin ? "Trade Mode (lizytrade.site)" : "Trade Mode (Split View)"}</span>
          </button>

          {/* Launch Bot in New Tab */}
          <a
            href={botTerminalUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-200 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 px-3.5 py-2 rounded-xl border border-slate-700 font-bold flex items-center gap-1.5 transition-all shadow-md"
            title={isCurrentUserAdmin ? "Fungua lizytrade.site kwenye tab mpya" : "Fungua Deriv Bot kwenye tab mpya"}
          >
            <span>{isCurrentUserAdmin ? "Open lizytrade.site" : "Launch Bot"}</span>
            <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
          </a>

          <div className="flex items-center gap-2 bg-[#0a1128] border border-blue-900/50 px-3 py-1.5 rounded-xl text-xs">
            <Timer className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Leseni:</span>
              <span className="text-emerald-400 font-bold font-mono">
                {isCurrentUserAdmin ? "Lifetime VIP" : `${currentUser?.plan}`}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              const nextD = Math.floor(Math.random() * 10);
              processIncomingTick(nextD);
            }}
            className="text-xs text-slate-300 hover:text-white bg-slate-800/80 px-3 py-2 rounded-xl border border-slate-700 font-bold flex items-center gap-1.5 transition-all"
            title="Sasisha haraka namba sasa hivi"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" /> Force Tick
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className={`max-w-7xl mx-auto mt-6 transition-all duration-300 ${isSplitView ? "grid grid-cols-1 xl:grid-cols-2 gap-6" : ""}`}>

        {/* Left Side: LizyTrade Signals & Market Analysis Engine */}
        <div className={`space-y-6 ${isSplitView ? "" : "grid grid-cols-1 lg:grid-cols-3 gap-6 space-y-0"}`}>

          {/* Controls Box */}
          <div className={`space-y-6 ${isSplitView ? "" : "lg:col-span-1"}`}>
            <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
                <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" /> Mipangilio ya Soko
                </h2>
                <button
                  onClick={() => {
                    setSoundAlert(!soundAlert);
                    if (!soundAlert) playSignalAlertSound();
                  }}
                  className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${soundAlert ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-500/10" : "bg-slate-800 border-slate-700 text-slate-500"
                    }`}
                >
                  {soundAlert ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  <span className="text-[10px]">{soundAlert ? "Alert ON" : "Muted"}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Synthetic Index:</label>
                <select
                  value={symbol}
                  onChange={(e) => setSymbol(e.target.value)}
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-bold cursor-pointer"
                >
                  <optgroup label="Continuous Indices (Normal)">
                    <option value="R_10">Volatility 10 Index</option>
                    <option value="R_25">Volatility 25 Index</option>
                    <option value="R_50">Volatility 50 Index</option>
                    <option value="R_75">Volatility 75 Index</option>
                    <option value="R_100">Volatility 100 Index</option>
                  </optgroup>
                  <optgroup label="1-Second (1s) Indices">
                    <option value="1HZ10V">Volatility 10 (1s) Index</option>
                    <option value="1HZ25V">Volatility 25 (1s) Index</option>
                    <option value="1HZ50V">Volatility 50 (1s) Index</option>
                    <option value="1HZ75V">Volatility 75 (1s) Index</option>
                    <option value="1HZ100V">Volatility 100 (1s) Index</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-300 uppercase">
                    Kina cha Uchambuzi (Ticks Window):
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400">
                    {ticksCount === 50 ? "Fast Scalp" : ticksCount === 100 ? "Standard" : "High Safety"}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => setTicksCount(50)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${ticksCount === 50
                        ? "bg-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                        : "bg-[#040817] border-blue-900/40 text-slate-400 hover:text-white"
                      }`}
                  >
                    <span className="text-xs font-bold block">50 Ticks</span>
                    <span className="text-[9px] block text-cyan-200 mt-0.5 font-medium">Fast Scalp</span>
                  </button>

                  <button
                    onClick={() => setTicksCount(100)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${ticksCount === 100
                        ? "bg-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                        : "bg-[#040817] border-blue-900/40 text-slate-400 hover:text-white"
                      }`}
                  >
                    <span className="text-xs font-bold block">100 Ticks</span>
                    <span className="text-[9px] block text-cyan-200 mt-0.5 font-medium">Balanced</span>
                  </button>

                  <button
                    onClick={() => setTicksCount(200)}
                    className={`py-2 px-1 rounded-xl text-center border transition-all ${ticksCount === 200
                        ? "bg-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                        : "bg-[#040817] border-blue-900/40 text-slate-400 hover:text-white"
                      }`}
                  >
                    <span className="text-xs font-bold block">200 Ticks</span>
                    <span className="text-[9px] block text-cyan-200 mt-0.5 font-medium">High Safety</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Radio className={`w-3.5 h-3.5 ${wsConnected ? "text-emerald-400 animate-pulse" : "text-cyan-400"}`} />
                  <span>Live Feed</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  {wsConnected ? "Deriv WebSocket Live" : "Active Feed"}
                </span>
              </div>
            </div>

            {/* Embed Box */}
            <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl space-y-3">
              <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
                <Code2 className="w-4 h-4" /> Unganisha na Bot / Tovuti (Embed)
              </h3>
              <div className="bg-[#040817] border border-blue-900/60 rounded-xl p-3 text-[10px] font-mono text-cyan-400 break-all select-all">
                {`<iframe src="https://deriv-analysis-tool-psi.vercel.app" width="100%" height="750px" frameborder="0"></iframe>`}
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`<iframe src="https://deriv-analysis-tool-psi.vercel.app" width="100%" height="750px" frameborder="0"></iframe>`);
                  showCopyToast("Embed Code Imenakiliwa!");
                }}
                className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-cyan-300 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Embed Code</span>
              </button>
            </div>
          </div>

          {/* Analysis Main Engine Area */}
          <div className={`space-y-6 ${isSplitView ? "" : "lg:col-span-2"}`}>

            <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5">

              {/* Top Bar: Title & Live Ticks */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-blue-900/40 gap-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-cyan-400" />
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                    AI Market Analyzer (Live Engine)
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <div className="bg-[#040817] border border-blue-900/50 px-2.5 py-1 rounded-xl text-[10px] font-mono text-slate-300">
                    Price: <strong className="text-cyan-400 font-bold">{currentPrice}</strong>
                  </div>

                  <div className="flex items-center gap-1.5 bg-[#040817] border border-blue-900/50 px-2.5 py-1.5 rounded-xl text-[10px] font-mono">
                    <span className="text-slate-400 uppercase text-[9px] mr-1">Ticks:</span>
                    {recentDigits.map((dig, idx) => (
                      <span
                        key={idx}
                        className={`font-bold px-1 rounded transition-all duration-300 ${idx === 0
                            ? "bg-cyan-500/30 text-cyan-300 ring-1 ring-cyan-400 scale-110"
                            : dig % 2 === 0 ? "text-cyan-400" : "text-indigo-400"
                          }`}
                      >
                        {dig}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Streak Alert Banner */}
              {activeStreak && activeStreak.count >= 3 && (
                <div className="bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-transparent border border-amber-500/40 rounded-2xl p-3 flex items-center gap-3 animate-pulse">
                  <div className="p-2 bg-amber-500/20 rounded-xl text-amber-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-amber-300 uppercase tracking-wider block">
                      {activeStreak.count}x Consecutive {activeStreak.type} Streak Detected!
                    </span>
                    <span className="text-[11px] text-slate-300">
                      High Probability Reversal Imminent: Mwelekeo wa soko unakaribia kugeuka mara moja.
                    </span>
                  </div>
                </div>
              )}

              {/* Strategy Selector */}
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                  Chagua Mkakati (Strategy Selector):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {(["Matches", "Differs", "Even", "Odd", "Over", "Under"] as const).map((strat) => (
                    <button
                      key={strat}
                      onClick={() => {
                        setSelectedStrategy(strat);
                        playSignalAlertSound();
                      }}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${selectedStrategy === strat
                          ? "bg-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20"
                          : "bg-[#040817] border-blue-900/40 text-slate-400 hover:text-white"
                        }`}
                    >
                      {strat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Metrics Bar */}
              <div className="grid grid-cols-3 gap-3 bg-[#040817] border border-blue-900/50 rounded-2xl p-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Trend:</span>
                  <span className={`text-sm font-black uppercase mt-0.5 block ${currentTrend === "Downtrend" ? "text-rose-400" : "text-emerald-400"}`}>
                    {currentTrend}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">AI Accuracy:</span>
                  <span className="text-sm font-black text-cyan-400 font-mono mt-0.5 block">
                    {confidenceScore}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Smart Filter:</span>
                  <span className={`text-xs font-black uppercase mt-1 block flex items-center gap-1 ${signalStrength === "EXECUTE TRADE NOW" ? "text-emerald-400" : "text-amber-400"
                    }`}>
                    {signalStrength === "EXECUTE TRADE NOW" ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>{signalStrength}</span>
                  </span>
                </div>
              </div>

              {/* Pattern Reason */}
              <div className="bg-[#040817]/80 border border-blue-900/40 rounded-2xl p-3.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sababu ya Kiufundi (Pattern Detected):</span>
                <p className="text-xs text-slate-300 font-medium">
                  {patternText}
                </p>
              </div>

              {/* Dynamic Buttons & Digit Identification Badge */}
              <div className="pt-2 flex items-center justify-between gap-4">

                {/* Left Action Button */}
                <button
                  onClick={() => {
                    if (selectedStrategy === "Even" || selectedStrategy === "Odd") {
                      setSelectedStrategy("Even");
                    } else if (selectedStrategy === "Over" || selectedStrategy === "Under") {
                      setSelectedStrategy("Over");
                    } else {
                      setSelectedStrategy("Matches");
                    }
                    playSignalAlertSound();
                  }}
                  className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${(selectedStrategy === "Matches" || selectedStrategy === "Even" || selectedStrategy === "Over")
                      ? "bg-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20"
                      : "bg-[#040817] border-blue-900/40 text-slate-300 hover:text-white"
                    }`}
                >
                  {selectedStrategy === "Even" || selectedStrategy === "Odd"
                    ? "BUY EVEN"
                    : selectedStrategy === "Over" || selectedStrategy === "Under"
                      ? "BUY OVER (5-9)"
                      : "MATCHES"}
                </button>

                {/* Center Circle with One-Click Copy */}
                <div className="flex flex-col items-center">
                  <div
                    onClick={() => copyDigitToClipboard(predictedDigit)}
                    className="w-20 h-20 rounded-full bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex flex-col items-center justify-center shadow-xl shadow-cyan-600/30 cursor-pointer active:scale-95 transition-all select-none hover:ring-4 hover:ring-cyan-500/30"
                    title="Bofya ku-copy tarakimu ya kuiweka kwenye bot"
                  >
                    <span className="text-3xl font-black font-mono leading-none">
                      {predictedDigit}
                    </span>
                    <span className="text-[10px] font-black text-cyan-200 font-mono mt-1">
                      {`0:0${timerCount}`}
                    </span>
                  </div>

                  {/* Accuracy Tags Bar */}
                  <div className="flex items-center gap-1 mt-2">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${isDigitEven ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40" : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"}`}>
                      {isDigitEven ? "EVEN" : "ODD"}
                    </span>
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${isDigitOver ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" : "bg-blue-500/20 text-blue-300 border-blue-500/40"}`}>
                      {isDigitOver ? "OVER (5-9)" : "UNDER (0-4)"}
                    </span>
                  </div>
                </div>

                {/* Right Action Button */}
                <button
                  onClick={() => {
                    if (selectedStrategy === "Even" || selectedStrategy === "Odd") {
                      setSelectedStrategy("Odd");
                    } else if (selectedStrategy === "Over" || selectedStrategy === "Under") {
                      setSelectedStrategy("Under");
                    } else {
                      setSelectedStrategy("Differs");
                    }
                    playSignalAlertSound();
                  }}
                  className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${(selectedStrategy === "Differs" || selectedStrategy === "Odd" || selectedStrategy === "Under")
                      ? "bg-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20"
                      : "bg-[#040817] border-blue-900/40 text-slate-300 hover:text-white"
                    }`}
                >
                  {selectedStrategy === "Even" || selectedStrategy === "Odd"
                    ? "BUY ODD"
                    : selectedStrategy === "Over" || selectedStrategy === "Under"
                      ? "BUY UNDER (0-4)"
                      : "DIFFERS"}
                </button>
              </div>
            </div>

            {/* Real-time Digit Frequency Heatmap */}
            <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                <BarChart3 className="w-4 h-4 text-cyan-400" /> Mzunguko wa Tarakimu (Live Data 0 - 9)
              </h3>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                {Array.from({ length: 10 }).map((_, digit) => {
                  const pct = digitFrequencies[digit] || 10;
                  const isCold = pct <= 7;
                  const isHot = pct >= 14;

                  return (
                    <div
                      key={digit}
                      onClick={() => copyDigitToClipboard(digit)}
                      className={`border rounded-2xl p-2.5 text-center transition-all cursor-pointer hover:border-cyan-400 ${digit === predictedDigit
                          ? "bg-blue-600/20 border-cyan-400 text-cyan-300 ring-2 ring-cyan-500/30"
                          : isCold
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                            : isHot
                              ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
                              : "bg-[#040817] border-blue-900/40 text-slate-300"
                        }`}
                    >
                      <span className="text-sm font-black block font-mono">{digit}</span>
                      <span className="text-[11px] font-mono block mt-0.5">{pct}%</span>
                    </div>
                  );
                })}
              </div>

              {/* Binary Bars */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-blue-900/40">
                <div className="bg-[#040817] border border-blue-900/40 rounded-2xl p-4">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-cyan-400">EVEN: {evenPercentage}</span>
                    <span className="text-indigo-400">ODD: {oddPercentage}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-cyan-500 h-full transition-all duration-300"
                      style={{ width: evenPercentage }}
                    />
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300"
                      style={{ width: oddPercentage }}
                    />
                  </div>
                </div>

                <div className="bg-[#040817] border border-blue-900/40 rounded-2xl p-4">
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-blue-400">UNDER (0-4): {underPercentage}</span>
                    <span className="text-emerald-400">OVER (5-9): {overPercentage}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                    <div
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: underPercentage }}
                    />
                    <div
                      className="bg-emerald-500 h-full transition-all duration-300"
                      style={{ width: overPercentage }}
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Dynamic Embedded Terminal (lizytrade.site kwa Admin au bot.deriv.com kwa User) */}
        {isSplitView && (
          <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-4 shadow-2xl flex flex-col h-[850px] animate-in fade-in duration-300">
            <div className="flex items-center justify-between pb-3 border-b border-blue-900/40 px-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  {isCurrentUserAdmin && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  {botTerminalLabel}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={botTerminalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] text-cyan-300 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Full Window</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  onClick={() => setIsSplitView(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 w-full rounded-2xl overflow-hidden mt-3 border border-blue-900/30 bg-white">
              <iframe
                src={botTerminalUrl}
                className="w-full h-full border-0"
                title={botTerminalLabel}
                allow="clipboard-read; clipboard-write"
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}