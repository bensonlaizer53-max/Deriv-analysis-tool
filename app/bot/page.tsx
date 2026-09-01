"use client";

import React, { useState, useRef } from "react";
import { Play, Square, Bot, ShieldCheck } from "lucide-react";

export default function BotRunnerPage() {
    const [token, setToken] = useState("");
    const [email, setEmail] = useState("bensonlaizer53@gmail.com");
    const [stake, setStake] = useState("1");
    const [isRunning, setIsRunning] = useState(false);
    const [logs, setLogs] = useState<string[]>([
        "Mfumo upo tayari. Weka API Token yako kisha bonyeza Start.",
    ]);

    const socketRef = useRef<WebSocket | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const isTradingRef = useRef<boolean>(false);

    const addLog = (msg: string) => {
        const time = new Date().toLocaleTimeString();
        setLogs((prev) => [...prev, `[${time}] ${msg}`]);
    };

    const startBot = () => {
        const cleanToken = token.trim();

        if (!cleanToken) {
            alert("Tafadhali weka Deriv API Token!");
            return;
        }

        addLog("Inaunganisha na Seva za Deriv kupitia Lizytrade App ID...");
        setIsRunning(true);

        try {
            // Unganisha kupitia App ID ya Lizytrade iliyosajiliwa
            const ws = new WebSocket("wss://ws.derivws.com/websockets/v3?app_id=33YjPz08n06J8kkkGxz3T");
            socketRef.current = ws;

            ws.onopen = () => {
                addLog("WebSocket Imeunganishwa! Inatuma Token kwa uthibitisho...");
                ws.send(JSON.stringify({ authorize: cleanToken }));
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    if (data.msg_type === "authorize" && data.authorize) {
                        const auth = data.authorize;
                        const userDisplay = auth.fullname || auth.email || auth.loginid || "Trader";
                        const balanceVal = auth.balance !== undefined ? `${auth.balance} ${auth.currency}` : "Active";

                        addLog(`✅ Akaunti Imethibitishwa: ${userDisplay} | Salio: ${balanceVal}`);

                        // Anza kuita API ya Signals kila sekunde 1
                        if (timerRef.current) clearInterval(timerRef.current);
                        timerRef.current = setInterval(() => {
                            checkSignalsAndTrade();
                        }, 1000);
                    }

                    if (data.msg_type === "buy" && data.buy) {
                        addLog(
                            `🚀 Trade Imefunguliwa! Contract ID: ${data.buy.contract_id} (Stake: $${data.buy.buy_price})`
                        );
                        setTimeout(() => {
                            isTradingRef.current = false;
                        }, 3500);
                    }

                    if (data.error) {
                        addLog(`❌ Kosa kutoka Deriv: ${data.error.message}`);
                        isTradingRef.current = false;
                    }
                } catch {
                    // Log parsing handling
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
                    addLog(
                        `🎯 Signal: ${rec.action} | Target: ${rec.target} | Confidence: ${rec.confidenceScore}`
                    );

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
            // Signal API failure
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
                currency: "USD",
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
                <div className="flex items-center gap-3 pb-4 border-b border-[#152454]">
                    <div className="p-3 bg-blue-600/20 border border-blue-500/40 rounded-2xl text-cyan-400">
                        <Bot className="w-7 h-7" />
                    </div>
                    <div>
                        <h1 className="text-xl font-black text-white">LizyTrade Auto Bot Runner</h1>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <ShieldCheck className="w-4 h-4 text-emerald-400" />
                            Lizytrade App ID & Live Signals
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                            1. Deriv API Token:
                        </label>
                        <input
                            type="text"
                            disabled={isRunning}
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            placeholder="Weka Token yako ya Deriv hapa..."
                            className="w-full bg-[#070d1e] border border-[#152454] rounded-xl px-4 py-3 text-xs text-cyan-400 focus:outline-none focus:border-cyan-400 font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold uppercase text-slate-300 mb-1">
                                2. Email ya Usajili:
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
                                3. Stake ($ USD):
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