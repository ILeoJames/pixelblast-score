"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { usePlayers } from "@/hooks/usePlayers";
import { useNow } from "@/hooks/useNow";
import { ONLINE_MS } from "@/utils/time";

import { ControlBar } from "@/components/leaderboard/ControlBar";
import { TopThree } from "@/components/leaderboard/TopThree";
import { PlayerLists } from "@/components/leaderboard/PlayerLists";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";

import { PlayerQuickModal } from "@/components/player/PlayerQuickModal";
import type { PlayerRow } from "@/hooks/usePlayers";

type LimitMode = "all" | "50" | "200";

export default function HomePage() {
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const [query, setQuery] = useState("");
  const [onlineOnly, setOnlineOnly] = useState(false);
  const [limitMode, setLimitMode] = useState<LimitMode>("all");

  const { items, loading, error, lastUpdatedAt, load, status } = usePlayers(order);

  // "текущее время" как state (чтобы не вызывать Date.now в render)
  const now = useNow(5000);

  // modal
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);

  const openPlayer = (p: PlayerRow) => {
    setSelectedPlayer(p);
    setModalOpen(true);
  };

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

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <div
        className="absolute inset-0 -z-20 bg-cover bg-center"
        style={{ backgroundImage: "url(/bg.jpg)" }}
        aria-hidden="true"
      />
      <div className="absolute inset-0 -z-10 backdrop-blur-xl" aria-hidden="true" />
      <div
        className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/50 to-black/70"
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-4 space-y-3">
          <div className="inline-flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-fuchsia-500/40 to-cyan-400/25 ring-1 ring-white/10 shadow-[0_0_30px_rgba(56,189,248,0.15)]" />
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
                <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(255,255,255,0.18)]">
                  ТОП игроков
                </span>{" "}
                <span className="bg-gradient-to-r from-fuchsia-300 via-cyan-200 to-emerald-200 bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(56,189,248,0.18)]">
                  pixelblast
                </span>
              </h1>
              <div className="text-xs text-white/60">Живой рейтинг • автообновление • онлайн статус</div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-sm text-white/80 tabular-nums">
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
                обновлено: <span className="font-semibold text-white">{new Date(lastUpdatedAt).toLocaleTimeString()}</span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Controls */}
        <ControlBar
          order={order}
          onToggleOrder={() => setOrder((p) => (p === "desc" ? "asc" : "desc"))}
          onRefresh={() => load({ silent: false })}
          disabled={loading}
          status={status}
          query={query}
          setQuery={setQuery}
          onlineOnly={onlineOnly}
          setOnlineOnly={setOnlineOnly}
          limitMode={limitMode}
          setLimitMode={setLimitMode}
        />

        {/* Error */}
        {error ? (
          <div className="mt-4 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-100">
            <div className="font-semibold">Ошибка</div>
            <div className="mt-1 text-red-100/90">{error}</div>
          </div>
        ) : null}

        {/* Content */}
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="grid gap-3 md:grid-cols-3">
              <Skeleton className="h-[120px] rounded-2xl bg-white/10" />
              <Skeleton className="h-[120px] rounded-2xl bg-white/10" />
              <Skeleton className="h-[120px] rounded-2xl bg-white/10" />
            </div>
          ) : (
            <TopThree items={filtered} now={now} onOpenPlayer={openPlayer} />
          )}

          <PlayerLists items={filtered} now={now} onOpenPlayer={openPlayer} />
          <LeaderboardTable items={filtered} now={now} onOpenPlayer={openPlayer} />

          <div className="text-center text-xs text-white/50">
            Pixelblast leaderboard • фильтры работают поверх данных • автообновление 3 секунды
          </div>
        </div>
      </div>

      {/* Quick modal */}
      <PlayerQuickModal open={modalOpen} onOpenChange={setModalOpen} player={selectedPlayer} now={now} />
    </main>
  );
}
