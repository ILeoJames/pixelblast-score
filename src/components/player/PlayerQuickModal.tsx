"use client";

import Link from "next/link";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ONLINE_MS, fmtAgo, fmtTime } from "@/utils/time";
import type { PlayerRow } from "@/hooks/usePlayers";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  player: PlayerRow | null;
  now: number;
};

export function PlayerQuickModal({ open, onOpenChange, player, now }: Props) {
  if (!player) return null;

  const isOnline = now - player.updatedAt <= ONLINE_MS;
  const ago = now - player.updatedAt;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/10 bg-black/70 text-white backdrop-blur-xl">
        {/* HEADER */}
        <DialogHeader>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              {/* Имя */}
              <h2 className="truncate text-2xl font-extrabold tracking-tight">
                {player.name}
              </h2>

              {/* Online / Offline */}
              <Badge
                className={
                  isOnline
                    ? "bg-emerald-400/15 text-emerald-200"
                    : "bg-white/10 text-white/80"
                }
              >
                {isOnline ? "online" : "offline"}
              </Badge>
            </div>

            {/* ID + last seen */}
            <div className="text-xs text-white/60">
              ID: <span className="font-semibold text-white/80">{player.id}</span>{" "}
              • последнее обновление: {fmtAgo(ago)}
            </div>
          </div>
        </DialogHeader>

        {/* CONTENT */}
        <div className="grid gap-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Рейтинг */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-sm text-white/70">Рейтинг</div>
              <div className="text-2xl font-extrabold">
                {player.maxPoints.toLocaleString()}
              </div>
            </div>

            {/* Обновление */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-sm text-white/70">Последнее обновление</div>
              <div className="text-sm font-semibold">
                {fmtTime(player.updatedAt)}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/15"
              onClick={() => onOpenChange(false)}
            >
              Закрыть
            </Button>

            <Link href={`/player/${player.id}`}>
              <Button className="bg-white text-black hover:bg-white/90">
                Открыть профиль
              </Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
