"use client";

import React, { useState, useEffect, useRef } from "react";
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
  X
} from "lucide-react";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  derivId: string;
  password: string;
  plan: string;
  phone: string;
  txCode: string;
  receiptImage?: string;
  role: "ADMIN" | "USER";
  status: "APPROVED" | "PENDING" | "REJECTED";
}

export default function LizyTradeEnterprise() {
  // Views: 'AUTH' | 'SUBSCRIPTION_STEP' | 'WAITING_APPROVAL' | 'DASHBOARD' | 'ADMIN'
  const [currentView, setCurrentView] = useState<"AUTH" | "SUBSCRIPTION_STEP" | "WAITING_APPROVAL" | "DASHBOARD" | "ADMIN">("AUTH");
  const [authTab, setAuthTab] = useState<"LOGIN" | "REGISTER">("REGISTER");

  // Registration & Auth Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [derivAccountId, setDerivAccountId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Subscription & Payment Fields
  const [selectedPlan, setSelectedPlan] = useState<"1_MONTH" | "3_MONTHS" | "LIFETIME">("1_MONTH");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [transactionCode, setTransactionCode] = useState("");
  const [receiptImage, setReceiptImage] = useState<string>("");
  const [viewingReceipt, setViewingReceipt] = useState<string | null>(null);

  // Registered Users Mock Database
  const [usersList, setUsersList] = useState<UserRecord[]>([
    {
      id: "admin-root",
      name: "Benson Mkaine",
      email: "bensonlaizer53@gmail.com",
      derivId: "ROT91981412",
      password: "LizyTrade2026@",
      plan: "LIFETIME UNLIMITED VIP",
      phone: "0752642148",
      txCode: "FOUNDER-ROOT-MASTER",
      role: "ADMIN",
      status: "APPROVED",
    }
  ]);

  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);

  // Trading Engine States
  const [symbol, setSymbol] = useState("1HZ100V");
  const [ticksCount, setTicksCount] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundAlert, setSoundAlert] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("lizytrade_v5_users");
    if (saved) {
      try {
        setUsersList(JSON.parse(saved));
      } catch { }
    }
  }, []);

  const saveUsers = (updated: UserRecord[]) => {
    setUsersList(updated);
    localStorage.setItem("lizytrade_v5_users", JSON.stringify(updated));
  };

  // Convert uploaded image to Base64
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

  // Step 1: Handle Initial Form
  const handleInitialRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !derivAccountId || !userPassword) {
      alert("Tafadhali jaza taarifa zote za usajili!");
      return;
    }
    setCurrentView("SUBSCRIPTION_STEP");
  };

  // Step 2: Finalize Payment & Upload Screenshot
  const handleCompleteSubscription = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber || !transactionCode) {
      alert("Tafadhali jaza namba ya simu na Transaction Code ya malipo!");
      return;
    }

    const newUser: UserRecord = {
      id: Date.now().toString(),
      name: fullName,
      email: email.trim().toLowerCase(),
      derivId: derivAccountId.trim().toUpperCase(),
      password: userPassword,
      plan: selectedPlan === "1_MONTH" ? "1 MONTH PRO (Tsh 50,000)" : selectedPlan === "3_MONTHS" ? "3 MONTHS VIP (Tsh 120,000)" : "LIFETIME UNLIMITED (Tsh 250,000)",
      phone: phoneNumber,
      txCode: transactionCode,
      receiptImage: receiptImage || undefined,
      role: "USER",
      status: "PENDING",
    };

    const updated = [...usersList, newUser];
    saveUsers(updated);
    setCurrentView("WAITING_APPROVAL");
  };

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanDeriv = derivAccountId.trim().toUpperCase();

    // Founder Root Login
    if (
      (cleanEmail === "bensonlaizer53@gmail.com" || cleanDeriv === "ROT91981412") &&
      userPassword === "LizyTrade2026@"
    ) {
      const adminAcc = usersList[0];
      setCurrentUser(adminAcc);
      setCurrentView("DASHBOARD");
      return;
    }

    const user = usersList.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail &&
        u.derivId.toUpperCase() === cleanDeriv &&
        u.password === userPassword
    );

    if (!user) {
      alert("Taarifa si sahihi! Hakikisha Email, Deriv Account ID na Nenosiri viko sahihi.");
      return;
    }

    if (user.status !== "APPROVED") {
      setCurrentView("WAITING_APPROVAL");
      return;
    }

    setCurrentUser(user);
    setCurrentView("DASHBOARD");
  };

  // Admin Approval Handlers
  const approveUser = (id: string) => {
    const updated = usersList.map((u) => (u.id === id ? { ...u, status: "APPROVED" as const } : u));
    saveUsers(updated);
  };

  const rejectUser = (id: string) => {
    const updated = usersList.map((u) => (u.id === id ? { ...u, status: "REJECTED" as const } : u));
    saveUsers(updated);
  };

  // Signals API Fetcher
  const fetchSignals = async () => {
    try {
      const res = await fetch(`/api/signals?symbol=${symbol}&ticks=${ticksCount}`);
      const result = await res.json();
      if (result.status === "success") {
        setData(result);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Fetch error:", e);
    }
  };

  useEffect(() => {
    if (currentView === "DASHBOARD") {
      fetchSignals();
      if (autoRefresh) {
        timerRef.current = setInterval(fetchSignals, 2000);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentView, symbol, ticksCount, autoRefresh]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ==========================================
  // 1. AUTH SCREEN (LOGIN / REGISTER)
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
            <p className="text-xs text-slate-400">Uchambuzi wa Kiwango cha Juu kwa Bots za LizyTrade</p>
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
                  placeholder="mfano: ROT91981412"
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
                <span>Ingia Kwenye Dashibodi</span>
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
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Tengeneza Nenosiri (Password):</label>
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
  // 2. SUBSCRIPTION & PAYMENT SCREEN WITH RECEIPT UPLOAD
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

            {/* Receipt Screenshot Upload Box */}
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
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 active:scale-[0.98] cursor-pointer"
            >
              Wasilisha Taarifa za Malipo
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
  // 3. WAITING FOR APPROVAL SCREEN
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
              Taarifa zako na ushahidi wa malipo umepokelewa. Admin anahakiki taarifa zako na akaunti yako itawashwa mara moja.
            </p>
          </div>

          <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-4 text-xs text-left space-y-2 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-400">Hali (Status):</span>
              <span className="text-amber-400 font-bold uppercase">PENDING APPROVAL</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Msaada wa Haraka:</span>
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
  // 4. ADMIN PANEL (VIEW SCREENSHOTS & APPROVE)
  // ==========================================
  if (currentView === "ADMIN") {
    return (
      <div className="min-h-screen bg-[#040817] text-slate-100 p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-blue-900/40">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <Crown className="w-7 h-7 text-amber-400" />
                LizyTrade Admin Approval Panel
              </h1>
              <p className="text-xs text-slate-400">Kagua risiti, thibitisha watumiaji na wezesha akaunti zao</p>
            </div>
            <button
              onClick={() => setCurrentView("DASHBOARD")}
              className="bg-blue-600 hover:bg-blue-500 text-xs px-4 py-2.5 rounded-xl font-bold text-white transition-all shadow-lg shadow-blue-600/30"
            >
              Rudi Kwenye Dashibodi
            </button>
          </div>

          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-4">
              <Users className="w-4 h-4" /> Maombi ya Usajili na Malipo ({usersList.length})
            </h2>

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
                          {user.name}
                          {user.role === "ADMIN" && <Crown className="w-3.5 h-3.5 text-amber-400 inline" />}
                        </span>
                        <span className="text-[10px] text-slate-400">{user.email}</span>
                      </td>
                      <td className="py-3 px-3 text-cyan-400 font-bold">{user.derivId}</td>
                      <td className="py-3 px-3 text-slate-300">{user.phone}</td>
                      <td className="py-3 px-3 text-slate-300 font-sans text-[11px]">{user.plan}</td>
                      <td className="py-3 px-3 text-amber-400 font-bold">{user.txCode}</td>
                      <td className="py-3 px-3 font-sans">
                        {user.receiptImage ? (
                          <button
                            onClick={() => setViewingReceipt(user.receiptImage || null)}
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

        {/* Modal: View Receipt Screenshot */}
        {viewingReceipt && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <div className="bg-[#0a1128] border border-blue-900/60 rounded-3xl p-6 max-w-lg w-full space-y-4 relative">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Ushahidi wa Malipo (Screenshot)</h3>
                <button
                  onClick={() => setViewingReceipt(null)}
                  className="text-slate-400 hover:text-white"
                >
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
  // 5. LIVE TRADING DASHBOARD
  // ==========================================
  return (
    <div className="min-h-screen bg-[#040817] text-slate-100 p-4 md:p-8 font-sans">
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
              Mtumiaji: <strong className="text-white font-bold">{currentUser?.name}</strong> | Deriv Account ID: <strong className="text-cyan-400 font-mono">{currentUser?.derivId}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {currentUser?.role === "ADMIN" && (
            <button
              onClick={() => setCurrentView("ADMIN")}
              className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs px-3.5 py-2 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/10"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Admin Approval Panel</span>
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

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between border-b border-blue-900/40 pb-3">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" /> Mipangilio ya Soko
              </h2>
              <button
                onClick={() => setSoundAlert(!soundAlert)}
                className={`p-1.5 rounded-lg border transition-all ${soundAlert ? "bg-cyan-500/20 border-cyan-500/40 text-cyan-400" : "bg-slate-800 border-slate-700 text-slate-500"
                  }`}
              >
                {soundAlert ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Synthetic Index:</label>
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="w-full bg-[#040817] border border-blue-900/60 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                <option value="1HZ100V">Volatility 100 (1s) Index</option>
                <option value="R_100">Volatility 100 Index</option>
                <option value="1HZ75V">Volatility 75 (1s) Index</option>
                <option value="R_75">Volatility 75 Index</option>
                <option value="1HZ50V">Volatility 50 (1s) Index</option>
                <option value="R_50">Volatility 50 Index</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1.5">Ticks Window:</label>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map((count) => (
                  <button
                    key={count}
                    onClick={() => setTicksCount(count)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${ticksCount === count
                        ? "bg-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20"
                        : "bg-[#040817] border-blue-900/40 text-slate-400"
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
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${autoRefresh ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-400"
                  }`}
              >
                <RefreshCw className={`w-3 h-3 ${autoRefresh ? "animate-spin" : ""}`} />
                {autoRefresh ? "Live Active" : "Paused"}
              </button>
            </div>
          </div>

          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4" /> Unganisha na Tovuti Yako (Embed Code)
            </h3>
            <div className="bg-[#040817] border border-blue-900/60 rounded-xl p-3 text-[10px] font-mono text-cyan-400 break-all select-all">
              {`<iframe src="https://deriv-analysis-tool-psi.vercel.app" width="100%" height="750px" frameborder="0"></iframe>`}
            </div>
            <button
              onClick={() => copyToClipboard(`<iframe src="https://deriv-analysis-tool-psi.vercel.app" width="100%" height="750px" frameborder="0"></iframe>`)}
              className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-cyan-300 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "Imenakiliwa!" : "Copy Embed Code"}</span>
            </button>
          </div>
        </div>

        {/* Signals and Statistics */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-blue-900/40">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xs font-bold text-white uppercase tracking-wider">AI Signal Recommendation</h2>
              </div>
              <span className="text-[11px] font-mono text-slate-400">Imesasishwa: {lastUpdated || "Inasoma..."}</span>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Uamuzi (Action)</span>
                <span className={`text-xl font-black mt-1 block ${data?.aiRecommendation?.highProbabilityEdge ? "text-emerald-400 animate-pulse" : "text-amber-400"}`}>
                  {data?.aiRecommendation?.action || "ANALYZING..."}
                </span>
              </div>

              <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Prediction Target</span>
                  <span className="text-2xl font-black text-cyan-400 mt-0.5 block font-mono">
                    {data?.aiRecommendation?.target || "--"}
                  </span>
                </div>
                {data?.aiRecommendation?.target && data.aiRecommendation?.target !== "--" && (
                  <button
                    onClick={() => copyToClipboard(data.aiRecommendation.target.replace("DIGIT ", ""))}
                    className="p-2 bg-blue-600/20 hover:bg-blue-600/40 border border-blue-500/30 text-cyan-300 rounded-xl"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase block tracking-wider">Confidence Score</span>
                <span className="text-2xl font-black text-blue-400 mt-0.5 block font-mono">
                  {data?.aiRecommendation?.confidenceScore || "--"}
                </span>
              </div>
            </div>

            <div className="mt-4 bg-[#040817]/80 border border-blue-900/30 rounded-2xl p-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Sababu ya Kiufundi:</span>
              <p className="text-xs text-slate-300 italic">
                {data?.aiRecommendation?.reason || "Inakusanya ticks na kuhesabu probability matrices..."}
              </p>
            </div>
          </div>

          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Digit Distribution Heatmap (0 - 9)
            </h3>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {Array.from({ length: 10 }).map((_, digit) => {
                const pct = data?.analysis?.digitFrequency[digit] || 0;
                const isCold = pct <= 7;
                const isHot = pct >= 14;

                return (
                  <div
                    key={digit}
                    className={`border rounded-2xl p-2.5 text-center transition-all ${isCold ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300" : isHot ? "bg-rose-500/10 border-rose-500/40 text-rose-300" : "bg-[#040817] border-blue-900/40 text-slate-300"
                      }`}
                  >
                    <span className="text-sm font-black block font-mono">{digit}</span>
                    <span className="text-[11px] font-mono block mt-0.5">{pct}%</span>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-blue-900/40">
              <div className="bg-[#040817] border border-blue-900/40 rounded-2xl p-4">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-cyan-400">EVEN: {data?.analysis?.evenPercentage || "0%"}</span>
                  <span className="text-indigo-400">ODD: {data?.analysis?.oddPercentage || "0%"}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-cyan-500 h-full" style={{ width: data?.analysis?.evenPercentage || "50%" }} />
                  <div className="bg-indigo-500 h-full" style={{ width: data?.analysis?.oddPercentage || "50%" }} />
                </div>
              </div>

              <div className="bg-[#040817] border border-blue-900/40 rounded-2xl p-4">
                <div className="flex justify-between text-xs font-bold mb-2">
                  <span className="text-blue-400">UNDER (0-4): {data?.analysis?.underPercentage || "0%"}</span>
                  <span className="text-emerald-400">OVER (5-9): {data?.analysis?.overPercentage || "0%"}</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden flex">
                  <div className="bg-blue-500 h-full" style={{ width: data?.analysis?.underPercentage || "50%" }} />
                  <div className="bg-emerald-500 h-full" style={{ width: data?.analysis?.overPercentage || "50%" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}