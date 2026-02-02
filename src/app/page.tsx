"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type Row = {
  id: number;
  name: string;
  maxPoints: number;
  updatedAt: number;
};

type ApiOk = { ok: true; data: { items: Row[]; order?: "asc" | "desc" } };
type ApiErr = { ok: false; error: string };
type ApiResponse = ApiOk | ApiErr;

function isApiResponse(v: unknown): v is ApiResponse {
  if (typeof v !== "object" || v === null) return false;
  if (!("ok" in v)) return false;
  return true;
}

export default function HomePage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [order, setOrder] = useState<"desc" | "asc">("desc");
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

      if (!res.ok || parsed.ok === false) {
        throw new Error(parsed.ok === false ? parsed.error : `HTTP ${res.status}`);
      }

      setItems(parsed.data.items);
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

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => (order === "desc" ? b.maxPoints - a.maxPoints : a.maxPoints - b.maxPoints));
    return arr;
  }, [items, order]);

  const top3 = useMemo(() => sorted.slice(0, 3), [sorted]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url(/bg.jpg)" }}
        aria-hidden="true"
      />
      {/* Blur + dark overlay */}
      <div className="absolute inset-0 -z-10 backdrop-blur-3xl" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/65 via-black/55 to-black/75" aria-hidden="true" />

      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              ТОП ИГРОКОВ <span className="text-white/80">PIXELBLAST</span>
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
              <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
                Автообновление 3с
              </Badge>

              {lastUpdatedAt ? (
                <span className="rounded-full bg-white/10 px-3 py-1">
                  обновлено: <span className="font-semibold text-white">{new Date(lastUpdatedAt).toLocaleTimeString()}</span>
                </span>
              ) : null}

              {loading ? (
                <span className="rounded-full bg-white/10 px-3 py-1">загрузка…</span>
              ) : refreshing ? (
                <span className="rounded-full bg-white/10 px-3 py-1">обновление…</span>
              ) : (
                <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-200">онлайн</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/15"
              onClick={() => setOrder((p) => (p === "desc" ? "asc" : "desc"))}
              disabled={loading}
            >
              Рейтинг {order === "desc" ? "↓" : "↑"}
            </Button>

            <Button className="bg-white text-black hover:bg-white/90" onClick={() => load({ silent: false })} disabled={loading}>
              Обновить
            </Button>
          </div>
        </div>

        {/* Error */}
        {error ? (
          <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            <div className="font-semibold">Ошибка</div>
            <div className="mt-1 text-red-100/90">{error}</div>
          </div>
        ) : null}

        {/* TOP 3 cards */}
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {loading ? (
            <>
              <Skeleton className="h-[110px] rounded-2xl bg-white/10" />
              <Skeleton className="h-[110px] rounded-2xl bg-white/10" />
              <Skeleton className="h-[110px] rounded-2xl bg-white/10" />
            </>
          ) : (
            top3.map((p, i) => (
              <Card
                key={p.id}
                className="rounded-2xl border-white/10 bg-white/10 text-white shadow-xl backdrop-blur-xl"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span className="truncate">{p.name}</span>
                    <span
                      className={[
                        "rounded-full px-3 py-1 text-xs font-bold",
                        i === 0 ? "bg-yellow-400/20 text-yellow-200" : "",
                        i === 1 ? "bg-slate-200/15 text-slate-200" : "",
                        i === 2 ? "bg-orange-400/15 text-orange-200" : "",
                      ].join(" ")}
                    >
                      #{i + 1}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex items-end justify-between">
                  <div className="text-sm text-white/70">Рейтинг</div>
                  <div className="text-2xl font-extrabold">{p.maxPoints.toLocaleString()}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Table */}
        <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="text-white">Таблица рейтинга</CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
                <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
                <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
              </div>
            ) : sorted.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                Пока нет игроков. Отправь POST на <span className="font-semibold text-white">/api/client</span>.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 bg-white/5">
                      <TableHead className="w-[90px] text-white/80">#</TableHead>
                      <TableHead className="text-white/80">Игрок</TableHead>
                      <TableHead className="text-right text-white/80">maxPoints</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sorted.map((p, idx) => (
                      <TableRow key={p.id} className="border-white/10">
                        <TableCell className="font-bold">
                          <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                            {idx + 1}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-cyan-400/20 ring-1 ring-white/10" />
                            <div className="min-w-0">
                              <div className="truncate font-semibold">{p.name}</div>
                              <div className="text-xs text-white/60">ID: {p.id}</div>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right text-lg font-extrabold">
                          {p.maxPoints.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-white/50">
          Created by LeoJames & badcast & AIP
        </div>
      </div>
    </main>
  );
}
