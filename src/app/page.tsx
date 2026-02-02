"use client";

import { useEffect, useMemo, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type ClientRow = {
  id: number;
  name: string;
  maxPoints: number;
  updatedAt: number; // ms
};

type ListPayload = {
  items: ClientRow[];
  sort: string;
  order: "asc" | "desc";
  limit: number;
};

export default function HomePage() {
  const [items, setItems] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false); // чтобы авто-пул не мигал
  const [error, setError] = useState<string | null>(null);

  const [order, setOrder] = useState<"asc" | "desc">("desc"); // сортируем по maxPoints
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);

  async function fetchList(opts?: { silent?: boolean }) {
    const silent = opts?.silent ?? false;

    if (silent) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const res = await fetch(`/api/clients?sort=maxPoints&order=${order}&limit=200`, { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data: ListPayload; error?: string };

      if (!res.ok || json.ok === false) throw new Error(json.error || `HTTP ${res.status}`);

      setItems(json.data.items);
      setLastUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "UNKNOWN_ERROR");
    } finally {
      if (silent) setRefreshing(false);
      else setLoading(false);
    }
  }

  // начальная загрузка + автообновление
  useEffect(() => {
    let cancelled = false;

    async function run(initial = false) {
      if (cancelled) return;
      await fetchList({ silent: !initial });
    }

    run(true);

    const t = setInterval(() => run(false), 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order]);

  const headerBadge = useMemo(() => {
    if (loading) return <Badge variant="secondary" className="h-8">Загрузка…</Badge>;
    if (refreshing) return <Badge variant="secondary" className="h-8">Обновление…</Badge>;
    return <Badge variant="outline" className="h-8">Онлайн</Badge>;
  }, [loading, refreshing]);

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Клиенты</h1>
            <p className="text-sm text-muted-foreground">
              Сортировка: <span className="font-medium text-foreground">maxPoints ({order})</span>.
              {lastUpdatedAt ? (
                <span className="ml-2">
                  Последнее обновление:{" "}
                  <span className="font-medium text-foreground">
                    {new Date(lastUpdatedAt).toLocaleTimeString()}
                  </span>
                </span>
              ) : null}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {headerBadge}
            <Button
              variant="secondary"
              className="h-8"
              onClick={() => setOrder((p) => (p === "desc" ? "asc" : "desc"))}
              disabled={loading}
              title="Переключить сортировку"
            >
              maxPoints: {order === "desc" ? "↓" : "↑"}
            </Button>
            <Button className="h-8" onClick={() => fetchList({ silent: false })} disabled={loading}>
              Обновить
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Список клиентов</CardTitle>
            <CardDescription>Источник: /api/clients</CardDescription>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-[50%]" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                <div className="text-sm font-medium text-destructive">Ошибка</div>
                <div className="mt-1 text-sm text-muted-foreground">{error}</div>
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border bg-card p-4">
                <div className="text-sm font-medium">Пока нет клиентов</div>
                <div className="mt-1 text-sm text-muted-foreground">
                  Добавь через <code className="rounded bg-muted px-1.5 py-0.5">POST /api/clients</code>.
                </div>
              </div>
            ) : (
              <div className="overflow-hidden rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="w-[15%]">ID</TableHead>
                      <TableHead className="w-[45%]">Name</TableHead>
                      <TableHead className="w-[20%]">Max Points</TableHead>
                      <TableHead className="w-[20%]">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.id}</TableCell>
                        <TableCell>{c.name}</TableCell>
                        <TableCell>{c.maxPoints.toLocaleString()}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(c.updatedAt).toLocaleTimeString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
