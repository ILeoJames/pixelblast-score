"use client";

import { useEffect, useState } from "react";

/**
 * Даёт "текущее время" как state, чтобы не вызывать Date.now() во время render
 * (ESLint react-hooks/purity).
 */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);

  return now;
}
