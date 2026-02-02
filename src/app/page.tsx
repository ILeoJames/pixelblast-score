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
  updatedAt: number; // ms
};

type ApiOk = { ok: true; data: { items: Row[]; order?: "asc" | "desc" } };
type ApiErr = { ok: false; error: string };
type ApiResponse = ApiOk | ApiErr;

function isApiResponse(v: unknown): v is ApiResponse {
  if (typeof v !== "object" || v === null) return false;
  if (!("ok" in v)) return false;
  return true;
}

const ONLINE_MS = 10 * 60 * 1000; // 10 минут

function fmtTime(ts: number) {
  return new Date(ts).toLocaleString();
}

function fmtAgo(msAgo: number) {
  const s = Math.floor(msAgo / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
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

  const now = Date.now();

  const online = useMemo(() => {
    // online на основе updatedAt
    return sorted.filter((p) => now - p.updatedAt <= ONLINE_MS);
  }, [sorted, now]);

  // компактные списки (можно увеличить)
  const allList = useMemo(() => sorted.slice(0, 30), [sorted]);
  const onlineList = useMemo(() => online.slice(0, 30), [online]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url(/bg.jpg)" }}
        aria-hidden="true"
      />
      {/* Blur + overlay */}
      <div className="absolute inset-0 -z-10 backdrop-blur-3xl" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/65 via-black/55 to-black/75" aria-hidden="true" />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              ТОП игроков <span className="text-white/80">pixelblast</span>
            </h1>

            <div className="flex flex-wrap items-center gap-2 text-sm text-white/80">
              <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
                автообновление 3с
              </Badge>

              <span className="rounded-full bg-white/10 px-3 py-1">
                всего: <span className="font-semibold text-white">{items.length}</span>
              </span>

              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-200">
                онлайн: <span className="font-semibold text-emerald-100">{online.length}</span>
              </span>

              {lastUpdatedAt ? (
                <span className="rounded-full bg-white/10 px-3 py-1">
                  обновлено:{" "}
                  <span className="font-semibold text-white">
                    {new Date(lastUpdatedAt).toLocaleTimeString()}
                  </span>
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
              maxPoints {order === "desc" ? "↓" : "↑"}
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

        {/* TOP 3 */}
        <div className="mb-4 grid gap-3 md:grid-cols-3">
          {loading ? (
            <>
              <Skeleton className="h-[110px] rounded-2xl bg-white/10" />
              <Skeleton className="h-[110px] rounded-2xl bg-white/10" />
              <Skeleton className="h-[110px] rounded-2xl bg-white/10" />
            </>
          ) : (
            top3.map((p, i) => (
              <Card key={p.id} className="rounded-2xl border-white/10 bg-white/10 text-white shadow-xl backdrop-blur-xl">
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
                  <div className="text-sm text-white/70">maxPoints</div>
                  <div className="text-2xl font-extrabold">{p.maxPoints.toLocaleString()}</div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Lists */}
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          {/* All players list */}
          <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Все игроки</span>
                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
                  показано: {Math.min(allList.length, 30)}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full rounded-xl bg-white/10" />
                  <Skeleton className="h-9 w-full rounded-xl bg-white/10" />
                  <Skeleton className="h-9 w-full rounded-xl bg-white/10" />
                </div>
              ) : allList.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">Пока пусто.</div>
              ) : (
                <div className="max-h-[320px] overflow-auto rounded-xl border border-white/10">
                  <ul className="divide-y divide-white/10">
                    {allList.map((p, idx) => (
                      <li key={p.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">
                            <span className="text-white/60 mr-2">#{idx + 1}</span>
                            {p.name}
                          </div>
                          <div className="text-xs text-white/60">ID: {p.id}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold">{p.maxPoints.toLocaleString()}</div>
                          <div className="text-xs text-white/60">{fmtAgo(now - p.updatedAt)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Online players list */}
          <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Онлайн игроки</span>
                <Badge className="bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/20">
                  онлайн: {online.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full rounded-xl bg-white/10" />
                  <Skeleton className="h-9 w-full rounded-xl bg-white/10" />
                  <Skeleton className="h-9 w-full rounded-xl bg-white/10" />
                </div>
              ) : onlineList.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                  Сейчас никто не онлайн (обновление было &gt; 10 минут назад).
                </div>
              ) : (
                <div className="max-h-[320px] overflow-auto rounded-xl border border-white/10">
                  <ul className="divide-y divide-white/10">
                    {onlineList.map((p) => (
                      <li key={p.id} className="flex items-center justify-between px-4 py-3">
                        <div className="min-w-0">
                          <div className="truncate font-semibold">{p.name}</div>
                          <div className="text-xs text-white/60">ID: {p.id}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-extrabold">{p.maxPoints.toLocaleString()}</div>
                          <div className="text-xs text-emerald-200/90">{fmtAgo(now - p.updatedAt)}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-3 text-xs text-white/60">
                Онлайн = последнее обновление ≤ <span className="text-white/80 font-semibold">10 минут</span>.
              </div>
            </CardContent>
          </Card>
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
                      <TableHead className="text-right text-white/80">updatedAt</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {sorted.map((p, idx) => {
                      const isOnline = now - p.updatedAt <= ONLINE_MS;
                      return (
                        <TableRow key={p.id} className="border-white/10">
                          <TableCell className="font-bold">
                            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">{idx + 1}</span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-cyan-400/20 ring-1 ring-white/10" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="truncate font-semibold">{p.name}</div>
                                  {isOnline ? (
                                    <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                                      online
                                    </span>
                                  ) : (
                                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/70">
                                      offline
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-white/60">ID: {p.id}</div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-right text-lg font-extrabold">
                            {p.maxPoints.toLocaleString()}
                          </TableCell>

                          <TableCell className="text-right">
                            <div className="text-sm font-semibold text-white/90">{fmtTime(p.updatedAt)}</div>
                            <div className="text-xs text-white/60">{fmtAgo(now - p.updatedAt)}</div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-white/50">Pixelblast leaderboard • данные обновляются автоматически</div>
      </div>
    </main>
  );
}
