"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Square, Bot, ShieldCheck, LogIn, LogOut } from "lucide-react";

export default function BotRunnerPage() {
    const [token, setToken] = useState("");
    const [account, setAccount] = useState<{ loginid: string; balance: string; currency: string } | null>(null);
    const [email, setEmail] = useState("bensonlaizer53@gmail.com");
    const [stake, setStake] = useState("1");
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([
        "Mfumo upo tayari mtandaoni. Bonyeza 'Login with Deriv' kuanza.",
    ]);

    const socketRef = useRef<WebSocket | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isTradingRef = useRef<boolean>(false);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs((prev) => [...prev, `[${time}] ${msg}`]);
    };

    // Soma token moja kwa moja kutoka URL baada ya Deriv Login redirection
    useEffect(() => {
        if (typeof window !== "undefined") {
            const urlParams = new URLSearchParams(window.location.search);
            const token1 = urlParams.get("token1");
            const acct1 = urlParams.get("acct1");

            const savedToken = token1 || localStorage.getItem("deriv_token");
            if (savedToken) {
                setToken(savedToken);
                localStorage.setItem("deriv_token", savedToken);
                addLog(`Token imethibitishwa: ${acct1 || "Deriv Account"}`);
                // Safisha URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    }, []);

    // Kuingia Moja kwa Moja (OAuth2 Login) kwa kutumia App ID ya LizyTrade Bot
    const handleDerivLogin = () => {
        const appId = "34hmklbjf67yxiGS5XAsf";
        const redirectUrl = encodeURIComponent("https://deriv-analysis-tool-psi.vercel.app/bot");
        window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${appId}&l=en&brand=deriv&redirect_uri=${redirectUrl}`;
    };

    const handleLogout = () => {
        stopBot();
        localStorage.removeItem("deriv_token");
        setToken("");
        setAccount(null);
        addLog("Umetoka kwenye akaunti ya Deriv.");
    };

    const startBot = () => {
        const activeToken = token.trim();

        if (!activeToken) {
            alert("Tafadhali bonyeza 'Login with Deriv' kwanza!");
            return;
        }

        addLog("Inaunganisha na Seva za Deriv WebSocket...");
        setIsRunning(true);

        try {
            const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=1089");
            socketRef.current = ws;

            ws.onopen = () => {
                addLog("WebSocket Imeunganishwa! Inathibitisha akaunti...");
                ws.send(JSON.stringify({ authorize: activeToken }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.msg_type === "authorize" && data.authorize) {
                        const auth = data.authorize;
                        const balanceVal = auth.balance !== undefined ? `${auth.balance} ${auth.currency}` : "Active";

                        setAccount({
                            loginid: auth.loginid,
                            balance: auth.balance,
                            currency: auth.currency,
                        });

                        addLog(`✅ Akaunti Imethibitishwa: ${auth.fullname || auth.loginid} | Salio: ${balanceVal}`);

                        // Anza kuangalia Signals kila sekunde 1
                        if (timerRef.current) clearInterval(timerRef.current);
                        timerRef.current = setInterval(() => {
                            checkSignalsAndTrade();
                        }, 1000);
                    }

                    if (data.msg_type === "buy" && data.buy) {
                        addLog(`🚀 Trade Imefunguliwa! Contract ID: ${data.buy.contract_id} (Stake: $${data.buy.buy_price})`);
                        setTimeout(() => {
                            isTradingRef.current = false;
                        }, 3500);
                    }

                    if (data.error) {
                        addLog(`❌ Kosa kutoka Deriv: ${data.error.message}`);
                        isTradingRef.current = false;
                    }
                } catch {
                    // Parsing handling
                }
            };

            ws.onerror = () => {
                addLog("Hitilafu ya mtandao katika kuunganisha Deriv.");
                stopBot();
            };

            ws.onclose = () => {
                addLog("Muunganisho wa Deriv umefungwa.");
            };
        } catch {
            addLog("Imeshindwa kufungua WebSocket.");
            stopBot();
        }
    };

    const checkSignalsAndTrade = async () => {
        if (isTradingRef.current) return;

        try {
            const res = await fetch(
                `/api/signals?email=${encodeURIComponent(email)}&symbol=1HZ100V&ticks=100`
            );
            const resData = await res.json();

            if (resData.status === "success") {
                const rec = resData.aiRecommendation;

                if (rec.highProbabilityEdge) {
                    addLog(`🎯 Signal: ${rec.action} | Target: ${rec.target} | Confidence: ${rec.confidenceScore}`);

                    if (rec.action === "DIFFERS") {
                        const digit = rec.target.replace("DIGIT ", "");
                        placeOrder("DIGITDIFF", digit);
                    } else if (rec.action === "BUY EVEN") {
                        placeOrder("DIGITEVEN");
                    } else if (rec.action === "BUY ODD") {
                        placeOrder("DIGITODD");
                    }
                }
            }
        } catch {
            // API error
        }
    };

    const placeOrder = (contractType: string, barrier?: string) => {
        if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
        isTradingRef.current = true;
        const stakeAmount = parseFloat(stake) || 1;

        addLog(`Inatuma Oda ya ${contractType}...`);

        const req: Record<string, unknown> = {
            buy: 1,
            price: stakeAmount,
            parameters: {
                amount: stakeAmount,
                basis: "stake",
                contract_type: contractType,
                currency: account?.currency || "USD",
                duration: 1,
                duration_unit: "t",
                symbol: "1HZ100V",
            },
        };

        if (barrier !== undefined) {
            (req.parameters as Record<string, unknown>).barrier = barrier;
        }

        socketRef.current.send(JSON.stringify(req));
    };

    const stopBot = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (socketRef.current) {
            try {
                socketRef.current.close();
            } catch { }
        }
        setIsRunning(false);
        isTradingRef.current = false;
        addLog("🛑 Bot Imesimamishwa.");
    };

    return (
        <div className="min-h-screen bg-[#070d1e] text-slate-100 p-4 md:p-8 flex items-center justify-center font-sans">
            <div className="w-full max-w-xl bg-[#0d1838] border border-[#152454] rounded-3xl p-6 md:p-8 shadow-2xl space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-[#152454]">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-cyan-400">
                            <Bot className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white">LizyTrade Auto Bot Runner</h1>
                            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                Live Cloud App ID Verified
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    {!token ? (
                        <button
                            onClick={handleDerivLogin}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 rounded-xl text-xs font-black transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95 uppercase tracking-wide"
                        >
                            <LogIn className="w-4 h-4" />
                            <span>BONYEZA HAPA KUINGIA NA DERIV (ONE-CLICK LOGIN)</span>
                        </button>
                    ) : (
                        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between">
                            <div className="text-xs">
                                <span className="text-emerald-400 font-bold block">Akaunti Imeunganishwa</span>
                                <span className="text-[11px] text-slate-300 font-mono">
                                    {account ? `${account.loginid} ($${account.balance})` : "Tayari kuanza biashara"}
                                </span>
                            </div>
                            <button
                                onClick={handleLogout}
                                disabled={isRunning}
                                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer bg-rose-500/10 px-2.5 py-1.5 rounded-lg border border-rose-500/20"
                            >
                                <LogOut className="w-3.5 h-3.5" />
                                <span>Ondoa</span>
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                                Email ya Usajili:
                            </label>
                            <input
                                type="email"
                                disabled={isRunning}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-[#070d1e] border border-[#152454] rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none font-mono"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                                Stake ($ USD):
                            </label>
                            <input
                                type="number"
                                disabled={isRunning}
                                value={stake}
                                onChange={(e) => setStake(e.target.value)}
                                min="0.35"
                                step="0.1"
                                className="w-full bg-[#070d1e] border border-[#152454] rounded-xl px-4 py-3 text-xs text-white focus:outline-none font-mono"
                            />
                        </div>
                    </div>

                    {!isRunning ? (
                        <button
                            onClick={startBot}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                            <Play className="w-4 h-4 fill-white" />
                            <span>ANZA KUKIMBIZA BOT (START BOT)</span>
                        </button>
                    ) : (
                        <button
                            onClick={stopBot}
                            className="w-full bg-rose-600 hover:bg-rose-500 text-white py-3.5 rounded-xl text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                        >
                            <Square className="w-4 h-4 fill-white" />
                            <span>SIMAMISHA BOT (STOP BOT)</span>
                        </button>
                    )}

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[11px] font-bold text-slate-400 uppercase">Live Logs:</span>
                            <span className="text-[10px] text-cyan-400 font-mono">
                                {isRunning ? "Running" : "Idle"}
                            </span>
                        </div>
                        <div className="bg-black/80 border border-[#152454] rounded-xl p-3.5 font-mono text-[11px] h-48 overflow-y-auto space-y-1 text-emerald-400">
                            {logs.map((log, idx) => (
                                <div key={idx} className="leading-relaxed">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}