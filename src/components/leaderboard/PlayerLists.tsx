"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ONLINE_MS, fmtAgo } from "@/utils/time";
import type { PlayerRow } from "@/hooks/usePlayers";

export function PlayerLists({ items, now }: { items: PlayerRow[]; now: number }) {
  const all = items.slice(0, 40);
  const online = items.filter((p) => now - p.updatedAt <= ONLINE_MS).slice(0, 40);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {/* All players */}
      <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Список игроков</span>
            <Badge variant="secondary" className="bg-white/10 text-white">
              показано: {all.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {all.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">Пусто.</div>
          ) : (
            <div className="max-h-[350px] overflow-auto rounded-xl border border-white/10">
              <ul className="divide-y divide-white/10">
                {all.map((p, idx) => {
                  const isOnline = now - p.updatedAt <= ONLINE_MS;
                  const ago = now - p.updatedAt;

                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">
                          <span className="mr-2 text-white/60">#{idx + 1}</span>
                          {p.name}
                        </div>
                        <div className="text-xs text-white/60">
                          ID: {p.id} • Last seen: {fmtAgo(ago)}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold">{p.maxPoints.toLocaleString()}</div>
                        <Badge className={isOnline ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/80"}>
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

      {/* Online players */}
      <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <span>Онлайн игроки</span>
            <Badge className="bg-emerald-400/15 text-emerald-200">онлайн: {online.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {online.length === 0 ? (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">Сейчас никто не онлайн.</div>
          ) : (
            <div className="max-h-[350px] overflow-auto rounded-xl border border-white/10">
              <ul className="divide-y divide-white/10">
                {online.map((p) => {
                  const ago = now - p.updatedAt;
                  return (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{p.name}</div>
                        <div className="text-xs text-white/60">
                          ID: {p.id} • Last seen:{" "}
                          <span className="font-semibold text-emerald-200">{fmtAgo(ago)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-extrabold">{p.maxPoints.toLocaleString()}</div>
                        <Badge className="bg-emerald-400/15 text-emerald-200">online</Badge>
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
  );
}
