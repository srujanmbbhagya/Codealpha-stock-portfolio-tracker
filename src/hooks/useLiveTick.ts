import { useEffect, useState } from "react";

// Forces a re-render every N ms so live prices/calculations refresh.
export function useLiveTick(intervalMs = 5000) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return tick;
}
