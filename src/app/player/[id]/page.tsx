import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PlayerChart } from "@/components/player/PlayerChart";
import { PlayerStatusClient } from "@/components/player/PlayerStatusClient";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { fmtTime } from "@/utils/time";

// Чтобы страница не кешировалась и показывала свежие данные
export const dynamic = "force-dynamic";

export default async function PlayerPage({ params }: { params: { id: string } }) {
  // Поддержка случая, когда params может быть Promise
  const p = await Promise.resolve(params);
  const id = Number(p.id);

  if (!Number.isInteger(id) || id <= 0) {
    return (
      <div className="p-6 text-white">
        <div className="text-xl font-bold">Неверный ID</div>
        <Link href="/" className="underline">
          На главную
        </Link>
      </div>
    );
  }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return (
      <div className="p-6 text-white">
        <div className="text-xl font-bold">Игрок не найден</div>
        <Link href="/" className="underline">
          На главную
        </Link>
      </div>
    );
  }

  const history = await prisma.clientScore.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "asc" },
    take: 5000,
  });

  const updatedAt = client.updatedAt.getTime();

  const chartData = history.map((h) => ({
    createdAt: h.createdAt.getTime(),
    maxPoints: h.maxPoints,
  }));

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-cover bg-center" style={{ backgroundImage: "url(/bg.jpg)" }} aria-hidden="true" />
      <div className="absolute inset-0 -z-10 backdrop-blur-xl" aria-hidden="true" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/50 to-black/70" aria-hidden="true" />

      <div className="mx-auto max-w-5xl px-4 py-10 text-white">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-3xl font-extrabold">{client.name}</h1>

              {/* Статус (online/offline + last seen) считаем на клиенте без Date.now в Server page */}
              <Badge className="bg-white/10 text-white/80">ID: {client.id}</Badge>
            </div>

            <div className="mt-1 text-sm text-white/70">
              maxPoints: <span className="font-semibold text-white/90">{client.maxPoints.toLocaleString()}</span>
            </div>

            {/* ✅ Вот тут теперь всё “живое” и чистое */}
            <PlayerStatusClient updatedAt={updatedAt} />
          </div>

          <Link href="/">
            <Button className="bg-white text-black hover:bg-white/90">← Назад</Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle>Рост очков</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length < 2 ? (
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">
                  Недостаточно данных для графика. Отправь несколько обновлений maxPoints.
                </div>
              ) : (
                <PlayerChart data={chartData} />
              )}
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
            <CardHeader className="pb-2">
              <CardTitle>Коротко</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm text-white/70">Сколько записей истории</div>
                <div className="text-2xl font-extrabold">{history.length}</div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-sm text-white/70">Последнее server-updatedAt</div>
                <div className="text-sm font-semibold text-white/90">{fmtTime(updatedAt)}</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-4 rounded-2xl border-white/10 bg-white/10 text-white shadow-2xl backdrop-blur-xl">
          <CardHeader className="pb-2">
            <CardTitle>История обновлений</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-white/80">История пустая.</div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 bg-white/5">
                      <TableHead className="w-[80px] text-white/80">#</TableHead>
                      <TableHead className="text-right text-white/80">maxPoints</TableHead>
                      <TableHead className="text-right text-white/80">createdAt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history
                      .slice()
                      .reverse()
                      .slice(0, 200)
                      .map((h, idx) => (
                        <TableRow key={h.id} className="border-white/10">
                          <TableCell className="text-white/80">{idx + 1}</TableCell>
                          <TableCell className="text-right text-lg font-extrabold">{h.maxPoints.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm font-semibold text-white/90">
                            {fmtTime(h.createdAt.getTime())}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="mt-2 text-xs text-white/50">Показаны последние 200 записей (из {history.length}).</div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
