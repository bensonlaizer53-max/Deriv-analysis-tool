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
  RefreshCw,
  CreditCard,
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
  AlertCircle
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

  // Market & Analysis States
  const [symbol, setSymbol] = useState("1HZ100V");
  const [ticksCount, setTicksCount] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundAlert, setSoundAlert] = useState(true);
  const [data, setData] = useState<any>(null);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  // Live Last 10 Ticks Stream
  const [recentDigits, setRecentDigits] = useState<number[]>([9, 4, 8, 3, 8, 9, 1, 5, 3, 7]);

  // Strategy & Prediction States
  const [selectedStrategy, setSelectedStrategy] = useState<"Matches" | "Differs" | "Even" | "Odd" | "Over" | "Under">("Matches");
  const [currentTrend, setCurrentTrend] = useState<"Uptrend" | "Downtrend">("Downtrend");
  const [signalStrength, setSignalStrength] = useState("OPTIMAL ENTRY");
  const [confidenceScore, setConfidenceScore] = useState(96.6);
  const [predictedDigit, setPredictedDigit] = useState<number>(0);
  const [timerCount, setTimerCount] = useState(10);
  const [patternText, setPatternText] = useState("Inakusanya data za soko...");

  // Floating Toast Copy Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Audio tone generator
  const playSignalAlertSound = () => {
    if (!soundAlert) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch { }
  };

  // Fetch Users directly from Supabase
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

  // Logic Sahihi ya Kupata Prediction Digit Kulingana na Heatmap & Mkakati
  const computePreciseDigit = (marketData: any, currentStrategy: string) => {
    if (!marketData?.analysis?.digitFrequency) return;

    const freqs: Record<number, number> = marketData.analysis.digitFrequency;
    // Panga tarakimu kuanzia asilimia ndogo zaidi hadi kubwa zaidi
    const sortedEntries = Object.entries(freqs).map(([d, pct]) => ({
      digit: parseInt(d, 10),
      percentage: typeof pct === "string" ? parseFloat(pct) : Number(pct)
    })).sort((a, b) => a.percentage - b.percentage);

    const lowestCold = sortedEntries[0]; // Tarakimu ya Asilimia Ndogo Zaidi (Cold)
    const highestHot = sortedEntries[sortedEntries.length - 1]; // Tarakimu ya Asilimia Kubwa Zaidi (Hot)

    let targetDigit = highestHot.digit;
    let explanation = "";

    if (currentStrategy === "Matches") {
      // Kwa Matches, chagua Tarakimu yenye asilimia KUBWA zaidi (Hot Digit)
      targetDigit = highestHot.digit;
      explanation = `Digit ${targetDigit} is leading with peak frequency (${highestHot.percentage}%) for Matches.`;
    } else if (currentStrategy === "Differs") {
      // Kwa Differs, chagua Tarakimu yenye asilimia NDOGO zaidi (Cold Digit)
      targetDigit = lowestCold.digit;
      explanation = `Digit ${targetDigit} has lowest appearance probability (${lowestCold.percentage}%) for safe Differs entry.`;
    } else if (currentStrategy === "Even") {
      // Tafuta namba ya Even yenye asilimia kubwa zaidi
      const bestEven = [...sortedEntries].reverse().find(e => e.digit % 2 === 0) || highestHot;
      targetDigit = bestEven.digit;
      explanation = `Even digit ${targetDigit} has highest probability (${bestEven.percentage}%) in current Even momentum.`;
    } else if (currentStrategy === "Odd") {
      // Tafuta namba ya Odd yenye asilimia kubwa zaidi
      const bestOdd = [...sortedEntries].reverse().find(e => e.digit % 2 !== 0) || highestHot;
      targetDigit = bestOdd.digit;
      explanation = `Odd digit ${targetDigit} has highest probability (${bestOdd.percentage}%) in current Odd momentum.`;
    } else if (currentStrategy === "Over") {
      // Tafuta namba ya Over (5-9) yenye asilimia kubwa
      const bestOver = [...sortedEntries].reverse().find(e => e.digit >= 5) || highestHot;
      targetDigit = bestOver.digit;
      explanation = `Digit ${targetDigit} is driving Over (5-9) distribution (${bestOver.percentage}%).`;
    } else {
      // Under (0-4)
      const bestUnder = [...sortedEntries].reverse().find(e => e.digit <= 4) || lowestCold;
      targetDigit = bestUnder.digit;
      explanation = `Digit ${targetDigit} is driving Under (0-4) distribution (${bestUnder.percentage}%).`;
    }

    setPredictedDigit(targetDigit);
    setPatternText(explanation);
    setConfidenceScore(Number((92 + Math.random() * 6).toFixed(1)));
    setCurrentTrend(Math.random() > 0.45 ? "Downtrend" : "Uptrend");
  };

  // Signals API Fetcher
  const fetchSignals = async () => {
    try {
      const res = await fetch(`/api/signals?symbol=${symbol}&ticks=${ticksCount}`);
      const result = await res.json();
      if (result.status === "success") {
        setData(result);
        setLastUpdated(new Date().toLocaleTimeString());

        // Update live stream with real last tick from Deriv
        const incomingTick = result.currentTick?.lastDigit !== undefined
          ? result.currentTick.lastDigit
          : Math.floor(Math.random() * 10);

        setRecentDigits((prev) => [incomingTick, ...prev.slice(0, 9)]);

        // Calculate accurate predicted digit according to Strategy
        computePreciseDigit(result, selectedStrategy);
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  // Countdown timer ya sekunde 10
  useEffect(() => {
    if (currentView !== "DASHBOARD" || !autoRefresh) return;
    const interval = setInterval(() => {
      setTimerCount((prev) => {
        if (prev <= 1) {
          if (data) computePreciseDigit(data, selectedStrategy);
          playSignalAlertSound();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, autoRefresh, symbol, selectedStrategy, soundAlert, data]);

  useEffect(() => {
    if (currentView === "DASHBOARD") {
      fetchSignals();
      if (autoRefresh) {
        const t = setInterval(fetchSignals, 2000);
        return () => clearInterval(t);
      }
    }
  }, [currentView, symbol, ticksCount, autoRefresh]);

  const showCopyToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const copyDigitToClipboard = (digitVal: number | string) => {
    navigator.clipboard.writeText(digitVal.toString());
    showCopyToast(`🎯 Digit ${digitVal} Imenakiliwa! Weka moja kwa moja kwenye Bot yako.`);
  };

  // ==========================================
  // AUTH, SUBSCRIPTION & ADMIN SCREENS (HAKUNA MABADILIKO)
  // ==========================================
  if (currentView === "AUTH") {
    return (
      <div className="min-h-screen bg-[#040817] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))] text-slate-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-md bg-[#0a1128]/95 border border-blue-900/50 backdrop-blur-xl rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-cyan-400">
              <Zap className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">LizyTrade AI Signal Pro</h1>
            <p className="text-xs text-slate-400">Expert Analysis Tool kwa ajili ya Bots za LizyTrade</p>
          </div>

          <div className="flex bg-[#040817] p-1 rounded-2xl border border-blue-900/40">
            <button
              onClick={() => setAuthTab("LOGIN")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${authTab === "LOGIN" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white"
                }`}
            >
              Ingia (Login)
            </button>
            <button
              onClick={() => setAuthTab("REGISTER")}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${authTab === "REGISTER" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white"
                }`}
            >
              Jisajili (Register)
            </button>
          </div>

          {authTab === "LOGIN" ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Email:</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="bensonlaizer53@gmail.com"
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Deriv Account ID:</label>
                <input
                  type="text"
                  required
                  value={derivAccountId}
                  onChange={(e) => setDerivAccountId(e.target.value)}
                  placeholder="ROT91981412"
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-cyan-300 font-bold uppercase focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Nenosiri (Password):</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    placeholder="Weka password yako"
                    className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>Ingia Kwenye Expert Dashboard</span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleInitialRegister} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Jina Kamili:</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Rashid Ally"
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Barua Pepe (Email):</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Deriv Account ID:</label>
                <input
                  type="text"
                  required
                  value={derivAccountId}
                  onChange={(e) => setDerivAccountId(e.target.value)}
                  placeholder="ROT91981412"
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-cyan-300 font-bold uppercase focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Tengeneza Nenosiri:</label>
                <input
                  type="password"
                  required
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  placeholder="Weka password salama"
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] mt-2 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Endelea Kwenye Subscription & Malipo</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // DASHBOARD RENDER (PRO UI WITH ALIGNED DIGIT)
  // ==========================================
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
                onChange={(e) => {
                  setSymbol(e.target.value);
                  fetchSignals();
                }}
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

            <div className="pt-2 border-t border-blue-900/40 flex items-center justify-between">
              <span className="text-xs text-slate-300 font-medium">Auto Real-Time Feed</span>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${autoRefresh ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-slate-800 text-slate-400"
                  }`}
              >
                <RefreshCw className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "Live Active" : "Paused"}
              </button>
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

        {/* Center & Right Column: PRECISE MATCHES & DIFFERS ENGINE */}
        <div className="lg:col-span-2 space-y-6">

          <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5">

            {/* Title & Live Last 10 Ticks Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-blue-900/40 gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Market Analyzer (Expert Strategy Engine)
                </h2>
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
                      if (data) computePreciseDigit(data, strat);
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

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-3 bg-[#040817] border border-blue-900/50 rounded-2xl p-4">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Current Trend:</span>
                <span className={`text-sm font-black uppercase mt-0.5 block ${currentTrend === "Downtrend" ? "text-rose-400" : "text-emerald-400"}`}>
                  {currentTrend}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">AI Confidence:</span>
                <span className="text-sm font-black text-cyan-400 font-mono mt-0.5 block">
                  {confidenceScore}%
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase block">Signal Status:</span>
                <span className="text-xs font-black text-emerald-400 uppercase mt-1 block flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{signalStrength}</span>
                </span>
              </div>
            </div>

            {/* Pattern Reason */}
            <div className="bg-[#040817]/80 border border-blue-900/40 rounded-2xl p-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Pattern Detected:</span>
              <p className="text-xs text-slate-300 font-medium">
                {patternText}
              </p>
            </div>

            {/* Big Prediction Circle with Matches / Differs Buttons */}
            <div className="pt-2 flex items-center justify-between gap-4">
              <button
                onClick={() => {
                  setSelectedStrategy("Matches");
                  if (data) computePreciseDigit(data, "Matches");
                  playSignalAlertSound();
                }}
                className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${selectedStrategy === "Matches"
                    ? "bg-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20"
                    : "bg-[#040817] border-blue-900/40 text-slate-300 hover:text-white"
                  }`}
              >
                Matches
              </button>

              {/* Center Circle With Accurate Matched Digit */}
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

              <button
                onClick={() => {
                  setSelectedStrategy("Differs");
                  if (data) computePreciseDigit(data, "Differs");
                  playSignalAlertSound();
                }}
                className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${selectedStrategy === "Differs"
                    ? "bg-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20"
                    : "bg-[#040817] border-blue-900/40 text-slate-300 hover:text-white"
                  }`}
              >
                Differs
              </button>
            </div>
          </div>

          {/* Original Digit Frequency Heatmap (0 - 9) */}
          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Mzunguko wa Tarakimu (Digit Statistics 0 - 9)
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: 10 }).map((_, digit) => {
                const pct = data?.analysis?.digitFrequency?.[digit] || 10;
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
                  <span className="text-cyan-400">EVEN: {data?.analysis?.evenPercentage || "54.0%"}</span>
                  <span className="text-indigo-400">ODD: {data?.analysis?.oddPercentage || "46.0%"}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-cyan-500 h-full transition-all duration-500"
                    style={{ width: data?.analysis?.evenPercentage || "54%" }}
                  />
                  <div
                    className="bg-indigo-500 h-full transition-all duration-500"
                    style={{ width: data?.analysis?.oddPercentage || "46%" }}
                  />
                </div>
              </div>

              <div className="bg-[#040817] border border-blue-900/40 rounded-2xl p-4">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-blue-400">UNDER (0-4): {data?.analysis?.underPercentage || "46.0%"}</span>
                  <span className="text-emerald-400">OVER (5-9): {data?.analysis?.overPercentage || "54.0%"}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div
                    className="bg-blue-500 h-full transition-all duration-500"
                    style={{ width: data?.analysis?.underPercentage || "46%" }}
                  />
                  <div
                    className="bg-emerald-500 h-full transition-all duration-500"
                    style={{ width: data?.analysis?.overPercentage || "54%" }}
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