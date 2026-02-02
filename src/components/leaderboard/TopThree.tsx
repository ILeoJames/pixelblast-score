"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ONLINE_MS, fmtAgo } from "@/utils/time";
import type { PlayerRow } from "@/hooks/usePlayers";

function medal(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return `#${rank}`;
}

export function TopThree({
  items,
  now,
  onOpenPlayer,
}: {
  items: PlayerRow[];
  now: number;
  onOpenPlayer: (p: PlayerRow) => void;
}) {
  const top3 = items.slice(0, 3);

  return (
    <div className="grid gap-3 md:grid-cols-3">
      {top3.map((p, i) => {
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
                <Button
                  variant="ghost"
                  className="h-auto p-0 text-left text-white hover:bg-transparent hover:text-white/90"
                  onClick={() => onOpenPlayer(p)}
                >
                  <span className="truncate">{p.name}</span>
                </Button>

                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold">{medal(i + 1)}</span>
              </CardTitle>
            </CardHeader>

            <CardContent className="flex items-end justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm text-white/70">Рейтинг</div>
                <div className="text-2xl font-extrabold">{p.maxPoints.toLocaleString()}</div>
              </div>

              <div className="text-right space-y-1">
                <Badge className={isOnline ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/80"}>
                  {isOnline ? "online" : "offline"}
                </Badge>
                <div className="text-xs text-white/70">
                  Last seen: <span className="text-white/90 font-semibold">{fmtAgo(ago)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
