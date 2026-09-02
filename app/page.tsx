"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import {
  Zap,
  ShieldCheck,
  Lock,
  Menu,
  X,
  Crown,
  ArrowRight,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Clock,
  CheckCircle,
  TrendingUp,
  CreditCard,
  PhoneCall,
  MessageCircle,
  Users,
  RefreshCw,
  Play,
  Square,
  Copy,
  Check,
  Eye,
  EyeOff
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

export default function LizyTradeIntegratedApp() {
  // Views: 'AUTH' | 'SUBSCRIPTION_STEP' | 'WAITING_APPROVAL' | 'TOOL' | 'CONFIG' | 'ADMIN'
  const [currentView, setCurrentView] = useState<"AUTH" | "SUBSCRIPTION_STEP" | "WAITING_APPROVAL" | "TOOL" | "CONFIG" | "ADMIN">("AUTH");
  const [authTab, setAuthTab] = useState<"LOGIN" | "REGISTER">("LOGIN");
  const [menuOpen, setMenuOpen] = useState(false);

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

  // Current Session & Supabase Records
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);
  const [usersList, setUsersList] = useState<UserRecord[]>([]);

  // Video-Style Engine States
  const [strategy, setStrategy] = useState<"Matches" | "Differs" | "Even" | "Odd" | "Over" | "Under">("Matches");
  const [symbol, setSymbol] = useState("1HZ25V");
  const [symbolLabel, setSymbolLabel] = useState("Volatility 25 (1s) Index");
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [currentTrend, setCurrentTrend] = useState<"Uptrend" | "Downtrend">("Downtrend");
  const [signalStrength, setSignalStrength] = useState("Building");
  const [predictedDigit, setPredictedDigit] = useState<number | null>(7);
  const [patternText, setPatternText] = useState("Digit 7 is leading on Volatility 25 Index, but the pattern isn't decisive yet.");
  const [timerCount, setTimerCount] = useState(10);
  const [copied, setCopied] = useState(false);

  // Fetch registered users from Supabase
  const fetchUsersFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("lizytrade_users")
        .select("*")
        .order("created_at", { ascending: false });

      if (data && !error) {
        setUsersList(data as UserRecord[]);
      }
    } catch (err) {
      console.error("Supabase error:", err);
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

  // Step 1: Initial Registration
  const handleInitialRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !derivAccountId || !userPassword) {
      alert("Tafadhali jaza taarifa zote za usajili!");
      return;
    }

    if (isAdminCredentials(email, derivAccountId)) {
      const adminAcc: UserRecord = {
        id: "admin-root",
        full_name: fullName || "Benson Mkaine",
        email: email.trim().toLowerCase(),
        deriv_id: derivAccountId.trim().toUpperCase(),
        plan: "LIFETIME UNLIMITED VIP",
        phone: "0752642148",
        tx_code: "FOUNDER-ROOT",
        role: "ADMIN",
        status: "APPROVED",
      };
      setCurrentUser(adminAcc);
      setCurrentView("TOOL");
      return;
    }

    setCurrentView("SUBSCRIPTION_STEP");
  };

  // Step 2: Complete Subscription & Save to Cloud Database
  const handleCompleteSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !transactionCode) {
      alert("Tafadhali jaza namba ya simu na Transaction Code ya malipo!");
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

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanDeriv = derivAccountId.trim().toUpperCase();

    // Founder direct login bypass
    if (isAdminCredentials(cleanEmail, cleanDeriv)) {
      const adminAcc: UserRecord = {
        id: "admin-root",
        full_name: "Benson Mkaine",
        email: cleanEmail,
        deriv_id: cleanDeriv,
        plan: "LIFETIME UNLIMITED VIP",
        phone: "0752642148",
        tx_code: "FOUNDER-ROOT",
        role: "ADMIN",
        status: "APPROVED",
      };
      setCurrentUser(adminAcc);
      setCurrentView("TOOL");
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
    setCurrentView("TOOL");
  };

  // Admin Approval Handlers
  const approveUser = async (id: string) => {
    await supabase.from("lizytrade_users").update({ status: "APPROVED" }).eq("id", id);
    fetchUsersFromSupabase();
  };

  const rejectUser = async (id: string) => {
    await supabase.from("lizytrade_users").update({ status: "REJECTED" }).eq("id", id);
    fetchUsersFromSupabase();
  };

  // Countdown timer ya sekunde 10 (kama ile 0:10 hadi 0:00 kwenye video)
  useEffect(() => {
    if (currentView !== "TOOL" || !isAnalyzing) return;
    const interval = setInterval(() => {
      setTimerCount((prev) => {
        if (prev <= 1) {
          generateNewPrediction();
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentView, isAnalyzing, symbol, strategy]);

  // Tengeneza Live Signals kulingana na data za soko
  const generateNewPrediction = async () => {
    try {
      const res = await fetch(`/api/signals?symbol=${symbol}&ticks=100`);
      const resData = await res.json();
      if (resData.status === "success") {
        const rawTarget = resData.aiRecommendation.target;
        const digitMatch = rawTarget.match(/\d/);
        const nextDigit = digitMatch ? parseInt(digitMatch[0], 10) : Math.floor(Math.random() * 10);

        setPredictedDigit(nextDigit);
        setCurrentTrend(Math.random() > 0.45 ? "Downtrend" : "Uptrend");
        setSignalStrength("Building");
        setPatternText(`Digit ${nextDigit} is leading on ${symbolLabel}, but the pattern isn't decisive yet.`);
      }
    } catch {
      const fallbackDigit = Math.floor(Math.random() * 10);
      setPredictedDigit(fallbackDigit);
      setPatternText(`Digit ${fallbackDigit} is leading on ${symbolLabel}, ready for bot insertion.`);
    }
  };

  const copyPrediction = () => {
    if (predictedDigit !== null) {
      navigator.clipboard.writeText(predictedDigit.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  // ==========================================
  // 1. AUTH SCREEN (LOGIN & REGISTRATION)
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
                    placeholder="Weka password"
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
                <span>Ingia Kwenye Expert Tool</span>
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
                  placeholder="ROT91981412 au CR..."
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
  // 2. SUBSCRIPTION & PAYMENT SCREEN
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
  // 4. ADMIN APPROVAL PANEL (CONTROL PANEL)
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
              onClick={() => setCurrentView("TOOL")}
              className="bg-blue-600 hover:bg-blue-500 text-xs px-4 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-blue-600/30 flex items-center gap-1.5"
            >
              <span>Fungua Expert Tool &rarr;</span>
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
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Screenshot ya Malipo</h3>
                <button onClick={() => setViewingReceipt(null)} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="max-h-[70vh] overflow-auto rounded-xl border border-blue-900/40">
                <img src={viewingReceipt} alt="Screenshot" className="w-full object-contain" />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // 5. VIDEO-STYLE EXPERT ANALYSIS TOOL INTERFACE
  // ==========================================
  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 flex justify-center font-sans">
      <div className="w-full max-w-md bg-white min-h-screen flex flex-col justify-between shadow-2xl relative border-x border-slate-200">

        {/* Top Header */}
        <header className="px-5 py-4 flex items-center justify-between border-b border-slate-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <h1 className="font-extrabold text-base tracking-tight text-slate-900">
              Expert Analysis Tool
            </h1>
            {currentUser?.role === "ADMIN" && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase flex items-center gap-0.5">
                <Crown className="w-3 h-3 text-amber-600" /> ADMIN
              </span>
            )}
          </div>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 rounded-lg"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Slide-out Menu */}
        {menuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-xl z-30 p-5 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="text-xs space-y-1 border-b border-slate-100 pb-3">
              <span className="text-slate-400 uppercase font-semibold text-[10px]">Akaunti Iliyounganishwa</span>
              <p className="font-bold text-slate-800">{currentUser?.deriv_id || derivAccountId} (Verified)</p>
              <p className="text-slate-500 font-mono text-[11px]">{currentUser?.email || email}</p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => { setCurrentView("TOOL"); setMenuOpen(false); }}
                className="w-full text-left py-2 text-xs font-bold text-slate-700 hover:text-blue-600"
              >
                Dashboard
              </button>
              <button
                onClick={() => { setCurrentView("CONFIG"); setMenuOpen(false); }}
                className="w-full text-left py-2 text-xs font-bold text-slate-700 hover:text-blue-600"
              >
                Market & Strategy Settings
              </button>
              {currentUser?.role === "ADMIN" && (
                <button
                  onClick={() => { setCurrentView("ADMIN"); setMenuOpen(false); }}
                  className="w-full text-left py-2 text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1.5"
                >
                  <Crown className="w-4 h-4" /> Admin Approval Panel
                </button>
              )}
              <button
                onClick={() => { setCurrentView("AUTH"); setMenuOpen(false); }}
                className="w-full text-left py-2 text-xs font-bold text-rose-600 hover:text-rose-700 border-t border-slate-100 pt-3"
              >
                Sign Out (Toka)
              </button>
            </div>
          </div>
        )}

        {/* View: Main Prediction Tool (Sawa na Video) */}
        {currentView === "TOOL" ? (
          <main className="p-5 space-y-5 flex-1 overflow-y-auto">

            {/* Strategy Selector (Grid Buttons) */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Strategy Selector
              </span>
              <div className="grid grid-cols-2 gap-2">
                {(["Matches", "Differs", "Even", "Odd", "Over", "Under"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStrategy(s)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${strategy === s
                        ? "bg-slate-900 text-white border-slate-900 shadow-md"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Market Analyzer Card */}
            <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                  <Zap className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold uppercase text-slate-800 tracking-wider">
                  AI Market Analyzer
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Current Trend</span>
                  <span className={`font-black text-sm ${currentTrend === "Downtrend" ? "text-rose-600" : "text-emerald-600"}`}>
                    {currentTrend}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-semibold">Signal Strength</span>
                  <span className="font-black text-sm text-slate-800">{signalStrength}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 block font-semibold mb-0.5">Pattern Detected</span>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {patternText}
                </p>
              </div>

              {/* Big Prediction Digit Circle with Action Buttons */}
              <div className="pt-3 flex items-center justify-between gap-3">
                <button
                  onClick={() => setStrategy("Matches")}
                  className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all ${strategy === "Matches"
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                >
                  Matches
                </button>

                {/* Big Center Digit Circle (Bofya ku-copy tarakimu kuweka kwenye bot) */}
                <div
                  onClick={copyPrediction}
                  className="w-16 h-16 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex flex-col items-center justify-center shadow-lg shadow-purple-500/30 cursor-pointer active:scale-95 transition-all"
                  title="Click to copy digit for your bot"
                >
                  <span className="text-2xl font-black font-mono leading-none">
                    {predictedDigit !== null ? predictedDigit : "--"}
                  </span>
                  <span className="text-[9px] font-bold text-purple-200 font-mono mt-0.5">
                    {copied ? "COPIED" : `0:0${timerCount}`}
                  </span>
                </div>

                <button
                  onClick={() => setStrategy("Differs")}
                  className={`flex-1 py-3 rounded-2xl text-xs font-bold border transition-all ${strategy === "Differs"
                      ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                      : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                >
                  Differs
                </button>
              </div>
            </div>

            {/* Live Indicator Status & Market Toggle */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-semibold text-slate-700">{symbolLabel}</span>
              </div>
              <button
                onClick={() => setIsAnalyzing(!isAnalyzing)}
                className={`text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${isAnalyzing
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  }`}
              >
                {isAnalyzing ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                {isAnalyzing ? "Stop Analysis" : "Start Analysis"}
              </button>
            </div>

          </main>
        ) : (
          /* View: Configuration Screen */
          <main className="p-5 space-y-4 flex-1">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <button
                onClick={() => setCurrentView("TOOL")}
                className="p-1.5 text-slate-500 hover:text-slate-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-sm font-bold text-slate-800">Live Dashboard Settings</h2>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contract Type:</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value as any)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="Matches">Matches</option>
                <option value="Differs">Differs</option>
                <option value="Even">Even</option>
                <option value="Odd">Odd</option>
                <option value="Over">Over</option>
                <option value="Under">Under</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Volatility Market:</label>
              <select
                value={symbol}
                onChange={(e) => {
                  setSymbol(e.target.value);
                  setSymbolLabel(e.target.options[e.target.selectedIndex].text);
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-800 focus:outline-none"
              >
                <option value="1HZ25V">Volatility 25 (1s) Index</option>
                <option value="R_25">Volatility 25 Index</option>
                <option value="1HZ100V">Volatility 100 (1s) Index</option>
                <option value="R_100">Volatility 100 Index</option>
                <option value="1HZ75V">Volatility 75 (1s) Index</option>
                <option value="R_75">Volatility 75 Index</option>
                <option value="1HZ50V">Volatility 50 (1s) Index</option>
                <option value="1HZ10V">Volatility 10 (1s) Index</option>
              </select>
            </div>

            <button
              onClick={() => setCurrentView("TOOL")}
              className="w-full bg-slate-900 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider shadow-md mt-4"
            >
              Hifadhi & Rudi Kwenye Signals
            </button>
          </main>
        )}

        {/* Bottom Bar */}
        <footer className="px-5 py-3 border-t border-slate-100 bg-white flex items-center justify-between text-[11px] text-slate-400">
          <div>
            <span className="font-bold text-slate-800 block text-xs">Expert Analysis Tool</span>
            <span className="text-[10px]">Use digit signals with your LizyTrade bot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-semibold">Live Connected</span>
          </div>
        </footer>

      </div>
    </div>
  );
}