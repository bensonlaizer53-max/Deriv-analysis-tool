"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    getStoredUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUserSession,
    AppUser,
} from "@/lib/authStore";
import {
    Users,
    CreditCard,
    LogOut,
    CheckCircle,
    XCircle,
    Shield,
    Activity,
    Receipt,
} from "lucide-react";

export default function AdminDashboard() {
    const router = useRouter();
    const [users, setUsers] = useState<AppUser[]>([]);
    const [adminUser, setAdminUser] = useState<AppUser | null>(null);

    useEffect(() => {
        const current = getCurrentUser();
        if (!current || current.role !== "ADMIN") {
            router.push("/login");
            return;
        }
        setAdminUser(current);
        setUsers(getStoredUsers());
    }, [router]);

    // Function ya Approve: Inampa mtumiaji APPROVED na isSubscribed: true kwa pamoja mara moja
    const handleApprove = (userId: string) => {
        const updated = users.map((u) =>
            u.id === userId
                ? { ...u, status: "APPROVED" as const, isSubscribed: true }
                : u
        );
        setUsers(updated);
        saveUsers(updated);
    };

    const handleReject = (userId: string) => {
        const updated = users.map((u) =>
            u.id === userId
                ? { ...u, status: "REJECTED" as const, isSubscribed: false }
                : u
        );
        setUsers(updated);
        saveUsers(updated);
    };

    const handleToggleSubscription = (userId: string) => {
        const updated = users.map((u) =>
            u.id === userId ? { ...u, isSubscribed: !u.isSubscribed } : u
        );
        setUsers(updated);
        saveUsers(updated);
    };

    const handleLogout = () => {
        setCurrentUserSession(null);
        router.push("/login");
    };

    const totalUsers = users.filter((u) => u.role !== "ADMIN").length;
    const pendingApprovals = users.filter(
        (u) => u.role !== "ADMIN" && u.status === "PENDING"
    ).length;
    const activeSubscriptions = users.filter(
        (u) => u.role !== "ADMIN" && u.isSubscribed
    ).length;

    return (
        <div className="min-h-screen bg-[#070d1e] text-slate-100 p-4 md:p-8 font-sans">
            <header className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 mb-8 pb-6 border-b border-[#152454]">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-cyan-400">
                        <Shield className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black tracking-wide bg-gradient-to-r from-white via-slate-200 to-blue-400 bg-clip-text text-transparent">
                            ADMIN CONTROL PANEL
                        </h1>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Super Admin: <span className="text-cyan-400 font-semibold">{adminUser?.email}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push("/")}
                        className="flex items-center gap-2 bg-[#0d1838] hover:bg-[#152454] border border-[#152454] px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <Activity className="w-4 h-4 text-cyan-400" />
                        Tazama Tool (Live App)
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto space-y-8">
                {/* Metric Cards */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0d1838] border border-[#152454] p-6 rounded-2xl flex items-center gap-4 shadow-xl">
                        <div className="p-3.5 bg-blue-600/20 text-cyan-400 rounded-xl border border-blue-500/30">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Jumla ya Watumiaji</p>
                            <h3 className="text-3xl font-black text-white mt-1">{totalUsers}</h3>
                        </div>
                    </div>

                    <div className="bg-[#0d1838] border border-[#152454] p-6 rounded-2xl flex items-center gap-4 shadow-xl">
                        <div className="p-3.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Wanaosubiri Idhini</p>
                            <h3 className="text-3xl font-black text-white mt-1">{pendingApprovals}</h3>
                        </div>
                    </div>

                    <div className="bg-[#0d1838] border border-[#152454] p-6 rounded-2xl flex items-center gap-4 shadow-xl">
                        <div className="p-3.5 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                            <CreditCard className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Subscriptions Zilizo Hai</p>
                            <h3 className="text-3xl font-black text-white mt-1">{activeSubscriptions}</h3>
                        </div>
                    </div>
                </section>

                {/* Users & Subscription Table */}
                <section className="bg-[#0d1838] border border-[#152454] rounded-2xl shadow-xl overflow-hidden">
                    <div className="p-6 border-b border-[#152454]">
                        <h2 className="text-lg font-bold text-white">Usimamizi wa Watumiaji & Malipo ya Subscriptions</h2>
                        <p className="text-xs text-slate-400 mt-0.5">Kagua muamala wa kila mtumiaji kabla ya kumfungulia tool</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-[#070d1e] text-xs text-slate-400 uppercase tracking-wider border-b border-[#152454]">
                                <tr>
                                    <th className="py-4 px-6">Mtumiaji</th>
                                    <th className="py-4 px-6">Email</th>
                                    <th className="py-4 px-6">Hali ya Idhini</th>
                                    <th className="py-4 px-6">Taarifa za Malipo (Tx ID)</th>
                                    <th className="py-4 px-6">Subscription Status</th>
                                    <th className="py-4 px-6 text-right">Vitendo</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#152454]/60">
                                {users
                                    .filter((u) => u.role !== "ADMIN")
                                    .map((user) => (
                                        <tr key={user.id} className="hover:bg-[#152454]/30 transition-colors">
                                            <td className="py-4 px-6 font-bold text-white">{user.name}</td>
                                            <td className="py-4 px-6 text-slate-300 font-mono text-xs">{user.email}</td>
                                            <td className="py-4 px-6">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${user.status === "APPROVED"
                                                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                                                            : user.status === "PENDING"
                                                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                                                : "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                                                        }`}
                                                >
                                                    {user.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                {user.transactionRef ? (
                                                    <div className="text-xs space-y-0.5">
                                                        <div className="text-cyan-400 font-bold">{user.subscriptionPlan}</div>
                                                        <div className="text-slate-300">{user.subscriptionFee} • {user.paymentMethod}</div>
                                                        <div className="font-mono text-[11px] text-amber-400 bg-[#070d1e] px-2 py-0.5 rounded border border-[#152454] inline-block">
                                                            Ref: {user.transactionRef}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-500">Bado hajawasilisha malipo</span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <button
                                                    onClick={() => handleToggleSubscription(user.id)}
                                                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-all ${user.isSubscribed
                                                            ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-600/30"
                                                            : "bg-slate-700/30 text-slate-400 border border-slate-600/40 hover:bg-slate-700/50"
                                                        }`}
                                                >
                                                    {user.isSubscribed ? "ACTIVE (Imewashwa)" : "INACTIVE (Imezimwa)"}
                                                </button>
                                            </td>
                                            <td className="py-4 px-6 text-right space-x-2">
                                                {user.status !== "APPROVED" && (
                                                    <button
                                                        onClick={() => handleApprove(user.id)}
                                                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                                                    >
                                                        <CheckCircle className="w-3.5 h-3.5" />
                                                        Approve
                                                    </button>
                                                )}
                                                {user.status !== "REJECTED" && (
                                                    <button
                                                        onClick={() => handleReject(user.id)}
                                                        className="inline-flex items-center gap-1 bg-rose-600/20 hover:bg-rose-600/40 text-rose-400 border border-rose-500/40 px-3 py-1.5 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                                                    >
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        Reject
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                {users.filter((u) => u.role !== "ADMIN").length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                                            Hakuna watumiaji waliojisajili kwa sasa. Jisajili kupitia ukurasa wa Login kupima.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </main>
        </div>
    );
}