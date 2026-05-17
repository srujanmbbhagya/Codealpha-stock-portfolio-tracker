// Voice input hook using Web Speech API
// Parses commands like "Add 10 shares of Apple" or "Add 5 NVDA at 450"

import { useState, useCallback, useRef } from "react";
import { findStock, STOCK_UNIVERSE } from "@/lib/stocks";

export interface ParsedVoiceCommand {
  symbol?: string;
  quantity?: number;
  price?: number;
  confidence: "high" | "medium" | "low";
  raw: string;
}

function parseVoiceCommand(transcript: string): ParsedVoiceCommand {
  const t = transcript.toLowerCase();
  let symbol: string | undefined;
  let quantity: number | undefined;
  let price: number | undefined;

  // Try to find a stock by symbol (e.g. "AAPL", "nvda")
  const symMatch = transcript.match(/\b([A-Za-z]{2,10})\b/g);
  if (symMatch) {
    for (const w of symMatch) {
      const s = findStock(w.toUpperCase());
      if (s) { symbol = s.symbol; break; }
    }
  }

  // Try to find by name (e.g. "apple", "tesla")
  if (!symbol) {
    for (const stock of STOCK_UNIVERSE) {
      if (t.includes(stock.name.toLowerCase()) || t.includes(stock.symbol.toLowerCase())) {
        symbol = stock.symbol;
        break;
      }
    }
  }

  // Extract quantity — look for number before "shares" or after "add"
  const qtyPatterns = [
    /add\s+(\d+(?:\.\d+)?)\s+(?:shares?\s+of\s+)?/i,
    /(\d+(?:\.\d+)?)\s+shares?/i,
    /buy\s+(\d+(?:\.\d+)?)/i,
    /(\d+(?:\.\d+)?)\s+(?:units?|stocks?)/i,
  ];
  for (const p of qtyPatterns) {
    const m = transcript.match(p);
    if (m) { quantity = parseFloat(m[1]); break; }
  }

  // Extract price — look for "at X" or "for X" or "$X"
  const pricePatterns = [
    /(?:at|@|for)\s+\$?(\d+(?:\.\d+)?)/i,
    /\$(\d+(?:\.\d+)?)/i,
    /price\s+(\d+(?:\.\d+)?)/i,
  ];
  for (const p of pricePatterns) {
    const m = transcript.match(p);
    if (m) { price = parseFloat(m[1]); break; }
  }

  const confidence =
    symbol && quantity ? "high" :
    symbol ? "medium" : "low";

  return { symbol, quantity, price, confidence, raw: transcript };
}

export interface VoiceInputState {
  listening: boolean;
  supported: boolean;
  transcript: string;
  parsed: ParsedVoiceCommand | null;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useVoiceInput(): VoiceInputState {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsed, setParsed] = useState<ParsedVoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const supported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  const start = useCallback(() => {
    if (!supported) {
      setError("Speech recognition not supported in this browser.");
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SpeechRecognition();
    r.lang = "en-US";
    r.interimResults = false;
    r.maxAlternatives = 1;
    r.onstart = () => { setListening(true); setError(null); };
    r.onresult = (e: SpeechRecognitionEvent) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      setParsed(parseVoiceCommand(text));
    };
    r.onerror = (e: SpeechRecognitionErrorEvent) => {
      setError(`Voice error: ${e.error}`);
      setListening(false);
    };
    r.onend = () => setListening(false);
    recognitionRef.current = r;
    r.start();
  }, [supported]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  const reset = useCallback(() => {
    setTranscript("");
    setParsed(null);
    setError(null);
  }, []);

  return { listening, supported, transcript, parsed, error, start, stop, reset };
}
