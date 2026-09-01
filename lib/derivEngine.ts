export interface TickData {
    quote: number;
    digit: number;
    epoch: number;
}

export interface AnalysisStats {
    percentages: number[]; // 0-9
    evenPct: number;
    oddPct: number;
    underPct: number; // 0 to 4
    overPct: number;  // 5 to 9
    mostFrequent: number;
    leastFrequent: number;
}

export interface SignalData {
    evenOdd: 'EVEN' | 'ODD' | 'WAIT';
    overUnder: 'OVER 4' | 'UNDER 5' | 'WAIT';
    matchesDiffer: {
        match: number;
        differ: number;
    };
    confidence: number;
}

export class DerivAnalysisEngine {
    private ws: WebSocket | null = null;
    private appId: string;
    private symbol: string;
    private historyLimit: number;
    private ticks: TickData[] = [];
    private onTickCallback: ((tick: TickData, stats: AnalysisStats, signal: SignalData) => void) | null = null;

    constructor(appId: string = "1089", symbol: string = "1HZ10V", historyLimit: number = 100) {
        this.appId = appId;
        this.symbol = symbol;
        this.historyLimit = historyLimit;
    }

    public connect(onTick: (tick: TickData, stats: AnalysisStats, signal: SignalData) => void) {
        if (typeof window === "undefined") return; // Zuia server-side crash

        this.onTickCallback = onTick;
        this.ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${this.appId}`);

        this.ws.onopen = () => {
            this.subscribeSymbol(this.symbol);
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.msg_type === 'tick' && data.tick) {
                    this.processTick(data.tick);
                }
            } catch (err) {
                console.error("Error parsing message", err);
            }
        };

        this.ws.onerror = (err) => {
            console.error("Deriv WS Error:", err);
        };

        this.ws.onclose = () => {
            // Reconnect after 3 seconds
            setTimeout(() => {
                if (this.onTickCallback) {
                    this.connect(this.onTickCallback);
                }
            }, 3000);
        };
    }

    public changeSymbol(newSymbol: string) {
        this.symbol = newSymbol;
        this.ticks = [];
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ forget_all: "ticks" }));
            this.subscribeSymbol(newSymbol);
        }
    }

    private subscribeSymbol(symbol: string) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                ticks: symbol,
                subscribe: 1
            }));
        }
    }

    private processTick(tick: any) {
        const quote = tick.quote;
        const pipSize = tick.pip_size !== undefined ? tick.pip_size : 2;
        const formattedQuote = Number(quote).toFixed(pipSize);
        const lastDigit = parseInt(formattedQuote.slice(-1), 10);

        const tickItem: TickData = {
            quote,
            digit: isNaN(lastDigit) ? 0 : lastDigit,
            epoch: tick.epoch
        };

        this.ticks.push(tickItem);
        if (this.ticks.length > this.historyLimit) {
            this.ticks.shift();
        }

        const stats = this.calculateStats();
        const signal = this.calculateSignals(stats);

        if (this.onTickCallback) {
            this.onTickCallback(tickItem, stats, signal);
        }
    }

    private calculateStats(): AnalysisStats {
        const counts = Array(10).fill(0);
        this.ticks.forEach(t => {
            if (t.digit >= 0 && t.digit <= 9) {
                counts[t.digit]++;
            }
        });

        const total = this.ticks.length || 1;
        const percentages = counts.map(c => Number(((c / total) * 100).toFixed(1)));

        const evenCount = this.ticks.filter(t => t.digit % 2 === 0).length;
        const oddCount = total - evenCount;

        const underCount = this.ticks.filter(t => t.digit <= 4).length;
        const overCount = total - underCount;

        let maxVal = -1, mostFreq = 0;
        let minVal = 9999, leastFreq = 0;

        counts.forEach((c, digit) => {
            if (c > maxVal) { maxVal = c; mostFreq = digit; }
            if (c < minVal) { minVal = c; leastFreq = digit; }
        });

        return {
            percentages,
            evenPct: Number(((evenCount / total) * 100).toFixed(1)),
            oddPct: Number(((oddCount / total) * 100).toFixed(1)),
            underPct: Number(((underCount / total) * 100).toFixed(1)),
            overPct: Number(((overCount / total) * 100).toFixed(1)),
            mostFrequent: mostFreq,
            leastFrequent: leastFreq
        };
    }

    private calculateSignals(stats: AnalysisStats): SignalData {
        let evenOdd: 'EVEN' | 'ODD' | 'WAIT' = 'WAIT';
        if (stats.evenPct >= 55) evenOdd = 'EVEN';
        else if (stats.oddPct >= 55) evenOdd = 'ODD';

        let overUnder: 'OVER 4' | 'UNDER 5' | 'WAIT' = 'WAIT';
        if (stats.overPct >= 55) overUnder = 'OVER 4';
        else if (stats.underPct >= 55) overUnder = 'UNDER 5';

        const maxPercentage = Math.max(stats.evenPct, stats.oddPct, stats.overPct, stats.underPct);

        return {
            evenOdd,
            overUnder,
            matchesDiffer: {
                match: stats.mostFrequent,
                differ: stats.leastFrequent
            },
            confidence: maxPercentage
        };
    }

    public disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}