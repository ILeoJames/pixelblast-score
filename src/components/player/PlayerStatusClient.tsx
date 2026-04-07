"use client";

import { Badge } from "@/components/ui/badge";
import { useNow } from "@/hooks/useNow";
import { ONLINE_MS, fmtAgo, fmtTime } from "@/utils/time";

export function PlayerStatusClient({ updatedAt }: { updatedAt: number }) {
  const now = useNow(5000);
  const isOnline = now - updatedAt <= ONLINE_MS;

  return (
    <div className="mt-1 text-xs text-white/60">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className={isOnline ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/80"}>
          {isOnline ? "online" : "offline"}
        </Badge>
        <span>Дата создания: {fmtTime(updatedAt)}</span>
        <span>• Последний визит: {fmtAgo(now - updatedAt)}</span>
      </div>
    </div>
  );
}
