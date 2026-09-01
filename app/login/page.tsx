"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
    getStoredUsers,
    saveUsers,
    setCurrentUserSession,
    AppUser,
} from "@/lib/authStore";
import { Shield, Lock, Mail, User as UserIcon, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";

export default function AuthPage() {
    const router = useRouter();
    const [isLoginTab, setIsLoginTab] = useState(false); // Anza na tab ya usajili kwa urahisi
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleAuth = (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        const users = getStoredUsers();

        if (isLoginTab) {
            // Logic ya Kuingia (Login)
            const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
            if (!found) {
                setError("Akaunti hii haipo. Tafadhali jisajili kwanza.");
                return;
            }

            if (found.role === "ADMIN") {
                setCurrentUserSession(found);
                router.push("/admin");
                return;
            }

            // Kama bado hajawasilisha muamala wa subscription
            if (!found.transactionRef) {
                setCurrentUserSession(found);
                router.push("/subscribe");
                return;
            }

            // Kama amewasilisha muamala lakini admin hajam-approve
            if (found.status === "PENDING") {
                setError("Malipo yako yameshapokelewa! Tafadhali subiri idhini kutoka kwa Admin (Waiting for Admin Approval).");
                return;
            }

            if (found.status === "REJECTED") {
                setError("Akaunti yako imekataliwa na Admin. Tafadhali wasiliana na support.");
                return;
            }

            if (!found.isSubscribed) {
                setCurrentUserSession(found);
                router.push("/subscribe");
                return;
            }

            setCurrentUserSession(found);
            router.push("/");
        } else {
            // Logic ya Kujisajili (Register) -> Moja kwa moja inaelekea /subscribe
            if (!name || !email || !password) {
                setError("Tafadhali jaza sehemu zote.");
                return;
            }

            const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
            if (exists) {
                setError("Barua pepe hii tayari imeshasajiliwa. Tafadhali ingia.");
                return;
            }

            const newUser: AppUser = {
                id: `user-${Date.now()}`,
                name,
                email,
                role: "USER",
                status: "PENDING",
                isSubscribed: false,
                createdAt: new Date().toISOString(),
            };

            users.push(newUser);
            saveUsers(users);

            // Weka session na mpeleke moja kwa moja kwenye ukurasa wa Subscription
            setCurrentUserSession(newUser);
            router.push("/subscribe");
        }
    };

    return (
        <div className="min-h-screen bg-[#070d1e] flex items-center justify-center p-4 font-sans text-slate-100">
            <div className="w-full max-w-md bg-[#0d1838] border border-[#152454] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="text-center mb-8">
                    <div className="w-14 h-14 bg-blue-600/20 border border-blue-500/40 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400">
                        <Shield className="w-7 h-7" />
                    </div>
                    <h1 className="text-2xl font-black tracking-wide bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                        DERIV DIGIT PRO
                    </h1>
                    <p className="text-xs text-slate-400 mt-1">Mfumo Salama wa Uchambuzi wa Synthetic Indices</p>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-[#070d1e] p-1 rounded-xl border border-[#152454] mb-6">
                    <button
                        type="button"
                        onClick={() => {
                            setIsLoginTab(false);
                            setError("");
                            setSuccess("");
                        }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${!isLoginTab ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                            }`}
                    >
                        1. Jisajili (Register)
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            setIsLoginTab(true);
                            setError("");
                            setSuccess("");
                        }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${isLoginTab ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-white"
                            }`}
                    >
                        2. Ingia (Login)
                    </button>
                </div>

                {error && (
                    <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-xs text-rose-400">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        <span>{success}</span>
                    </div>
                )}

                <form onSubmit={handleAuth} className="space-y-4">
                    {!isLoginTab && (
                        <div>
                            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Jina Kamili</label>
                            <div className="relative">
                                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                                <input
                                    type="text"
                                    required
                                    placeholder="Mfano: Benson Ally"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full bg-[#070d1e] border border-[#152454] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                                />
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Barua Pepe (Email)</label>
                        <div className="relative">
                            <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                                type="email"
                                required
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#070d1e] border border-[#152454] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">Nenosiri (Password)</label>
                        <div className="relative">
                            <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                            <input
                                type="password"
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-[#070d1e] border border-[#152454] rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full mt-2 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/25 active:scale-95 cursor-pointer"
                    >
                        <span>{!isLoginTab ? "Jisajili & Endelea na Malipo" : "Ingia Kwenye Akaunti"}</span>
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </form>

                <div className="mt-6 pt-5 border-t border-[#152454]/60 text-[11px] text-slate-400 text-center">
                    Admin Portal: <strong className="text-cyan-400">admin@derivpro.com</strong>
                </div>
            </div>
        </div>
    );
}