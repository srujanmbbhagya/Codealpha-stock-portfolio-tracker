// Simulated real-time stock data. In a production app this would call
// Yahoo Finance / Alpha Vantage. For the hackathon demo we generate
// realistic price movements seeded by symbol so the UX feels live.

export interface StockMeta {
  symbol: string;
  name: string;
  sector: string;
  basePrice: number;
  country?: "US" | "IN";
}

export const STOCK_UNIVERSE: StockMeta[] = [
  // US Stocks
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", basePrice: 228.5, country: "US" },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", basePrice: 432.1, country: "US" },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Technology", basePrice: 178.4, country: "US" },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", basePrice: 198.2, country: "US" },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Automotive", basePrice: 254.7, country: "US" },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Semiconductors", basePrice: 142.3, country: "US" },
  { symbol: "META", name: "Meta Platforms", sector: "Technology", basePrice: 562.9, country: "US" },
  { symbol: "NFLX", name: "Netflix Inc.", sector: "Entertainment", basePrice: 712.4, country: "US" },
  { symbol: "JPM", name: "JPMorgan Chase", sector: "Finance", basePrice: 218.6, country: "US" },
  { symbol: "V", name: "Visa Inc.", sector: "Finance", basePrice: 305.8, country: "US" },
  { symbol: "DIS", name: "Walt Disney Co.", sector: "Entertainment", basePrice: 99.1, country: "US" },
  { symbol: "AMD", name: "Adv. Micro Devices", sector: "Semiconductors", basePrice: 158.2, country: "US" },
  { symbol: "INTC", name: "Intel Corp.", sector: "Semiconductors", basePrice: 24.3, country: "US" },
  { symbol: "BA", name: "Boeing Co.", sector: "Aerospace", basePrice: 156.8, country: "US" },
  { symbol: "COIN", name: "Coinbase", sector: "Crypto", basePrice: 245.0, country: "US" },
  { symbol: "PYPL", name: "PayPal Holdings", sector: "Finance", basePrice: 71.4, country: "US" },
  { symbol: "UBER", name: "Uber Technologies", sector: "Transportation", basePrice: 68.2, country: "US" },
  { symbol: "SPOT", name: "Spotify Technology", sector: "Entertainment", basePrice: 312.8, country: "US" },
  { symbol: "PLTR", name: "Palantir Technologies", sector: "Technology", basePrice: 22.4, country: "US" },
  { symbol: "SNOW", name: "Snowflake Inc.", sector: "Technology", basePrice: 148.6, country: "US" },
  // Indian Stocks (priced in USD equiv — divided by ~83 from INR)
  { symbol: "RELIANCE", name: "Reliance Industries", sector: "Energy", basePrice: 28.9, country: "IN" },
  { symbol: "TCS", name: "Tata Consultancy", sector: "Technology", basePrice: 43.6, country: "IN" },
  { symbol: "INFY", name: "Infosys Ltd.", sector: "Technology", basePrice: 18.9, country: "IN" },
  { symbol: "HDFCBANK", name: "HDFC Bank", sector: "Finance", basePrice: 19.7, country: "IN" },
  { symbol: "ICICIBANK", name: "ICICI Bank", sector: "Finance", basePrice: 14.8, country: "IN" },
  { symbol: "WIPRO", name: "Wipro Ltd.", sector: "Technology", basePrice: 6.4, country: "IN" },
  { symbol: "SBIN", name: "State Bank of India", sector: "Finance", basePrice: 8.1, country: "IN" },
  { symbol: "TATAMOTORS", name: "Tata Motors", sector: "Automotive", basePrice: 10.4, country: "IN" },
  { symbol: "BAJFINANCE", name: "Bajaj Finance", sector: "Finance", basePrice: 81.2, country: "IN" },
  { symbol: "ADANIENT", name: "Adani Enterprises", sector: "Energy", basePrice: 29.6, country: "IN" },
];

export function findStock(symbol: string): StockMeta | undefined {
  return STOCK_UNIVERSE.find((s) => s.symbol === symbol.toUpperCase());
}

// Deterministic pseudo-random based on symbol + day for stable "live" prices
function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getLivePrice(symbol: string): number {
  const meta = findStock(symbol);
  if (!meta) return 0;
  // tick every 5 seconds — gives "live" feel
  const tick = Math.floor(Date.now() / 5000);
  const seed = hash(symbol + tick);
  const drift = ((seed % 1000) / 1000 - 0.5) * 0.04; // ±2%
  return +(meta.basePrice * (1 + drift)).toFixed(2);
}

export function getDayChange(symbol: string): number {
  const seed = hash(symbol + Math.floor(Date.now() / 86400000));
  return ((seed % 1000) / 1000 - 0.5) * 0.08; // ±4%
}

// 30-day historical series, deterministic
export function getHistory(symbol: string, days = 30): { date: string; price: number }[] {
  const meta = findStock(symbol);
  if (!meta) return [];
  const out: { date: string; price: number }[] = [];
  const now = Date.now();
  let price = meta.basePrice * 0.92;
  for (let i = days - 1; i >= 0; i--) {
    const seed = hash(symbol + i);
    const change = ((seed % 1000) / 1000 - 0.48) * 0.05;
    price = price * (1 + change);
    const d = new Date(now - i * 86400000);
    out.push({
      date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      price: +price.toFixed(2),
    });
  }
  // ensure last point ~ current price
  out[out.length - 1].price = getLivePrice(symbol);
  return out;
}

export const SECTOR_COLORS: Record<string, string> = {
  Technology: "oklch(0.7 0.18 255)",
  Consumer: "oklch(0.78 0.18 60)",
  Automotive: "oklch(0.7 0.22 25)",
  Semiconductors: "oklch(0.78 0.18 152)",
  Entertainment: "oklch(0.65 0.22 320)",
  Finance: "oklch(0.72 0.16 200)",
  Aerospace: "oklch(0.7 0.14 100)",
  Crypto: "oklch(0.78 0.2 80)",
  Energy: "oklch(0.75 0.18 50)",
  Transportation: "oklch(0.7 0.15 170)",
};
