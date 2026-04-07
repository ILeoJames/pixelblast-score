"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ONLINE_MS, fmtAgo, fmtTime } from "@/utils/time";
import type { PlayerRow } from "@/hooks/usePlayers";

export function LeaderboardTable({
  items,
  now,
  onOpenPlayer,
}: {
  items: PlayerRow[];
  now: number;
  onOpenPlayer: (p: PlayerRow) => void;
}) {
  return (
    <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
      <CardHeader className="pb-3">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-white">
          <span>Таблица рейтинга</span>
          <span className="text-xs text-white/60">Дата создания + Последний визит + online/offline</span>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {items.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">Ничего не найдено.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/10">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 bg-white/5">
                  <TableHead className="w-[90px] text-white/80">#</TableHead>
                  <TableHead className="text-white/80">Игрок</TableHead>
                  <TableHead className="text-right text-white/80">Рейтинг</TableHead>
                  <TableHead className="text-right text-white/80">Дата создания</TableHead>
                  <TableHead className="text-right text-white/80">Последний визит</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {items.map((p, idx) => {
                  const isOnline = now - p.updatedAt <= ONLINE_MS;
                  const ago = now - p.updatedAt;

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
                              <Button
                                variant="ghost"
                                className="h-auto p-0 text-left text-white hover:bg-transparent hover:text-white/90"
                                onClick={() => onOpenPlayer(p)}
                              >
                                <span className="truncate font-semibold">{p.name}</span>
                              </Button>

                              <Badge className={isOnline ? "bg-emerald-400/15 text-emerald-200" : "bg-white/10 text-white/80"}>
                                {isOnline ? "online" : "offline"}
                              </Badge>
                            </div>
                            <div className="text-xs text-white/60">ID: {p.id}</div>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-right text-lg font-extrabold">{p.maxPoints.toLocaleString()}</TableCell>

                      <TableCell className="text-right text-sm font-semibold text-white/90">{fmtTime(p.updatedAt)}</TableCell>

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
  );
}
