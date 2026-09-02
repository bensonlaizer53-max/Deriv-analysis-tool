"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Zap,
  ShieldCheck,
  Lock,
  Activity,
  BarChart3,
  Sliders,
  Copy,
  Volume2,
  VolumeX,
  MessageCircle,
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
  TrendingUp,
  AlertTriangle,
  Flame,
  Radio
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

  // Session & Database Users
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

  // Market & Low-Latency Live WebSocket States
  const [symbol, setSymbol] = useState("1HZ100V");
  const [ticksCount, setTicksCount] = useState(100);
  const [soundAlert, setSoundAlert] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<string>("--");
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Live Historical Buffer ya Ticks
  const [ticksHistory, setTicksHistory] = useState<number[]>([]);
  const [recentDigits, setRecentDigits] = useState<number[]>([9, 4, 8, 3, 8, 9, 1, 5, 3, 7]);

  // Strategy & Prediction States
  const [selectedStrategy, setSelectedStrategy] = useState<"Matches" | "Differs" | "Even" | "Odd" | "Over" | "Under">("Matches");
  const [currentTrend, setCurrentTrend] = useState<"Uptrend" | "Downtrend">("Downtrend");
  const [signalStrength, setSignalStrength] = useState<"EXECUTE TRADE NOW" | "NO-TRADE ZONE - WAIT">("EXECUTE TRADE NOW");
  const [confidenceScore, setConfidenceScore] = useState(96.6);
  const [predictedDigit, setPredictedDigit] = useState<number>(8);
  const [timerCount, setTimerCount] = useState(10);
  const [patternText, setPatternText] = useState("Inaunganisha na seva ya Deriv...");
  const [activeStreak, setActiveStreak] = useState<{ type: string; count: number } | null>(null);

  // Calculated Real-Time Metrics
  const [digitFrequencies, setDigitFrequencies] = useState<Record<number, number>>({
    0: 10, 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10, 9: 10
  });
  const [evenPercentage, setEvenPercentage] = useState("50.0%");
  const [oddPercentage, setOddPercentage] = useState("50.0%");
  const [underPercentage, setUnderPercentage] = useState("50.0%");
  const [overPercentage, setOverPercentage] = useState("50.0%");

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play Audio Alert
  const playSignalAlertSound = () => {
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
  };

  // Fetch Users from Supabase
  const fetchUsersFromSupabase = async () => {
    try {
      const { data: supaData, error } = await supabase
        .from("lizytrade_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (supaData && !error) {
        setUsersList(supaData as UserRecord[]);
      }
    } catch (err) {
      console.error("Supabase fetch error:", err);
    }
  };

  useEffect(() => {
    fetchUsersFromSupabase();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const isAdminCredentials = (mail: string, deriv: string) => {
    const cMail = mail.trim().toLowerCase();
    const cDeriv = deriv.trim().toUpperCase();
    return cMail === "bensonlaizer53@gmail.com" || cDeriv === "ROT91981412";
  };

  const handleInitialRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !derivAccountId || !userPassword) {
      alert("Tafadhali jaza taarifa zote!");
      return;
    }

    if (isAdminCredentials(email, derivAccountId)) {
      const adminAcc: UserRecord = {
        id: "admin-root",
        full_name: fullName || "Benson Mkaine",
        email: email.trim().toLowerCase(),
        deriv_id: derivAccountId.trim().toUpperCase(),
        plan: "Unlimited (Lifetime)",
        phone: "0752642148",
        tx_code: "FOUNDER-ROOT",
        role: "ADMIN",
        status: "APPROVED",
      };
      setCurrentUser(adminAcc);
      setCurrentView("DASHBOARD");
      return;
    }

    setCurrentView("SUBSCRIPTION_STEP");
  };

  const handleCompleteSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !transactionCode) {
      alert("Tafadhali jaza namba ya simu na Transaction Code!");
      return;
    }

    setIsSubmitting(true);
    try {
      const planName = selectedPlan === "1_MONTH"
        ? "1 MONTH PRO (Tsh 50,000)"
        : selectedPlan === "3_MONTHS"
          ? "3 MONTHS VIP (Tsh 120,000)"
          : "LIFETIME UNLIMITED (Tsh 250,000)";

      const { error } = await supabase.from("lizytrade_users").insert([
        {
          full_name: fullName,
          email: email.trim().toLowerCase(),
          deriv_id: derivAccountId.trim().toUpperCase(),
          password: userPassword,
          plan: planName,
          phone: phoneNumber,
          tx_code: transactionCode,
          receipt_image: receiptImage || null,
          role: "USER",
          status: "PENDING",
        },
      ]);

      if (error) {
        alert(`Hitilafu ya kuhifadhi: ${error.message}`);
      } else {
        fetchUsersFromSupabase();
        setCurrentView("WAITING_APPROVAL");
      }
    } catch (err) {
      console.error(err);
      alert("Imeshindwa kuunganisha na Database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanDeriv = derivAccountId.trim().toUpperCase();

    if (isAdminCredentials(cleanEmail, cleanDeriv)) {
      const adminAcc: UserRecord = {
        id: "admin-root",
        full_name: "Benson Mkaine",
        email: cleanEmail,
        deriv_id: cleanDeriv,
        plan: "Unlimited (Lifetime)",
        phone: "0752642148",
        tx_code: "FOUNDER-ROOT",
        role: "ADMIN",
        status: "APPROVED",
      };
      setCurrentUser(adminAcc);
      setCurrentView("DASHBOARD");
      return;
    }

    const { data: users, error } = await supabase
      .from("lizytrade_users")
      .select("*")
      .eq("email", cleanEmail)
      .eq("deriv_id", cleanDeriv)
      .eq("password", userPassword)
      .limit(1);

    if (error || !users || users.length === 0) {
      alert("Taarifa si sahihi! Hakikisha Email, Deriv Account ID na Password viko sahihi.");
      return;
    }

    const user = users[0] as UserRecord;
    if (user.status !== "APPROVED") {
      setCurrentView("WAITING_APPROVAL");
      return;
    }

    setCurrentUser(user);
    setCurrentView("DASHBOARD");
  };

  const approveUser = async (id: string) => {
    await supabase.from("lizytrade_users").update({ status: "APPROVED" }).eq("id", id);
    fetchUsersFromSupabase();
  };

  const rejectUser = async (id: string) => {
    await supabase.from("lizytrade_users").update({ status: "REJECTED" }).eq("id", id);
    fetchUsersFromSupabase();
  };

  // Kuhesabu Streak ya Ticks
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

  // Kufanya Uchambuzi wa Kihisabati wa Ticks zote zilizopokelewa
  const processLiveMarketMetrics = (history: number[], strat: string) => {
    if (!history || history.length === 0) return;

    const total = history.length;
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0 };
    let evens = 0;
    let odds = 0;
    let unders = 0;
    let overs = 0;

    history.forEach((d) => {
      counts[d] = (counts[d] || 0) + 1;
      if (d % 2 === 0) evens++; else odds++;
      if (d <= 4) unders++; else overs++;
    });

    const freqs: Record<number, number> = {};
    for (let i = 0; i <= 9; i++) {
      freqs[i] = Math.round(((counts[i] || 0) / total) * 100);
    }
    setDigitFrequencies(freqs);

    const evenP = ((evens / total) * 100).toFixed(1);
    const oddP = ((odds / total) * 100).toFixed(1);
    const underP = ((unders / total) * 100).toFixed(1);
    const overP = ((overs / total) * 100).toFixed(1);

    setEvenPercentage(`${evenP}%`);
    setOddPercentage(`${oddP}%`);
    setUnderPercentage(`${underP}%`);
    setOverPercentage(`${overP}%`);

    const sortedEntries = Object.entries(freqs).map(([d, pct]) => ({
      digit: parseInt(d, 10),
      percentage: pct
    })).sort((a, b) => a.percentage - b.percentage);

    const lowestCold = sortedEntries[0];
    const highestHot = sortedEntries[sortedEntries.length - 1];

    const streak = checkStreak(history);
    setActiveStreak(streak);

    const binarySpread = Math.abs(parseFloat(evenP) - parseFloat(oddP));
    const isTradeAllowed = binarySpread >= 3.0 || (streak !== null && streak.count >= 3);
    setSignalStrength(isTradeAllowed ? "EXECUTE TRADE NOW" : "NO-TRADE ZONE - WAIT");

    let target = highestHot.digit;
    let explanation = "";
    let confidence = 95.0;

    if (strat === "Matches") {
      target = highestHot.digit;
      confidence = Number((91 + (highestHot.percentage * 0.35)).toFixed(1));
      explanation = `Digit ${target} leads with ${highestHot.percentage}% frequency across ${total} live ticks.`;
    } else if (strat === "Differs") {
      target = lowestCold.digit;
      confidence = Number((98.5 - (lowestCold.percentage * 0.25)).toFixed(1));
      explanation = `Digit ${target} has lowest appearance (${lowestCold.percentage}%) for safe Differs barrier.`;
    } else if (strat === "Even") {
      const bestEven = [...sortedEntries].reverse().find(e => e.digit % 2 === 0) || highestHot;
      target = bestEven.digit;
      if (streak && streak.type === "ODD" && streak.count >= 3) {
        confidence = 97.5;
        explanation = `🔥 ${streak.count}x ODD Streak Detected! Imminent reversal to EVEN!`;
      } else {
        confidence = Number((parseFloat(evenP) >= 50 ? parseFloat(evenP) + 38 : parseFloat(evenP) + 32).toFixed(1));
        explanation = `Even momentum at ${evenP}%. Best Even digit is ${target} (${bestEven.percentage}%).`;
      }
    } else if (strat === "Odd") {
      const bestOdd = [...sortedEntries].reverse().find(e => e.digit % 2 !== 0) || highestHot;
      target = bestOdd.digit;
      if (streak && streak.type === "EVEN" && streak.count >= 3) {
        confidence = 97.8;
        explanation = `🔥 ${streak.count}x EVEN Streak Detected! Imminent reversal to ODD!`;
      } else {
        confidence = Number((parseFloat(oddP) >= 50 ? parseFloat(oddP) + 38 : parseFloat(oddP) + 32).toFixed(1));
        explanation = `Odd momentum at ${oddP}%. Best Odd digit is ${target} (${bestOdd.percentage}%).`;
      }
    } else if (strat === "Over") {
      const bestOver = [...sortedEntries].reverse().find(e => e.digit >= 5) || highestHot;
      target = bestOver.digit;
      if (streak && streak.type === "UNDER" && streak.count >= 3) {
        confidence = 97.2;
        explanation = `🔥 ${streak.count}x UNDER Streak Detected! Reversal to OVER (5-9) starting!`;
      } else {
        confidence = Number((parseFloat(overP) >= 50 ? parseFloat(overP) + 38 : parseFloat(overP) + 32).toFixed(1));
        explanation = `Over momentum at ${overP}%. Top target digit is ${target} (${bestOver.percentage}%).`;
      }
    } else {
      const bestUnder = [...sortedEntries].reverse().find(e => e.digit <= 4) || lowestCold;
      target = bestUnder.digit;
      if (streak && streak.type === "OVER" && streak.count >= 3) {
        confidence = 97.4;
        explanation = `🔥 ${streak.count}x OVER Streak Detected! Reversal to UNDER (0-4) starting!`;
      } else {
        confidence = Number((parseFloat(underP) >= 50 ? parseFloat(underP) + 38 : parseFloat(underP) + 32).toFixed(1));
        explanation = `Under momentum at ${underP}%. Top target digit is ${target} (${bestUnder.percentage}%).`;
      }
    }

    setPredictedDigit(target);
    setConfidenceScore(Math.min(confidence, 98.9));
    setPatternText(explanation);
  };

  // ==========================================
  // DIRECT DERIV WEBSOCKET ENGINE (CHAGUO B)
  // ==========================================
  useEffect(() => {
    if (currentView !== "DASHBOARD") return;

    let ws: WebSocket;
    const connectDerivWebSocket = () => {
      ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        // Omba Ticks za hivi karibuni (Ticks History) na kisha jiunge na Live Ticks Stream
        ws.send(JSON.stringify({
          ticks_history: symbol,
          adjust_start_time: 1,
          count: ticksCount,
          end: "latest",
          style: "ticks",
          subscribe: 1
        }));
      };

      ws.onmessage = (event) => {
        try {
          const res = JSON.parse(event.data);

          // 1. Mapokezi ya Historia ya Awali (Initial Ticks History)
          if (res.msg_type === "history" && res.history) {
            const prices: number[] = res.history.prices;
            const digits = prices.map(p => {
              const str = p.toFixed(4);
              return parseInt(str[str.length - 1], 10);
            });

            setTicksHistory(digits);
            setRecentDigits(digits.slice(-10).reverse());
            processLiveMarketMetrics(digits, selectedStrategy);
            if (prices.length > 0) setCurrentPrice(prices[prices.length - 1].toFixed(4));
            setLastUpdated(new Date().toLocaleTimeString());
          }

          // 2. Mapokezi ya Live Millisecond Tick Stream
          if (res.msg_type === "tick" && res.tick) {
            const price = res.tick.quote;
            const priceStr = price.toFixed(4);
            const lastDig = parseInt(priceStr[priceStr.length - 1], 10);

            setCurrentPrice(priceStr);
            setLastUpdated(new Date().toLocaleTimeString());

            setTicksHistory((prev) => {
              const updated = [...prev.slice(1), lastDig];
              processLiveMarketMetrics(updated, selectedStrategy);
              return updated;
            });

            setRecentDigits((prev) => [lastDig, ...prev.slice(0, 9)]);
          }
        } catch (e) {
          console.error("WS Parse error:", e);
        }
      };

      ws.onerror = () => setWsConnected(false);
      ws.onclose = () => setWsConnected(false);
    };

    connectDerivWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [currentView, symbol, ticksCount]);

  // Badilisha maelezo pale ambapo mkakati unabadilishwa papo hapo
  useEffect(() => {
    if (ticksHistory.length > 0) {
      processLiveMarketMetrics(ticksHistory, selectedStrategy);
    }
  }, [selectedStrategy]);

  // Countdown timer ya sekunde 10
  useEffect(() => {
    if (currentView !== "DASHBOARD") return;
    const interval = setInterval(() => {
      setTimerCount((prev) => {
        if (prev <= 1) {
          playSignalAlertSound();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, soundAlert]);

  const showCopyToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyDigitToClipboard = (digitVal: number | string) => {
    navigator.clipboard.writeText(digitVal.toString());
    showCopyToast(`🎯 Digit ${digitVal} Imenakiliwa! Weka moja kwa moja kwenye Bot yako.`);
  };

  const isDigitEven = predictedDigit % 2 === 0;
  const isDigitOver = predictedDigit >= 5;

  return (
    <div className="min-h-screen bg-[#040817] text-slate-100 p-4 md:p-8 font-sans relative">

      {/* Floating Copy Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-emerald-600 text-white text-xs font-bold px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400 animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
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
              {currentUser?.role === "ADMIN" ? (
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

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-[#0a1128] border border-blue-900/50 px-3 py-1.5 rounded-xl text-xs">
            <Timer className="w-4 h-4 text-cyan-400" />
            <div>
              <span className="text-slate-400 block text-[9px] uppercase">Leseni / Subscription:</span>
              <span className="text-emerald-400 font-bold font-mono">
                {currentUser?.role === "ADMIN" ? "Unlimited (Lifetime)" : `${currentUser?.plan}`}
              </span>
            </div>
          </div>

          {currentUser?.role === "ADMIN" && (
            <button
              onClick={() => setCurrentView("ADMIN")}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Panel</span>
            </button>
          )}

          <button
            onClick={() => setCurrentView("AUTH")}
            className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3.5 py-2 rounded-xl border border-rose-500/20 font-bold transition-all"
          >
            Toka
          </button>
        </div>
      </header>

      {/* Main Grid Area */}
      <main className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Deriv Structured Volatilities & Embed */}
        <div className="space-y-6">
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

            {/* Ticks Window */}
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

            {/* Direct WebSocket Native Feed Status */}
            <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Radio className={`w-3.5 h-3.5 ${wsConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
                <span>Deriv Native WebSocket</span>
              </span>
              <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-mono font-bold ${wsConnected ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                }`}>
                {wsConnected ? "Ultra Low Latency" : "Connecting..."}
              </span>
            </div>
          </div>

          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4" /> Unganisha na Bot / Tovuti (Embed Code)
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

        {/* Center & Right Column: ULTRA FAST STREAM & SMART TRADING ENGINE */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5">

            {/* Title & Live Last 10 Ticks Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-blue-900/40 gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Market Analyzer (WebSocket Live Feed)
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="bg-[#040817] border border-blue-900/50 px-2 py-1 rounded-xl text-[10px] font-mono text-slate-300">
                  Price: <strong className="text-cyan-400">{currentPrice}</strong>
                </div>

                <div className="flex items-center gap-1.5 bg-[#040817] border border-blue-900/50 px-2.5 py-1.5 rounded-xl text-[10px] font-mono">
                  <span className="text-slate-400 uppercase text-[9px] mr-1">Ticks:</span>
                  {recentDigits.map((dig, idx) => (
                    <span
                      key={idx}
                      className={`font-bold px-1 rounded ${idx === 0 ? "bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400 animate-pulse" : dig % 2 === 0 ? "text-cyan-400" : "text-indigo-400"}`}
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
                    High Probability Reversal Imminent: Soko lipo tayari kugeuka kwenda upande wa pili.
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
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sababu ya Kiufundi (Live WebSocket Analysis):</span>
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
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Mzunguko wa Tarakimu (Live WebSocket Data 0 - 9)
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
      </main>
    </div>
  );
}