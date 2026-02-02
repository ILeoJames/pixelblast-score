"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  return "ok" in v;
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

type LimitMode = "all" | "50" | "200";

function Medal({ rank }: { rank: number }) {
  if (rank === 1) return <span aria-label="gold medal">🥇</span>;
  if (rank === 2) return <span aria-label="silver medal">🥈</span>;
  if (rank === 3) return <span aria-label="bronze medal">🥉</span>;
  return <span className="text-white/60">#{rank}</span>;
}

export default function HomePage() {
  const [items, setItems] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  // UI controls
  const [query, setQuery] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [limitMode, setLimitMode] = useState<LimitMode>("all");

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

  const now = Date.now();

  const sorted = useMemo(() => {
    const arr = [...items];
    arr.sort((a, b) => (order === "desc" ? b.maxPoints - a.maxPoints : a.maxPoints - b.maxPoints));
    return arr;
  }, [items, order]);

  const online = useMemo(() => sorted.filter((p) => now - p.updatedAt <= ONLINE_MS), [sorted, now]);

  const normalizedQuery = query.trim().toLowerCase();

  const filtered = useMemo(() => {
    let base = onlineOnly ? online : sorted;

    if (normalizedQuery) {
      base = base.filter((p) => p.name.toLowerCase().includes(normalizedQuery));
    }

    const lim = limitMode === "50" ? 50 : limitMode === "200" ? 200 : Infinity;
    if (Number.isFinite(lim)) base = base.slice(0, lim);

    return base;
  }, [sorted, online, onlineOnly, normalizedQuery, limitMode]);

  const shownOnlineCount = useMemo(
    () => filtered.filter((p) => now - p.updatedAt <= ONLINE_MS).length,
    [filtered, now]
  );

  const top3 = useMemo(() => filtered.slice(0, 3), [filtered]);

  const listAll = useMemo(() => filtered.slice(0, 40), [filtered]);
  const listOnline = useMemo(() => filtered.filter((p) => now - p.updatedAt <= ONLINE_MS).slice(0, 40), [filtered, now]);

  const statusPill = loading
    ? "загрузка…"
    : refreshing
    ? "обновление…"
    : "онлайн";

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* === Animated neon layer (pure CSS) === */}
      <div className="pointer-events-none absolute inset-0 -z-30 opacity-70">
        <div className="neon-move absolute -inset-40 bg-[radial-gradient(circle_at_20%_20%,rgba(217,70,239,0.35),transparent_40%),radial-gradient(circle_at_80%_30%,rgba(34,211,238,0.28),transparent_45%),radial-gradient(circle_at_40%_90%,rgba(250,204,21,0.22),transparent_40%)]" />
      </div>

      {/* Background image */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url(/bg.jpg)" }}
        aria-hidden="true"
      />
      {/* Blur + overlay */}
      <div className="absolute inset-0 -z-10 backdrop-blur-3xl" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/70 via-black/55 to-black/80" aria-hidden="true" />

      {/* Local styles for animation */}
      <style>{`
        @keyframes neonMove {
          0% { transform: translate3d(0,0,0) scale(1); filter: blur(0px); }
          50% { transform: translate3d(-3%, 2%, 0) scale(1.06); filter: blur(2px); }
          100% { transform: translate3d(0,0,0) scale(1); filter: blur(0px); }
        }
        .neon-move { animation: neonMove 14s ease-in-out infinite; }
        @keyframes pulseDot {
          0% { transform: scale(0.9); opacity: 0.7; }
          50% { transform: scale(1.25); opacity: 1; }
          100% { transform: scale(0.9); opacity: 0.7; }
        }
        .pulse-dot { animation: pulseDot 1.2s ease-in-out infinite; }
      `}</style>

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

              <span className="rounded-full bg-white/10 px-3 py-1">
                показано: <span className="font-semibold text-white">{filtered.length}</span>
              </span>

              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-emerald-200">
                онлайн в списке: <span className="font-semibold text-emerald-100">{shownOnlineCount}</span>
              </span>

              {lastUpdatedAt ? (
                <span className="rounded-full bg-white/10 px-3 py-1">
                  обновлено:{" "}
                  <span className="font-semibold text-white">
                    {new Date(lastUpdatedAt).toLocaleTimeString()}
                  </span>
                </span>
              ) : null}

              <span className="rounded-full bg-white/10 px-3 py-1 flex items-center gap-2">
                <span
                  className={[
                    "h-2.5 w-2.5 rounded-full",
                    loading ? "bg-white/40" : "bg-emerald-300/80",
                    !loading ? "pulse-dot" : "",
                  ].join(" ")}
                />
                {statusPill}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                className="bg-white/10 text-white hover:bg-white/15"
                onClick={() => setOrder((p) => (p === "desc" ? "asc" : "desc"))}
                disabled={loading}
              >
                maxPoints {order === "desc" ? "↓" : "↑"}
              </Button>

              <Button
                className="bg-white text-black hover:bg-white/90"
                onClick={() => load({ silent: false })}
                disabled={loading}
              >
                Обновить
              </Button>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск по никнейму…"
                  className="w-[230px] border-white/10 bg-white/10 text-white placeholder:text-white/50 focus-visible:ring-white/20"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-white/70 hover:bg-white/10"
                    title="Очистить"
                  >
                    ✕
                  </button>
                ) : null}
              </div>

              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2">
                <Switch checked={onlineOnly} onCheckedChange={setOnlineOnly} />
                <span className="text-sm text-white/80">только онлайн</span>
              </div>

              <Select value={limitMode} onValueChange={(v) => setLimitMode(v as LimitMode)}>
                <SelectTrigger className="w-[150px] border-white/10 bg-white/10 text-white focus:ring-white/20">
                  <SelectValue placeholder="Лимит" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="50">ТОП 50</SelectItem>
                  <SelectItem value="200">ТОП 200</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Skeleton className="h-[128px] rounded-2xl bg-white/10" />
              <Skeleton className="h-[128px] rounded-2xl bg-white/10" />
              <Skeleton className="h-[128px] rounded-2xl bg-white/10" />
            </>
          ) : (
            top3.map((p, i) => {
              const isOnline = now - p.updatedAt <= ONLINE_MS;
              const ago = now - p.updatedAt;

              return (
                <Card
                  key={p.id}
                  className={[
                    "rounded-2xl border-white/10 bg-white/10 text-white shadow-xl backdrop-blur-xl",
                    i === 0 ? "ring-1 ring-yellow-400/30" : "",
                    i === 1 ? "ring-1 ring-slate-200/20" : "",
                    i === 2 ? "ring-1 ring-orange-400/25" : "",
                  ].join(" ")}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between text-lg">
                      <span className="truncate">{p.name}</span>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">
                        <Medal rank={i + 1} />
                      </span>
                    </CardTitle>
                  </CardHeader>

                  <CardContent className="flex items-end justify-between gap-3">
                    <div className="space-y-1">
                      <div className="text-sm text-white/70">maxPoints</div>
                      <div className="text-2xl font-extrabold">{p.maxPoints.toLocaleString()}</div>
                    </div>

                    <div className="text-right space-y-1">
                      <Badge
                        className={
                          isOnline
                            ? "bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/20"
                            : "bg-white/10 text-white/80 hover:bg-white/15"
                        }
                      >
                        {isOnline ? "online" : "offline"}
                      </Badge>
                      <div className="text-xs text-white/70">
                        Last seen: <span className="text-white/90 font-semibold">{fmtAgo(ago)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Lists */}
        <div className="mb-4 grid gap-3 md:grid-cols-2">
          {/* All players list */}
          <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Список игроков</span>
                <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/15">
                  показано: {Math.min(listAll.length, 40)}
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
              ) : listAll.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                  Ничего не найдено (поиск/фильтры).
                </div>
              ) : (
                <div className="max-h-[350px] overflow-auto rounded-xl border border-white/10">
                  <ul className="divide-y divide-white/10">
                    {listAll.map((p, idx) => {
                      const isOnline = now - p.updatedAt <= ONLINE_MS;
                      const ago = now - p.updatedAt;
                      return (
                        <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold">
                              <span className="mr-2 text-white/60">
                                <Medal rank={idx + 1} />
                              </span>
                              {p.name}
                            </div>
                            <div className="text-xs text-white/60">
                              ID: {p.id} • updatedAt: {new Date(p.updatedAt).toLocaleTimeString()} • Last seen: {fmtAgo(ago)}
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-extrabold">{p.maxPoints.toLocaleString()}</div>
                            <Badge
                              className={
                                isOnline
                                  ? "bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/20"
                                  : "bg-white/10 text-white/80 hover:bg-white/15"
                              }
                            >
                              {isOnline ? "online" : "offline"}
                            </Badge>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Online list */}
          <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span>Онлайн игроки</span>
                <Badge className="bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/20">
                  онлайн: {listOnline.length}
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
              ) : listOnline.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                  Сейчас никто не онлайн (или фильтры скрыли игроков).
                </div>
              ) : (
                <div className="max-h-[350px] overflow-auto rounded-xl border border-white/10">
                  <ul className="divide-y divide-white/10">
                    {listOnline.map((p, idx) => {
                      const ago = now - p.updatedAt;
                      return (
                        <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div className="min-w-0">
                            <div className="truncate font-semibold">
                              <span className="mr-2 text-emerald-200/90">
                                <Medal rank={idx + 1} />
                              </span>
                              {p.name}
                            </div>
                            <div className="text-xs text-white/60">
                              ID: {p.id} • updatedAt: {new Date(p.updatedAt).toLocaleTimeString()} • Last seen:{" "}
                              <span className="font-semibold text-emerald-200">{fmtAgo(ago)}</span>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-extrabold">{p.maxPoints.toLocaleString()}</div>
                            <Badge className="bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/20">online</Badge>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              <div className="mt-3 text-xs text-white/60">
                Онлайн = последнее обновление ≤ <span className="font-semibold text-white/80">10 минут</span>.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-3">
            <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-white">
              <span>Таблица рейтинга</span>
              <span className="text-xs text-white/60">updatedAt + Last seen + online/offline</span>
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
                <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
                <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                Ничего не найдено (поиск/фильтры).
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
                      <TableHead className="text-right text-white/80">Last seen</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {filtered.map((p, idx) => {
                      const isOnline = now - p.updatedAt <= ONLINE_MS;
                      const ago = now - p.updatedAt;

                      return (
                        <TableRow key={p.id} className="border-white/10">
                          <TableCell className="font-bold">
                            <span className="rounded-full bg-white/10 px-3 py-1 text-sm">
                              <Medal rank={idx + 1} />
                            </span>
                          </TableCell>

                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-fuchsia-500/30 to-cyan-400/20 ring-1 ring-white/10" />
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <div className="truncate font-semibold">{p.name}</div>
                                  <Badge
                                    className={
                                      isOnline
                                        ? "bg-emerald-400/15 text-emerald-200 hover:bg-emerald-400/20"
                                        : "bg-white/10 text-white/80 hover:bg-white/15"
                                    }
                                  >
                                    {isOnline ? "online" : "offline"}
                                  </Badge>
                                </div>
                                <div className="text-xs text-white/60">ID: {p.id}</div>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="text-right text-lg font-extrabold">
                            {p.maxPoints.toLocaleString()}
                          </TableCell>

                          <TableCell className="text-right text-sm font-semibold text-white/90">
                            {fmtTime(p.updatedAt)}
                          </TableCell>

                          <TableCell className="text-right">
                            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/90">
                              {fmtAgo(ago)}
                            </span>
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

        <div className="mt-6 text-center text-xs text-white/50">
          Pixelblast leaderboard • поиск/фильтры работают поверх данных • автообновление 3 секунды
        </div>
      </div>
    </main>
  );
}
