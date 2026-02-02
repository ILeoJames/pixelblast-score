"use client";

import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-3">
            <span className="truncate">{player.name}</span>
            <Badge className={isOnline ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/80"}>
              {isOnline ? "online" : "offline"}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-3">
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="text-sm text-white/70">ID</div>
            <div className="text-lg font-bold">{player.id}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-sm text-white/70">Рейтинг</div>
              <div className="text-xl font-extrabold">{player.maxPoints.toLocaleString()}</div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-sm text-white/70">Последнее обновление</div>
              <div className="text-sm font-semibold">{fmtTime(player.updatedAt)}</div>
              <div className="text-xs text-white/60">Last seen: {fmtAgo(ago)}</div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" className="bg-white/10 text-white hover:bg-white/15" onClick={() => onOpenChange(false)}>
              Закрыть
            </Button>

            <Link href={`/player/${player.id}`}>
              <Button className="bg-white text-black hover:bg-white/90">Открыть профиль</Button>
            </Link>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
