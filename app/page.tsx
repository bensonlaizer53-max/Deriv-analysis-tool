"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Zap,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Activity,
  BarChart3,
  Sliders,
  Copy,
  Check,
  RefreshCw,
  UserCheck,
  CreditCard,
  Volume2,
  VolumeX,
  ExternalLink,
  MessageCircle,
  PhoneCall,
  Users,
  Code2,
  KeyRound,
  Eye,
  EyeOff
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
  status: "APPROVED" | "PENDING" | "REJECTED";
}

export default function LizyTradeEnterpriseApp() {
  const [currentView, setCurrentView] = useState<"PORTAL" | "DASHBOARD" | "ADMIN">("PORTAL");
  const [authMode, setAuthMode] = useState<"LOGIN" | "REGISTER">("REGISTER");

  // Registration & Login Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [derivAccountId, setDerivAccountId] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<"1_MONTH" | "3_MONTHS" | "LIFETIME">("1_MONTH");
  const [transactionCode, setTransactionCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Active Session
  const [currentUser, setCurrentUser] = useState<UserRecord | null>(null);

  // Admin Credentials
  const [adminPassword, setAdminPassword] = useState("");
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  // Local Storage Database for Users
  const [usersList, setUsersList] = useState<UserRecord[]>([
    {
      id: "1",
      name: "Benson Mkaine (Founder)",
      email: "bensonlaizer53@gmail.com",
      derivId: "CR9182345",
      password: "admin",
      plan: "LIFETIME VIP",
      phone: "0752642148",
      txCode: "FOUNDER-DIRECT",
      status: "APPROVED",
    }
  ]);

  // Live Trading Engine States
  const [symbol, setSymbol] = useState("1HZ100V");
  const [ticksCount, setTicksCount] = useState(100);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [soundAlert, setSoundAlert] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const ADMIN_PASS_KEY = "LizyTradeAdmin2026@";

  // Load saved users from LocalStorage on first render
  useEffect(() => {
    const saved = localStorage.getItem("lizytrade_registered_users");
    if (saved) {
      try {
        setUsersList(JSON.parse(saved));
      } catch { }
    }
  }, []);

  const saveUsersToStorage = (users: UserRecord[]) => {
    setUsersList(users);
    localStorage.setItem("lizytrade_registered_users", JSON.stringify(users));
  };

  // User Registration
  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !derivAccountId || !phoneNumber || !transactionCode || !userPassword) {
      alert("Tafadhali jaza sehemu zote kikamilifu!");
      return;
    }

    const newUser: UserRecord = {
      id: Date.now().toString(),
      name: fullName || email.split("@")[0],
      email,
      derivId: derivAccountId,
      password: userPassword,
      plan: selectedPlan === "1_MONTH" ? "1 MONTH PRO (Tsh 50,000)" : selectedPlan === "3_MONTHS" ? "3 MONTHS VIP (Tsh 120,000)" : "LIFETIME UNLIMITED (Tsh 250,000)",
      phone: phoneNumber,
      txCode: transactionCode,
      status: "PENDING",
    };

    const updated = [...usersList, newUser];
    saveUsersToStorage(updated);
    alert("Usajili wako umepokelewa kwa mafanikio! Tafadhali subiri Admin athibitishe malipo yako au wasiliana naye kupitia WhatsApp ili akaunti iwashwe.");
    setAuthMode("LOGIN");
  };

  // User Password Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = usersList.find(
      (u) =>
        (u.email.toLowerCase() === email.toLowerCase() ||
          u.derivId.toLowerCase() === derivAccountId.toLowerCase()) &&
        u.password === userPassword
    );

    if (!user) {
      alert("Email/Deriv ID au Nenosiri (Password) si sahihi! Hakikisha umejisajili kwanza.");
      return;
    }

    if (user.status !== "APPROVED") {
      alert("Akaunti yako bado ipo 'PENDING APPROVAL'. Tafadhali wasiliana na Admin kupitia WhatsApp kuthibitisha malipo.");
      return;
    }

    setCurrentUser(user);
    setCurrentView("DASHBOARD");
  };

  // Admin Handlers
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === ADMIN_PASS_KEY) {
      setIsAdminLoggedIn(true);
    } else {
      alert("Nenosiri la Admin si sahihi!");
    }
  };

  const approveUser = (id: string) => {
    const updated = usersList.map((u) => (u.id === id ? { ...u, status: "APPROVED" as const } : u));
    saveUsersToStorage(updated);
  };

  const rejectUser = (id: string) => {
    const updated = usersList.map((u) => (u.id === id ? { ...u, status: "REJECTED" as const } : u));
    saveUsersToStorage(updated);
  };

  // Live Signals API
  const fetchSignals = async () => {
    try {
      const res = await fetch(`/api/signals?symbol=${symbol}&ticks=${ticksCount}`);
      const result = await res.json();
      if (result.status === "success") {
        setData(result);
        setLastUpdated(new Date().toLocaleTimeString());
      }
    } catch (e) {
      console.error("Signal fetch error:", e);
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
  // VIEW 1: ADMIN CONTROL PANEL
  // ==========================================
  if (currentView === "ADMIN") {
    return (
      <div className="min-h-screen bg-[#040817] text-slate-100 p-4 md:p-8 font-sans">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center pb-4 border-b border-blue-900/40">
            <div>
              <h1 className="text-2xl font-black text-white flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-cyan-400" />
                LizyTrade Admin Approval Portal
              </h1>
              <p className="text-xs text-slate-400">Dhibiti malipo, thibitisha watumiaji na wezesha akaunti zao</p>
            </div>
            <button
              onClick={() => setCurrentView("PORTAL")}
              className="bg-slate-800 hover:bg-slate-700 text-xs px-4 py-2 rounded-xl text-slate-200"
            >
              Rudi Portal
            </button>
          </div>

          {!isAdminLoggedIn ? (
            <div className="max-w-md mx-auto bg-[#0a1128] border border-blue-900/40 p-8 rounded-3xl mt-12 space-y-4">
              <h2 className="text-sm font-bold text-white uppercase text-center">Weka Admin Master Password</h2>
              <form onSubmit={handleAdminAuth} className="space-y-4">
                <input
                  type="password"
                  placeholder="Master Admin Key"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl text-xs uppercase"
                >
                  Fungua Admin Panel
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-2 mb-4">
                <Users className="w-4 h-4" /> Orodha ya Watumiaji na Malipo ({usersList.length})
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-blue-900/40 text-slate-400 font-semibold uppercase text-[10px]">
                      <th className="py-3 px-3">Mtumiaji</th>
                      <th className="py-3 px-3">Deriv Account</th>
                      <th className="py-3 px-3">Simu ya Malipo</th>
                      <th className="py-3 px-3">Kifurushi</th>
                      <th className="py-3 px-3">Transaction Code</th>
                      <th className="py-3 px-3">Password</th>
                      <th className="py-3 px-3">Hali (Status)</th>
                      <th className="py-3 px-3 text-center">Hatua</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-blue-900/20 font-mono">
                    {usersList.map((user) => (
                      <tr key={user.id} className="hover:bg-blue-950/20">
                        <td className="py-3 px-3 font-sans">
                          <span className="font-bold text-white block">{user.name}</span>
                          <span className="text-[10px] text-slate-400">{user.email}</span>
                        </td>
                        <td className="py-3 px-3 text-cyan-400 font-bold">{user.derivId}</td>
                        <td className="py-3 px-3 text-slate-300">{user.phone}</td>
                        <td className="py-3 px-3 text-slate-300 font-sans text-[11px]">{user.plan}</td>
                        <td className="py-3 px-3 text-amber-400 font-bold">{user.txCode}</td>
                        <td className="py-3 px-3 text-slate-400">{user.password}</td>
                        <td className="py-3 px-3">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase font-sans ${user.status === "APPROVED" ? "bg-emerald-500/20 text-emerald-400" : user.status === "PENDING" ? "bg-amber-500/20 text-amber-400" : "bg-rose-500/20 text-rose-400"
                            }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center space-x-2">
                          {user.status !== "APPROVED" && (
                            <button
                              onClick={() => approveUser(user.id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans"
                            >
                              Approve
                            </button>
                          )}
                          {user.status !== "REJECTED" && (
                            <button
                              onClick={() => rejectUser(user.id)}
                              className="bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/30 px-2 py-1 rounded-lg text-[10px] font-sans"
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
          )}
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW 2: REGISTRATION & LOGIN PORTAL
  // ==========================================
  if (currentView === "PORTAL") {
    return (
      <div className="min-h-screen bg-[#040817] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(37,99,235,0.25),rgba(255,255,255,0))] text-slate-100 p-4 md:p-8 font-sans flex flex-col justify-between">
        <div className="max-w-4xl mx-auto w-full my-auto py-8">
          {/* Header */}
          <div className="text-center space-y-3 mb-8">
            <div className="inline-flex p-3.5 bg-gradient-to-br from-blue-600/30 to-cyan-500/20 border border-cyan-500/40 rounded-3xl text-cyan-400 shadow-xl shadow-cyan-500/10">
              <Zap className="w-9 h-9" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white">
              LizyTrade AI Signal Pro
            </h1>
            <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto">
              Mfumo Mahiri wa Uchambuzi wa Namba za Synthetic Indices kwa Bots za LizyTrade na Tovuti Binafsi za Watumiaji.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Payment Info */}
            <div className="lg:col-span-5 bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-2xl space-y-6">
              <div>
                <h3 className="text-xs font-black text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard className="w-4 h-4" /> Vifurushi vya Subscription
                </h3>
                <div className="mt-3 space-y-2.5">
                  <div
                    onClick={() => setSelectedPlan("1_MONTH")}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedPlan === "1_MONTH" ? "bg-blue-600/20 border-cyan-400 text-white" : "bg-[#040817] border-blue-900/30 text-slate-400"
                      }`}
                  >
                    <div>
                      <span className="font-bold text-xs block text-white">1 Month Pro License</span>
                      <span className="text-[10px] text-slate-400">Signals + Deriv Account Support</span>
                    </div>
                    <span className="text-xs font-black text-emerald-400 font-mono">Tsh 50,000</span>
                  </div>

                  <div
                    onClick={() => setSelectedPlan("3_MONTHS")}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedPlan === "3_MONTHS" ? "bg-blue-600/20 border-cyan-400 text-white" : "bg-[#040817] border-blue-900/30 text-slate-400"
                      }`}
                  >
                    <div>
                      <span className="font-bold text-xs block text-white">3 Months VIP Access</span>
                      <span className="text-[10px] text-slate-400">High Speed Signals + VIP Support</span>
                    </div>
                    <span className="text-xs font-black text-emerald-400 font-mono">Tsh 120,000</span>
                  </div>

                  <div
                    onClick={() => setSelectedPlan("LIFETIME")}
                    className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${selectedPlan === "LIFETIME" ? "bg-blue-600/20 border-cyan-400 text-white" : "bg-[#040817] border-blue-900/30 text-slate-400"
                      }`}
                  >
                    <div>
                      <span className="font-bold text-xs block text-white">Lifetime Unlimited VIP</span>
                      <span className="text-[10px] text-slate-400">Direct API Embed + Site Integration</span>
                    </div>
                    <span className="text-xs font-black text-emerald-400 font-mono">Tsh 250,000</span>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div className="pt-4 border-t border-blue-900/40 space-y-3">
                <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-400" /> Njia za Malipo:
                </h3>

                <div className="bg-[#040817] border border-blue-900/50 rounded-2xl p-3.5 space-y-2 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Namba ya Malipo (M-Pesa):</span>
                    <span className="font-mono font-black text-cyan-300 text-sm">0752 642 148</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-blue-900/30">
                    <span className="text-slate-400">Jina la Usajili:</span>
                    <span className="font-bold text-white uppercase">BENSON LAIZER MKAINE</span>
                  </div>
                </div>

                <a
                  href="https://wa.me/255628940590?text=Habari%20LizyTrade,%20nimekamilisha%20malipo%20ya%20subscription%20ya%20AI%20Signals."
                  target="_blank"
                  rel="noreferrer"
                  className="w-full bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/10"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>WhatsApp: 0628 940 590 (Thibitisha Malipo)</span>
                </a>
              </div>
            </div>

            {/* Right: Auth Forms */}
            <div className="lg:col-span-7 bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
              <div className="flex bg-[#040817] p-1 rounded-2xl border border-blue-900/40">
                <button
                  onClick={() => setAuthMode("REGISTER")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${authMode === "REGISTER" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white"
                    }`}
                >
                  1. Jisajili & Lipia
                </button>
                <button
                  onClick={() => setAuthMode("LOGIN")}
                  className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${authMode === "LOGIN" ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20" : "text-slate-400 hover:text-white"
                    }`}
                >
                  2. Ingia (Login kwa Password)
                </button>
              </div>

              {authMode === "REGISTER" ? (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Jina Kamili:</label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Mfano: Rashid Ally"
                      className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-sans"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Barua Pepe (Email):</label>
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="jina@example.com"
                        className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Deriv Account ID:</label>
                      <input
                        type="text"
                        required
                        value={derivAccountId}
                        onChange={(e) => setDerivAccountId(e.target.value)}
                        placeholder="CR918234 / VRTC123"
                        className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono uppercase"
                      />
                    </div>
                  </div>

                  {/* Password Creation */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Tengeneza Nenosiri (Password):</label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={userPassword}
                        onChange={(e) => setUserPassword(e.target.value)}
                        placeholder="Weka password yako salama"
                        className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
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

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Namba ya Simu ya Malipo:</label>
                      <input
                        type="text"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0755..."
                        className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Transaction ID / Code:</label>
                      <input
                        type="text"
                        required
                        value={transactionCode}
                        onChange={(e) => setTransactionCode(e.target.value)}
                        placeholder="Mfano: QRT88921"
                        className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono uppercase"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] mt-2 cursor-pointer"
                  >
                    Tuma Ombi la Usajili
                  </button>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Email au Deriv Account ID:</label>
                    <input
                      type="text"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="bensonlaizer53@gmail.com au CR9182345"
                      className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
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
                        className="w-full bg-[#040817] border border-blue-900/50 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-slate-400 hover:text-white"
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
                    <span>Ingia kwenye AI Trading Tool</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Footer with Admin Panel Link */}
        <footer className="max-w-4xl mx-auto w-full pt-6 border-t border-blue-900/40 flex justify-between items-center text-[11px] text-slate-500">
          <span>&copy; 2026 LizyTrade Pro AI. All Rights Reserved.</span>
          <button
            onClick={() => setCurrentView("ADMIN")}
            className="text-slate-400 hover:text-cyan-400 font-bold transition-all"
          >
            Admin Approval Panel &rarr;
          </button>
        </footer>
      </div>
    );
  }

  // ==========================================
  // VIEW 3: LIVE ACTIVE DASHBOARD & EMBED CODES
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
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                VIP ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Mtumiaji: <strong className="text-white font-bold">{currentUser?.name || "Benson Mkaine"}</strong> | Deriv ID: <strong className="text-cyan-400 font-mono">{currentUser?.derivId || "CR9182345"}</strong>
            </p>
          </div>
        </div>

        <button
          onClick={() => setCurrentView("PORTAL")}
          className="text-xs text-rose-400 hover:text-rose-300 bg-rose-500/10 px-4 py-2 rounded-xl border border-rose-500/20 font-bold transition-all"
        >
          Toka Kwenye Akaunti
        </button>
      </header>

      {/* Main Grid Content */}
      <main className="max-w-7xl mx-auto mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
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

          {/* Third-Party Site Embed / Integration Box */}
          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl space-y-3">
            <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-2">
              <Code2 className="w-4 h-4" /> Unganisha na Tovuti Yako (Embed / API)
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Weka msimbo huu kwenye tovuti yako yoyote ili tool hii ionekane na kutoa signals mubashara:
            </p>
            <div className="bg-[#040817] border border-blue-900/60 rounded-xl p-3 text-[10px] font-mono text-cyan-400 break-all select-all">
              {`<iframe src="https://deriv-analysis-tool-psi.vercel.app" width="100%" height="750px" frameborder="0"></iframe>`}
            </div>
            <button
              onClick={() => copyToClipboard(`<iframe src="https://deriv-analysis-tool-psi.vercel.app" width="100%" height="750px" frameborder="0"></iframe>`)}
              className="w-full bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-cyan-300 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "Imenakiliwa!" : "Copy Embed Code"}</span>
            </button>
          </div>
        </div>

        {/* Right Columns: AI Signals & Heatmap */}
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
                {data?.aiRecommendation?.target && data.aiRecommendation.target !== "--" && (
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

          {/* Digit Heatmap */}
          <div className="bg-[#0a1128] border border-blue-900/40 rounded-3xl p-6 shadow-xl">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2 mb-4">
              <BarChart3 className="w-4 h-4 text-cyan-400" /> Digit Heatmap (0 - 9)
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