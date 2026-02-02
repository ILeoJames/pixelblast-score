"use client";

import { useEffect, useMemo, useState } from "react";

export type PlayerRow = {
  id: number;
  name: string;
  maxPoints: number;
  updatedAt: number;
};

type ApiOk = { ok: true; data: { items: PlayerRow[] } };
type ApiErr = { ok: false; error: string };
type ApiResponse = ApiOk | ApiErr;

function isApiResponse(v: unknown): v is ApiResponse {
  if (typeof v !== "object" || v === null) return false;
  return "ok" in v;
}

export function usePlayers(order: "asc" | "desc") {
  const [items, setItems] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  async function load(opts?: { silent?: boolean }) {
    const silent = opts?.silent ?? false;

    if (silent) setRefreshing(true);
    else setLoading(true);

    setError(null);

    try {
      const res = await fetch(`/api/client?order=${order}`, { cache: "no-store" });
      const text = await res.text();

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(`API вернул не JSON (HTTP ${res.status}).`);
      }

      if (!isApiResponse(parsed)) throw new Error("Неверный формат ответа API.");
      if (!res.ok || parsed.ok === false) throw new Error(parsed.ok === false ? parsed.error : `HTTP ${res.status}`);

      const newItems = parsed.data.items;

      // ✨ микро-оптимизация: если данные “те же” — не обновляем state
      setItems((prev) => {
        if (prev.length === newItems.length) {
          const p0 = prev[0], n0 = newItems[0];
          const p1 = prev[1], n1 = newItems[1];
          if (
            (p0?.id ?? null) === (n0?.id ?? null) &&
            (p0?.maxPoints ?? null) === (n0?.maxPoints ?? null) &&
            (p1?.id ?? null) === (n1?.id ?? null) &&
            (p1?.maxPoints ?? null) === (n1?.maxPoints ?? null)
          ) {
            return prev;
          }
        }
        return newItems;
      });

      setLastUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "UNKNOWN_ERROR");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run(initial: boolean) {
      if (cancelled) return;
      await load({ silent: !initial });
    }

    run(true);
    const t = setInterval(() => run(false), 3000);

    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const status = useMemo(() => {
    if (loading) return "loading" as const;
    if (refreshing) return "refreshing" as const;
    return "online" as const;
  }, [loading, refreshing]);

  return { items, loading, refreshing, error, lastUpdatedAt, load, status };
}
