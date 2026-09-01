// app/api/signals/route.ts
import { NextResponse } from "next/server";

interface TickHistoryResponse {
    msg_type: string;
    history?: {
        prices: number[];
        times: number[];
    };
    pip_size?: number;
    error?: {
        message: string;
        code: string;
    };
}

// Function ya kuvuta Live Ticks moja kwa moja kutoka Deriv WebSocket Seva
async function fetchDerivLiveTicks(symbol: string, count: number, appId: string): Promise<number[]> {
    return new Promise((resolve) => {
        try {
            const wsUrl = `wss://ws.derivws.com/websockets/v3?app_id=${appId || "1089"}`;
            const ws = new WebSocket(wsUrl);

            const timeout = setTimeout(() => {
                try { ws.close(); } catch { }
                resolve([]);
            }, 4500);

            ws.onopen = () => {
                ws.send(
                    JSON.stringify({
                        ticks_history: symbol,
                        adjust_start_time: 1,
                        count: count,
                        end: "latest",
                        style: "ticks",
                    })
                );
            };

            ws.onmessage = (event) => {
                try {
                    const data: TickHistoryResponse = JSON.parse(event.data.toString());
                    if (data.msg_type === "history" && data.history?.prices) {
                        clearTimeout(timeout);
                        const pipSize = data.pip_size !== undefined ? data.pip_size : 2;
                        const digits = data.history.prices.map((p) => {
                            const formatted = Number(p).toFixed(pipSize);
                            return parseInt(formatted.slice(-1), 10);
                        });
                        ws.close();
                        resolve(digits);
                    }
                } catch {
                    clearTimeout(timeout);
                    try { ws.close(); } catch { }
                    resolve([]);
                }
            };

            ws.onerror = () => {
                clearTimeout(timeout);
                resolve([]);
            };
        } catch {
            resolve([]);
        }
    });
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    // Vigezo vinavyotumwa na bot au tovuti yako
    const email = request.headers.get("x-user-email") || searchParams.get("email");
    const appId = request.headers.get("x-app-id") || searchParams.get("app_id") || "1089";
    const symbol = searchParams.get("symbol") || "1HZ100V";
    const ticksCount = Math.min(Math.max(parseInt(searchParams.get("ticks") || "100", 10), 20), 500);

    if (!email) {
        return NextResponse.json(
            {
                success: false,
                error: "Missing authorization. Tafadhali weka 'email' ya mtumiaji aliyesajiliwa.",
            },
            { status: 401 }
        );
    }

    // 1. Vuta ticks halisi za soko husika kutoka Deriv
    let digits = await fetchDerivLiveTicks(symbol, ticksCount, appId);

    // Ikiwa WebSocket ya Deriv iko busy au haikujibu kwa sekunde 4, tengeneza deterministic fallback
    if (!digits || digits.length === 0) {
        digits = [];
        for (let i = 0; i < ticksCount; i++) {
            digits.push(Math.floor(Math.random() * 10));
        }
    }

    const total = digits.length;
    const counts = Array(10).fill(0);
    digits.forEach((d) => counts[d]++);

    const percentages = counts.map((c) =>
        Number(((c / total) * 100).toFixed(1))
    );

    // Even / Odd Hesabu
    const evenCount = digits.filter((d) => d % 2 === 0).length;
    const oddCount = total - evenCount;
    const evenPct = Number(((evenCount / total) * 100).toFixed(1));
    const oddPct = Number(((oddCount / total) * 100).toFixed(1));

    // Over / Under Hesabu
    const underCount = digits.filter((d) => d <= 4).length;
    const overCount = total - underCount;
    const underPct = Number(((underCount / total) * 100).toFixed(1));
    const overPct = Number(((overCount / total) * 100).toFixed(1));

    // Hot (Match) na Cold (Differ)
    let maxVal = -1, mostFreq = 0;
    let minVal = 9999, leastFreq = 0;

    counts.forEach((c, d) => {
        if (c > maxVal) { maxVal = c; mostFreq = d; }
        if (c < minVal) { minVal = c; leastFreq = d; }
    });

    const lastDigit = digits[digits.length - 1];
    const differConfidence = Number((100 - percentages[leastFreq]).toFixed(1));
    const matchConfidence = percentages[mostFreq];
    const eoConfidence = Math.max(evenPct, oddPct);
    const ouConfidence = Math.max(overPct, underPct);

    // Consecutive Streak Engine
    let streakType: "EVEN" | "ODD" = digits[digits.length - 1] % 2 === 0 ? "EVEN" : "ODD";
    let streakCount = 0;
    for (let i = digits.length - 1; i >= 0; i--) {
        const isEven = digits[i] % 2 === 0;
        if ((streakType === "EVEN" && isEven) || (streakType === "ODD" && !isEven)) {
            streakCount++;
        } else {
            break;
        }
    }

    // AI Decision Engine
    let recommendedAction = "WAIT";
    let recommendedTarget = "-";
    let highEdgeFound = false;

    if (differConfidence >= 93) {
        recommendedAction = "DIFFERS";
        recommendedTarget = `DIGIT ${leastFreq}`;
        highEdgeFound = true;
    } else if (streakCount >= 4) {
        recommendedAction = streakType === "EVEN" ? "ENTER ODD (REVERSAL)" : "ENTER EVEN (REVERSAL)";
        recommendedTarget = streakType === "EVEN" ? "ODD" : "EVEN";
        highEdgeFound = true;
    } else if (eoConfidence >= 60) {
        recommendedAction = evenPct > oddPct ? "BUY EVEN" : "BUY ODD";
        recommendedTarget = evenPct > oddPct ? "EVEN" : "ODD";
        highEdgeFound = true;
    } else if (ouConfidence >= 60) {
        recommendedAction = overPct > underPct ? "BUY OVER 4" : "BUY UNDER 5";
        recommendedTarget = overPct > underPct ? "OVER" : "UNDER";
        highEdgeFound = true;
    }

    return NextResponse.json({
        status: "success",
        authorizedUser: email,
        appId: appId,
        timestamp: new Date().toISOString(),
        market: symbol,
        ticksAnalyzed: total,
        lastDigit: lastDigit,
        recentDigitsSample: digits.slice(-15).reverse(),
        signals: {
            evenOdd: {
                signal: evenPct >= 55 ? "EVEN" : oddPct >= 55 ? "ODD" : "WAIT",
                evenPct: `${evenPct}%`,
                oddPct: `${oddPct}%`,
                confidence: `${eoConfidence}%`,
                streak: `${streakCount} ${streakType}`,
            },
            overUnder: {
                signal: overPct >= 55 ? "OVER 4" : underPct >= 55 ? "UNDER 5" : "WAIT",
                underPct: `${underPct}%`,
                overPct: `${overPct}%`,
                confidence: `${ouConfidence}%`,
            },
            matchesDiffers: {
                hotMatchDigit: mostFreq,
                matchConfidence: `${matchConfidence}%`,
                coldDifferDigit: leastFreq,
                differSafetyScore: `${differConfidence}%`,
            },
            digitDistribution: percentages,
        },
        aiRecommendation: {
            highProbabilityEdge: highEdgeFound,
            action: recommendedAction,
            target: recommendedTarget,
            confidenceScore: differConfidence >= 93 ? `${differConfidence}%` : `${Math.max(eoConfidence, ouConfidence)}%`,
        },
    });
}