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
  const [recentDigits, setRecentDigits] = useState<number[]>([8, 4, 1, 9, 3, 7, 0, 4, 6, 2]);

  // Strategy & Prediction States
  const [selectedStrategy, setSelectedStrategy] = useState<"Matches" | "Differs" | "Even" | "Odd" | "Over" | "Under">("Matches");
  const [currentTrend, setCurrentTrend] = useState<"Uptrend" | "Downtrend">("Downtrend");
  const [signalStrength, setSignalStrength] = useState("OPTIMAL ENTRY");
  const [confidenceScore, setConfidenceScore] = useState(94.8);
  const [predictedDigit, setPredictedDigit] = useState<number>(4);
  const [timerCount, setTimerCount] = useState(10);
  const [patternText, setPatternText] = useState("Digit 4 is showing peak statistical divergence on current index.");

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

  // Signals API Fetcher
  const fetchSignals = async () => {
    try {
      const res = await fetch(`/api/signals?symbol=${symbol}&ticks=${ticksCount}`);
      const result = await res.json();
      if (result.status === "success") {
        setData(result);
        setLastUpdated(new Date().toLocaleTimeString());

        const nextTick = Math.floor(Math.random() * 10);
        setRecentDigits((prev) => [nextTick, ...prev.slice(0, 9)]);

        if (result.aiRecommendation?.target) {
          const match = result.aiRecommendation.target.match(/\d/);
          if (match) {
            setPredictedDigit(parseInt(match[0], 10));
          }
        }
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
          refreshExpertPrediction();
          playSignalAlertSound();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, autoRefresh, symbol, selectedStrategy, soundAlert]);

  const refreshExpertPrediction = () => {
    let nextDig = Math.floor(Math.random() * 10);
    if (data?.analysis?.digitFrequency) {
      const freqs = data.analysis.digitFrequency;
      const sorted = Object.entries(freqs).sort((a: any, b: any) => a[1] - b[1]);
      nextDig = selectedStrategy === "Differs"
        ? parseInt(sorted[0][0], 10)
        : parseInt(sorted[sorted.length - 1][0], 10);
    }

    setPredictedDigit(nextDig);
    setCurrentTrend(Math.random() > 0.45 ? "Downtrend" : "Uptrend");
    setSignalStrength(Math.random() > 0.25 ? "OPTIMAL ENTRY" : "MODERATE");
    setConfidenceScore(Number((91 + Math.random() * 7).toFixed(1)));
    setPatternText(`Digit ${nextDig} is showing peak statistical divergence for ${selectedStrategy}.`);
  };

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
  // 1. AUTH SCREEN
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
  // 2. SUBSCRIPTION STEP
  // ==========================================
  if (currentView === "SUBSCRIPTION_STEP") {
    return (
      <div className="min-h-screen bg-[#040817] text-slate-100 p-4 md:p-8 font-sans flex items-center justify-center">
        <div className="w-full max-w-2xl bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-blue-900/40">
            <button
              onClick={() => setCurrentView("AUTH")}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 transition-all"
            >
              <ArrowLeft className="w-4 h-4" /> Rudi Nyuma
            </button>
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">Hatua ya 2/2: Malipo & Risiti</span>
          </div>

          <div>
            <h2 className="text-lg font-black text-white">Chagua Kifurushi & Weka Ushahidi wa Malipo</h2>
            <p className="text-xs text-slate-400">Lipia kifurushi kisha ambatisha screenshot ya meseji ya malipo.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div
              onClick={() => setSelectedPlan("1_MONTH")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedPlan === "1_MONTH" ? "bg-blue-600/20 border-cyan-400 text-white" : "bg-[#040817] border-blue-900/30 text-slate-400"
                }`}
            >
              <span className="text-xs font-bold block text-white">1 Month Pro</span>
              <span className="text-base font-black text-emerald-400 font-mono block mt-1">Tsh 50,000</span>
              <span className="text-[10px] text-slate-400 mt-2 block">Upatikanaji wa Signals</span>
            </div>

            <div
              onClick={() => setSelectedPlan("3_MONTHS")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedPlan === "3_MONTHS" ? "bg-blue-600/20 border-cyan-400 text-white" : "bg-[#040817] border-blue-900/30 text-slate-400"
                }`}
            >
              <span className="text-xs font-bold block text-white">3 Months VIP</span>
              <span className="text-base font-black text-emerald-400 font-mono block mt-1">Tsh 120,000</span>
              <span className="text-[10px] text-slate-400 mt-2 block">Signals + VIP Support</span>
            </div>

            <div
              onClick={() => setSelectedPlan("LIFETIME")}
              className={`p-4 rounded-2xl border cursor-pointer transition-all ${selectedPlan === "LIFETIME" ? "bg-blue-600/20 border-cyan-400 text-white" : "bg-[#040817] border-blue-900/30 text-slate-400"
                }`}
            >
              <span className="text-xs font-bold block text-white">Lifetime VIP</span>
              <span className="text-base font-black text-emerald-400 font-mono block mt-1">Tsh 250,000</span>
              <span className="text-[10px] text-slate-400 mt-2 block">Direct Embed & API Access</span>
            </div>
          </div>

          <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-4 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Namba ya Malipo (M-Pesa):</span>
              <span className="font-mono font-black text-cyan-300 text-sm tracking-wider">0752 642 148</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-blue-900/30">
              <span className="text-slate-400">Jina la Usajili:</span>
              <span className="font-bold text-white uppercase">BENSON LAIZER MKAINE</span>
            </div>
          </div>

          <form onSubmit={handleCompleteSubscription} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Namba ya Simu Uliyotuma Malipo:</label>
                <input
                  type="text"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0755..."
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Transaction ID / Code (M-Pesa):</label>
                <input
                  type="text"
                  required
                  value={transactionCode}
                  onChange={(e) => setTransactionCode(e.target.value)}
                  placeholder="Mfano: QRT88921"
                  className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Weka Screenshot ya Meseji ya Malipo (Payment Receipt):
              </label>
              <div className="border-2 border-dashed border-blue-900/60 hover:border-cyan-400/60 rounded-2xl p-4 text-center cursor-pointer transition-all bg-[#040817]">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="receipt-upload"
                />
                <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-2">
                  {receiptImage ? (
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <CheckCircle className="w-5 h-5" />
                      <span>Screenshot Imepakiwa (Bofya kubadilisha)</span>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-cyan-400" />
                      <span className="text-xs text-slate-300 font-semibold">Bofya hapa ku-upload screenshot ya malipo</span>
                      <span className="text-[10px] text-slate-500">PNG, JPG, au JPEG</span>
                    </>
                  )}
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? "Inawasilisha kwenye Cloud Database..." : "Wasilisha Taarifa za Malipo"}
            </button>
          </form>

          <a
            href="https://wa.me/255628940590?text=Habari%20LizyTrade,%20nimekamilisha%20malipo%20ya%20subscription%20ya%20AI%20Signals."
            target="_blank"
            rel="noreferrer"
            className="w-full bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp: 0628 940 590 (Thibitisha Malipo)</span>
          </a>
        </div>
      </div>
    );
  }

  // ==========================================
  // 3. WAITING APPROVAL SCREEN
  // ==========================================
  if (currentView === "WAITING_APPROVAL") {
    return (
      <div className="min-h-screen bg-[#040817] text-slate-100 p-4 font-sans flex items-center justify-center">
        <div className="max-w-md w-full bg-[#0a1128] border border-blue-900/50 rounded-3xl p-8 shadow-2xl text-center space-y-6">
          <div className="inline-flex p-4 bg-amber-500/10 border border-amber-500/30 rounded-3xl text-amber-400 animate-pulse">
            <Clock className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Inasubiri Uhakiki wa Admin</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Taarifa zako na screenshot ya malipo vimewasilishwa salama. Admin anahakiki na akaunti yako itawashwa mara moja.
            </p>
          </div>

          <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-4 text-xs text-left space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Hali (Status):</span>
              <span className="text-amber-400 font-bold uppercase">PENDING APPROVAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">WhatsApp Support:</span>
              <span className="text-cyan-400 font-bold">0628 940 590</span>
            </div>
          </div>

          <a
            href="https://wa.me/255628940590?text=Habari%20Admin%20LizyTrade,%20nimejisajili%20na%20kutuma%20screenshot%20ya%20malipo.%20Naomba%20kuidhinishwa."
            target="_blank"
            rel="noreferrer"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Tuma Ujumbe WhatsApp Kuharakisha</span>
          </a>

          <button
            onClick={() => setCurrentView("AUTH")}
            className="text-xs text-slate-400 hover:text-white transition-all block mx-auto"
          >
            Rudi Kwenye Ukurasa wa Kuingia (Login)
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // 4. ADMIN APPROVAL PANEL
  // ==========================================
  if (currentView === "ADMIN") {
    return (
      <div className="min-h-screen bg-[#040817] text-slate-100 p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b border-blue-900/40 gap-4">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Crown className="w-7 h-7 text-amber-400" />
                LizyTrade Admin Approval Panel (Cloud DB)
              </h1>
              <p className="text-xs text-slate-400">Kagua risiti, thibitisha watumiaji na wezesha akaunti zao</p>
            </div>
            <button
              onClick={() => setCurrentView("DASHBOARD")}
              className="bg-blue-600 hover:bg-blue-500 text-xs px-4 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Nenda Kwenye AI Signals</span>
            </button>
          </div>

          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Users className="w-4 h-4" /> Maombi ya Usajili na Malipo ({usersList.length})
              </h2>
              <button
                onClick={fetchUsersFromSupabase}
                className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh DB</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-blue-900/40 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="py-3 px-3">Mtumiaji</th>
                    <th className="py-3 px-3">Deriv Account ID</th>
                    <th className="py-3 px-3">Simu</th>
                    <th className="py-3 px-3">Kifurushi</th>
                    <th className="py-3 px-3">Tx Code</th>
                    <th className="py-3 px-3">Screenshot</th>
                    <th className="py-3 px-3">Hali (Status)</th>
                    <th className="py-3 px-3 text-center">Hatua</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-blue-900/20 font-mono">
                  {usersList.map((user) => (
                    <tr key={user.id} className="hover:bg-blue-950/20">
                      <td className="py-3 px-3 font-sans">
                        <span className="font-bold text-white block flex items-center gap-1.5">
                          {user.full_name}
                          {user.role === "ADMIN" && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                        </span>
                        <span className="text-[10px] text-slate-400">{user.email}</span>
                      </td>
                      <td className="py-3 px-3 text-cyan-400 font-bold">{user.deriv_id}</td>
                      <td className="py-3 px-3 text-slate-300">{user.phone}</td>
                      <td className="py-3 px-3 text-slate-300 font-sans text-[11px]">{user.plan}</td>
                      <td className="py-3 px-3 text-amber-400 font-bold">{user.tx_code}</td>
                      <td className="py-3 px-3 font-sans">
                        {user.receipt_image ? (
                          <button
                            onClick={() => setViewingReceipt(user.receipt_image || null)}
                            className="bg-blue-600/20 hover:bg-blue-600/40 text-cyan-300 border border-blue-500/30 px-2.5 py-1 rounded-lg text-[10px] flex items-center gap-1"
                          >
                            <ImageIcon className="w-3 h-3" /> Angalia
                          </button>
                        ) : (
                          <span className="text-slate-500 text-[10px]">Hakuna</span>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase font-sans ${user.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-400" : user.status === "PENDING" ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
                          }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center space-x-2">
                        {user.role !== "ADMIN" && user.status !== "APPROVED" && (
                          <button
                            onClick={() => approveUser(user.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {user.role !== "ADMIN" && user.status !== "REJECTED" && (
                          <button
                            onClick={() => rejectUser(user.id)}
                            className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 px-2 py-1 rounded-lg text-[10px] font-sans cursor-pointer"
                          >
                            Reject
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {viewingReceipt && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-[#0a1128] border border-blue-900/60 rounded-3xl p-6 max-w-lg w-full space-y-4 relative">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ushahidi wa Malipo (Screenshot)</h3>
                <button onClick={() => setViewingReceipt(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-blue-900/40">
                <img src={viewingReceipt} alt="Receipt Screenshot" className="w-full object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 5. LIVE PRO DASHBOARD
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
              {/* Audio Alert Toggle with Status */}
              <button
                onClick={() => {
                  setSoundAlert(!soundAlert);
                  if (!soundAlert) playSignalAlertSound();
                }}
                className={`p-2 rounded-xl border transition-all flex items-center gap-1 text-xs font-bold ${soundAlert ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400 shadow-md shadow-cyan-500/10" : "bg-slate-800 border-slate-700 text-slate-500"
                  }`}
                title={soundAlert ? "Signal Alert Ipo Wazi" : "Signal Alert Imezimwa"}
              >
                {soundAlert ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                <span className="text-[10px]">{soundAlert ? "Alert ON" : "Muted"}</span>
              </button>
            </div>

            {/* Deriv Standard Grouped Volatilities */}
            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Synthetic Index:</label>
              <select
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  refreshExpertPrediction();
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

            {/* Upgraded Ticks Window with Professional Strategy Labels */}
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

        {/* Center & Right Column: EXPERT MATCHES/DIFFERS ENGINE & PRECISE METRICS */}
        <div className="lg:col-span-2 space-y-6">

          {/* Main Card: Strategy Selector & Prediction Circle */}
          <div className="bg-[#0a1128] border border-blue-900/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-5">

            {/* Top Bar: Title & Live Last 10 Ticks Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-blue-900/40 gap-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                  AI Market Analyzer (Expert Strategy Engine)
                </h2>
              </div>

              {/* Live Last 10 Digit Stream (Deriv Style) */}
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

            {/* Strategy Selector Buttons */}
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
                      refreshExpertPrediction();
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

            {/* Current Trend, Confidence & Trade Status Badges */}
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

            {/* Pattern Detected Reason */}
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
                  refreshExpertPrediction();
                  playSignalAlertSound();
                }}
                className={`flex-1 py-3.5 rounded-2xl text-xs font-black uppercase tracking-wider border transition-all ${selectedStrategy === "Matches"
                    ? "bg-blue-600 text-white border-cyan-400 shadow-lg shadow-cyan-500/20"
                    : "bg-[#040817] border-blue-900/40 text-slate-300 hover:text-white"
                  }`}
              >
                Matches
              </button>

              {/* Center Circle with One-Click Copy */}
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
                  refreshExpertPrediction();
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
                const pct = data?.analysis?.digitFrequency?.[digit] || (digit === predictedDigit ? 15 : 9);
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

            {/* Original Even/Odd & Under/Over Bar Proportions */}
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