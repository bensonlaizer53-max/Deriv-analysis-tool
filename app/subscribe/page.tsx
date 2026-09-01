// app/subscribe/page.tsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
    getCurrentUser,
    setCurrentUserSession,
    getStoredUsers,
    saveUsers,
    AppUser,
} from "@/lib/authStore";
import {
    Check,
    Shield,
    Crown,
    Lock,
    ArrowRight,
    LogOut,
    Smartphone,
    Wallet,
    Clock,
    RefreshCw,
    MessageCircle,
    Upload,
    Image as ImageIcon,
    X,
} from "lucide-react";

const PLANS = [
    {
        id: "weekly",
        name: "Weekly Trader Pass",
        fullPriceDisplay: "Weekly Trader Pass: TZS 40,000 au $15 / Wiki 1 (Siku 7)",
        priceTzs: "TZS 40,000",
        priceUsd: "$15",
        desc: "Uchambuzi wa haraka wa live digits kwa wiki moja nzima",
        features: [
            "Live Last Digit Predictions",
            "Over / Under Strategy Stream",
            "Even / Odd Ratio Analysis",
            "15s Countdown Signal Expiry",
        ],
        popular: false,
    },
    {
        id: "monthly",
        name: "Pro Trader VIP",
        fullPriceDisplay: "Pro Trader VIP: TZS 105,000 au $40 / Mwezi 1 (Siku 30)",
        priceTzs: "TZS 105,000",
        priceUsd: "$40",
        desc: "Kifurushi maarufu chenye vipengele vyote vya uchambuzi",
        features: [
            "Kila kitu kwenye Weekly Pass",
            "Matches / Differs Target Engine",
            "Digit Distribution 0-9 Bar Flow",
            "Third-Party API Access",
            "24/7 VIP Priority Support",
        ],
        popular: true,
    },
    {
        id: "lifetime",
        name: "Lifetime Access",
        fullPriceDisplay: "Lifetime Access: TZS 390,000 au $150 / Maisha Yote",
        priceTzs: "TZS 390,000",
        priceUsd: "$150",
        desc: "Malipo ya mara moja bila ada za kila mwezi",
        features: [
            "Access ya kudumu bila kikomo",
            "Maboresho yote mapya bure",
            "Full API & Webhooks Integration",
            "1-on-1 Trading Setup",
        ],
        popular: false,
    },
];

export default function SubscribePage() {
    const router = useRouter();
    const [user, setUser] = useState<AppUser | null>(null);
    const [selectedPlan, setSelectedPlan] = useState(PLANS[1]);
    const [paymentMethod, setPaymentMethod] = useState<"mobile" | "crypto">("mobile");
    const [transactionRef, setTransactionRef] = useState("");
    const [screenshotData, setScreenshotData] = useState<string>("");
    const [isSubmitted, setIsSubmitted] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        const current = getCurrentUser();
        if (!current) {
            router.push("/login");
            return;
        }

        if (current.status === "APPROVED" && current.isSubscribed) {
            router.push("/");
            return;
        }

        if (current.transactionRef) {
            setIsSubmitted(true);
            setTransactionRef(current.transactionRef);
            if (current.paymentScreenshot) {
                setScreenshotData(current.paymentScreenshot);
            }
        }

        setUser(current);
    }, [router]);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("Picha ni kubwa mno. Tafadhali chagua picha iliyo chini ya 5MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setScreenshotData(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmitPayment = (e: React.FormEvent) => {
        e.preventDefault();
        if (!transactionRef || !user) return;

        const users = getStoredUsers();
        const updatedUsers = users.map((u) =>
            u.id === user.id
                ? {
                    ...u,
                    subscriptionPlan: selectedPlan.name,
                    subscriptionFee: selectedPlan.fullPriceDisplay,
                    paymentMethod: paymentMethod === "mobile" ? "M-Pesa / Tigo Pesa" : "Crypto USDT",
                    transactionRef: transactionRef,
                    paymentScreenshot: screenshotData,
                    status: "PENDING" as const,
                }
                : u
        );

        saveUsers(updatedUsers);

        const updatedCurrent: AppUser = {
            ...user,
            subscriptionPlan: selectedPlan.name,
            subscriptionFee: selectedPlan.fullPriceDisplay,
            paymentMethod: paymentMethod === "mobile" ? "M-Pesa / Tigo Pesa" : "Crypto USDT",
            transactionRef: transactionRef,
            paymentScreenshot: screenshotData,
            status: "PENDING",
        };
        setCurrentUserSession(updatedCurrent);

        setIsSubmitted(true);
    };

    const checkStatusAgain = () => {
        const users = getStoredUsers();
        const found = users.find((u) => u.id === user?.id);
        if (found && found.status === "APPROVED" && found.isSubscribed) {
            setCurrentUserSession(found);
            router.push("/");
        } else {
            alert("Akaunti yako bado inakaguliwa na Admin. Unaweza pia kubonyeza kitufe cha WhatsApp kuwasiliana na Admin.");
        }
    };

    const handleLogout = () => {
        setCurrentUserSession(null);
        router.push("/login");
    };

    const whatsappMessage = encodeURIComponent(
        `Habari Admin, nimejisajili kwenye Deriv Digit Pro (${user?.email}). Nimelipia kifurushi cha ${user?.subscriptionPlan || selectedPlan.name} na namba ya muamala ni ${transactionRef || "..."}. Nimeweka screenshot ya malipo. Naomba idhini ya kuwasha akaunti.`
    );
    const whatsappUrl = `https://wa.me/255628940590?text=${whatsappMessage}`;

    if (!user) return null;

    return (
        <div className="min-h-screen bg-[#070d1e] text-slate-100 p-4 md:p-8 font-sans">
            <header className="max-w-6xl mx-auto flex justify-between items-center pb-6 border-b border-[#152454] mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-cyan-400">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">DERIV DIGIT PRO</h1>
                        <p className="text-xs text-slate-400">
                            Mtumiaji: <span className="text-cyan-400 font-semibold">{user.name}</span>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all"
                    >
                        <MessageCircle className="w-4 h-4" />
                        <span>WhatsApp Admin</span>
                    </a>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-xs text-slate-400 hover:text-rose-400 border border-[#152454] px-3.5 py-2 rounded-xl transition-all cursor-pointer"
                    >
                        <LogOut className="w-3.5 h-3.5" />
                        Logout
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto space-y-10">
                {/* State ya 1: Ikiwa mtumiaji tayari amewasilisha malipo */}
                {isSubmitted ? (
                    <div className="bg-[#0d1838] border border-cyan-500/40 rounded-3xl p-8 max-w-xl mx-auto text-center shadow-2xl space-y-6">
                        <div className="w-20 h-20 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/30 animate-pulse">
                            <Clock className="w-10 h-10" />
                        </div>

                        <div>
                            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider mb-2">
                                Waiting for Admin Approval
                            </span>
                            <h2 className="text-2xl font-black text-white">Malipo Yako Yamepokelewa!</h2>
                            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                                Taarifa za muamala na picha ya risiti <strong className="text-cyan-400 font-mono">({transactionRef})</strong> zimefika kwa Admin. Akaunti yako itakaguliwa na kufunguliwa muda si mrefu.
                            </p>
                        </div>

                        <div className="p-4 rounded-2xl bg-[#070d1e] border border-[#152454] text-xs text-left space-y-2 font-mono text-slate-300">
                            <div>Kifurushi: <span className="text-cyan-400 font-bold">{user.subscriptionPlan || selectedPlan.name}</span></div>
                            <div>Muamala Ref: <span className="text-amber-400">{transactionRef}</span></div>
                            <div>Hali: <span className="text-amber-400 font-bold">Inasubiri Idhini (Pending)</span></div>
                            {screenshotData && (
                                <div className="pt-2 border-t border-[#152454]">
                                    <p className="text-[11px] text-slate-400 mb-1.5 font-sans">Screenshot Iliyowasilishwa:</p>
                                    <img
                                        src={screenshotData}
                                        alt="Payment Receipt"
                                        className="w-full max-h-48 object-contain rounded-xl border border-slate-700 bg-black/40"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex flex-col gap-3 pt-2">
                            <a
                                href={whatsappUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <MessageCircle className="w-4 h-4" />
                                <span>Wasiliana na Admin WhatsApp (0628940590)</span>
                            </a>

                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={checkStatusAgain}
                                    className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    Kagua Kama Umeidhinishwa
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="bg-[#070d1e] hover:bg-[#152454] border border-[#152454] text-slate-300 py-3 px-5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                >
                                    Toka (Logout)
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* State ya 2: Mtumiaji anachagua kifurushi na kulipa */
                    <>
                        <div className="text-center max-w-2xl mx-auto">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-600/10 border border-blue-500/30 text-cyan-400 text-xs font-bold mb-3">
                                <Crown className="w-3.5 h-3.5" />
                                Hatua ya 2: Chagua Kifurushi
                            </div>
                            <h2 className="text-3xl md:text-4xl font-black text-white">
                                Chagua Kifurushi Chako cha Subscription
                            </h2>
                            <p className="text-xs text-slate-400 mt-2">
                                Lipia ili kuwasilisha maombi yako kwa Admin na kufungua Live Digit Predictions.
                            </p>
                        </div>

                        {/* Pricing Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {PLANS.map((plan) => {
                                const isSelected = selectedPlan.id === plan.id;
                                return (
                                    <div
                                        key={plan.id}
                                        onClick={() => setSelectedPlan(plan)}
                                        className={`relative rounded-3xl p-7 flex flex-col justify-between cursor-pointer transition-all duration-300 border ${plan.popular
                                                ? "bg-[#0d1838] border-cyan-400/50 shadow-2xl shadow-blue-500/10"
                                                : "bg-[#0d1838]/80 border-[#152454]"
                                            } ${isSelected ? "ring-2 ring-cyan-400 scale-[1.02]" : "hover:border-slate-600"}`}
                                    >
                                        {plan.popular && (
                                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                                                Inayopendekezwa Zaidi
                                            </div>
                                        )}

                                        <div>
                                            <div className="mb-3">
                                                <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                                            </div>

                                            <div className="my-4 p-3 rounded-xl bg-[#070d1e] border border-[#152454]">
                                                <div className="text-xs font-black text-cyan-400 font-mono leading-relaxed">
                                                    {plan.fullPriceDisplay}
                                                </div>
                                            </div>

                                            <p className="text-xs text-slate-300 mb-6">{plan.desc}</p>

                                            <div className="space-y-2.5 pt-4 border-t border-[#152454]">
                                                {plan.features.map((feat, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                                                        <Check className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
                                                        <span>{feat}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div
                                            className={`mt-6 py-2.5 rounded-xl text-xs font-bold text-center border ${isSelected
                                                    ? "bg-cyan-500/20 border-cyan-400 text-cyan-300"
                                                    : "border-[#152454] text-slate-400"
                                                }`}
                                        >
                                            {isSelected ? "Kifurushi Kimechaguliwa" : "Bofya Kuchagua"}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Payment Checkout Box */}
                        <div className="bg-[#0d1838] border border-[#152454] rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl">
                            <form onSubmit={handleSubmitPayment} className="space-y-6">
                                <div className="border-b border-[#152454] pb-4">
                                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                        <Wallet className="w-5 h-5 text-cyan-400" />
                                        Kamilisha Malipo: {selectedPlan.name}
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">
                                        Ada: <strong className="text-cyan-400 font-bold">{selectedPlan.fullPriceDisplay}</strong>
                                    </p>
                                </div>

                                {/* Method Switcher */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("mobile")}
                                        className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${paymentMethod === "mobile"
                                                ? "bg-blue-600/20 border-cyan-400 text-cyan-300"
                                                : "bg-[#070d1e] border-[#152454] text-slate-400"
                                            }`}
                                    >
                                        <Smartphone className="w-4 h-4" />
                                        Lipa Kwa Simu (M-Pesa)
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPaymentMethod("crypto")}
                                        className={`p-3.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${paymentMethod === "crypto"
                                                ? "bg-blue-600/20 border-cyan-400 text-cyan-300"
                                                : "bg-[#070d1e] border-[#152454] text-slate-400"
                                            }`}
                                    >
                                        <Wallet className="w-4 h-4" />
                                        Crypto (USDT TRC20)
                                    </button>
                                </div>

                                {/* Instructions */}
                                <div className="p-4 rounded-2xl bg-[#070d1e] border border-[#152454] text-xs space-y-2">
                                    {paymentMethod === "mobile" ? (
                                        <>
                                            <p className="text-slate-300">1. Tuma pesa kwenda Vodacom M-Pesa / Mitandao Yote</p>
                                            <p className="text-slate-300">
                                                2. Namba ya Malipo: <strong className="text-cyan-400 text-base font-mono font-bold tracking-wider">0752642148</strong>
                                            </p>
                                            <p className="text-slate-300">
                                                3. Kiasi cha Kulipa: <strong className="text-emerald-400 font-bold">{selectedPlan.priceTzs}</strong>
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-slate-300">1. Tuma USDT mtandao wa <strong>TRC20</strong> pekee</p>
                                            <p className="text-slate-300">
                                                2. Wallet Address: <strong className="text-cyan-400 text-[11px] font-mono break-all">TJ8sF9Kx12aBcDeFgHiJkLmNoPqRsTuVwX</strong>
                                            </p>
                                            <p className="text-slate-300">
                                                3. Kiasi: <strong className="text-emerald-400 font-bold">{selectedPlan.priceUsd}</strong>
                                            </p>
                                        </>
                                    )}
                                </div>

                                {/* Transaction ID Input */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                                        1. Weka Namba ya Muamala (Transaction ID / Reference)
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        placeholder={paymentMethod === "mobile" ? "Mfano: QHX8294LKZ" : "Mfano: 0x4f8a9... au TxHash"}
                                        value={transactionRef}
                                        onChange={(e) => setTransactionRef(e.target.value)}
                                        className="w-full bg-[#070d1e] border border-[#152454] rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-400 font-mono"
                                    />
                                </div>

                                {/* Screenshot Upload Input */}
                                <div>
                                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                                        2. Weka Screenshot ya Malipo (Ushahidi wa Risiti)
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />

                                    {screenshotData ? (
                                        <div className="relative p-3 rounded-2xl bg-[#070d1e] border border-cyan-500/40 flex items-center justify-between">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <img
                                                    src={screenshotData}
                                                    alt="Preview"
                                                    className="w-14 h-14 object-cover rounded-xl border border-slate-700 flex-shrink-0"
                                                />
                                                <div className="text-xs">
                                                    <p className="text-white font-bold">Picha ya Risiti Imewekwa</p>
                                                    <p className="text-emerald-400 text-[11px]">Tayari kuwasilishwa</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setScreenshotData("");
                                                    if (fileInputRef.current) fileInputRef.current.value = "";
                                                }}
                                                className="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
                                                title="Ondoa picha"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="border-2 border-dashed border-[#152454] hover:border-cyan-400/60 rounded-2xl p-6 text-center cursor-pointer transition-all bg-[#070d1e]/50 hover:bg-[#070d1e]"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-600/10 text-cyan-400 flex items-center justify-center mx-auto mb-2 border border-blue-500/30">
                                                <Upload className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs font-bold text-slate-200">Bofya hapa kupakia Screenshot ya malipo</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">PNG, JPG, au WEBP (Isizidi 5MB)</p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-3 pt-2">
                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                                    >
                                        <span>Wasilisha Malipo & Screenshot ({selectedPlan.priceTzs} / {selectedPlan.priceUsd})</span>
                                        <ArrowRight className="w-4 h-4" />
                                    </button>

                                    <a
                                        href={whatsappUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full bg-[#070d1e] hover:bg-[#152454] border border-emerald-500/40 text-emerald-400 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>Una Changamoto? Wasiliana na Admin WhatsApp (0628940590)</span>
                                    </a>
                                </div>
                            </form>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}