import { NextResponse } from "next/server";

interface TickHistoryResponse {
    history?: {
        prices: number[];
        times: number[];
    };
    error?: {
        message: string;
    };
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "1HZ100V";
    const count = parseInt(searchParams.get("ticks") || "100", 10);

    try {
        const wsUrl = "wss://ws.derivws.com/websockets/v3?app_id=1089";
        const ticks = await fetchDerivTicks(wsUrl, symbol, count);

        if (!ticks || ticks.length === 0) {
            return NextResponse.json(
                { status: "error", message: "Imeshindwa kupata ticks kutoka Deriv" },
                { status: 500 }
            );
        }

        const lastDigits = ticks.map((price) => {
            const parts = price.toFixed(2).split(".");
            return parseInt(parts[1]?.slice(-1) || "0", 10);
        });

        const totalTicks = lastDigits.length;
        const digitCounts: Record<number, number> = {};
        for (let i = 0; i <= 9; i++) digitCounts[i] = 0;

        let evenCount = 0;
        let oddCount = 0;
        let overCount = 0;
        let underCount = 0;

        lastDigits.forEach((digit) => {
            digitCounts[digit] = (digitCounts[digit] || 0) + 1;
            if (digit % 2 === 0) evenCount++;
            else oddCount++;

            if (digit >= 5) overCount++;
            else underCount++;
        });

        const digitPercentages: Record<number, number> = {};
        for (let i = 0; i <= 9; i++) {
            digitPercentages[i] = parseFloat(((digitCounts[i] / totalTicks) * 100).toFixed(1));
        }

        const recentDigits = lastDigits.slice(-25);
        const recentCounts: Record<number, number> = {};
        for (let i = 0; i <= 9; i++) recentCounts[i] = 0;
        recentDigits.forEach((d) => (recentCounts[d] = (recentCounts[d] || 0) + 1));

        const sortedDigits = Object.entries(digitPercentages).sort(
            ([, a], [, b]) => (a as number) - (b as number)
        );
        const leastAppearingDigit = parseInt(sortedDigits[0][0], 10);
        const leastAppearingPct = sortedDigits[0][1];

        const last8Ticks = lastDigits.slice(-8);
        const appearedInLast8 = last8Ticks.includes(leastAppearingDigit);

        const evenPct = (evenCount / totalTicks) * 100;
        const oddPct = (oddCount / totalTicks) * 100;
        const overPct = (overCount / totalTicks) * 100;
        const underPct = (underCount / totalTicks) * 100;

        let action = "HOLD / ANALYZING";
        let target = "--";
        let confidenceScore = 50;
        let highProbabilityEdge = false;
        let reason = "Hakuna mwelekeo wa wazi (Market Balanced).";

        // 1. Kigezo cha Differs (Usahihi wa juu)
        if (leastAppearingPct <= 6.5 && !appearedInLast8 && recentCounts[leastAppearingDigit] <= 1) {
            action = "DIFFERS";
            target = `DIGIT ${leastAppearingDigit}`;
            confidenceScore = 93;
            highProbabilityEdge = true;
            reason = `Digit ${leastAppearingDigit} ina marudio ya ${leastAppearingPct}% na haijatokea katika ticks 8 zilizopita.`;
        }
        // 2. Kigezo cha Even/Odd
        else if (evenPct >= 62 && recentDigits.filter((d) => d % 2 === 0).length >= 15) {
            action = "BUY EVEN";
            target = "EVEN DIGITS";
            confidenceScore = 87;
            highProbabilityEdge = true;
            reason = `Uwezekano mkubwa wa Even (${evenPct.toFixed(1)}%) na uthibitisho wa ticks 25 za mwisho.`;
        } else if (oddPct >= 62 && recentDigits.filter((d) => d % 2 !== 0).length >= 15) {
            action = "BUY ODD";
            target = "ODD DIGITS";
            confidenceScore = 87;
            highProbabilityEdge = true;
            reason = `Uwezekano mkubwa wa Odd (${oddPct.toFixed(1)}%) na uthibitisho wa ticks 25 za mwisho.`;
        }
        // 3. Kigezo cha Over/Under
        else if (underPct >= 64) {
            action = "BUY UNDER";
            target = "UNDER 5";
            confidenceScore = 86;
            highProbabilityEdge = true;
            reason = `Uwiano wa namba za chini (0-4) umefikia ${underPct.toFixed(1)}%.`;
        } else if (overPct >= 64) {
            action = "BUY OVER";
            target = "OVER 4";
            confidenceScore = 86;
            highProbabilityEdge = true;
            reason = `Uwiano wa namba za juu (5-9) umefikia ${overPct.toFixed(1)}%.`;
        }

        return NextResponse.json({
            status: "success",
            symbol,
            totalTicks,
            analysis: {
                evenPercentage: `${evenPct.toFixed(1)}%`,
                oddPercentage: `${oddPct.toFixed(1)}%`,
                overPercentage: `${overPct.toFixed(1)}%`,
                underPercentage: `${underPct.toFixed(1)}%`,
                digitFrequency: digitPercentages,
            },
            aiRecommendation: {
                action,
                target,
                confidenceScore: `${confidenceScore}%`,
                highProbabilityEdge,
                reason,
            },
        });
    } catch {
        return NextResponse.json(
            { status: "error", message: "Hitilafu katika seva ya uchambuzi" },
            { status: 500 }
        );
    }
}

function fetchDerivTicks(wsUrl: string, symbol: string, count: number): Promise<number[]> {
    return new Promise((resolve, reject) => {
        try {
            const ws = new WebSocket(wsUrl);
            const timeout = setTimeout(() => {
                ws.close();
                reject(new Error("WebSocket timeout"));
            }, 7000);

            ws.onopen = () => {
                ws.send(
                    JSON.stringify({
                        ticks_history: symbol,
                        adjust_start_time: 1,
                        count,
                        end: "latest",
                        style: "ticks",
                    })
                );
            };

            ws.onmessage = (event) => {
                try {
                    const data: TickHistoryResponse = JSON.parse(event.data.toString());
                    if (data.history && data.history.prices) {
                        clearTimeout(timeout);
                        ws.close();
                        resolve(data.history.prices);
                    } else if (data.error) {
                        clearTimeout(timeout);
                        ws.close();
                        reject(new Error(data.error.message));
                    }
                } catch (err) {
                    clearTimeout(timeout);
                    ws.close();
                    reject(err);
                }
            };

            ws.onerror = (err) => {
                clearTimeout(timeout);
                reject(err);
            };
        } catch (err) {
            reject(err);
        }
    });
}