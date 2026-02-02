"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Payload = {
  client: {
    name: string;
    id: number;
    maxPoints: number;
  };
};

export default function HomePage() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/client", { cache: "no-store" });
      const json = (await res.json()) as { ok: boolean; data: Payload | null; error?: string };

      if (!res.ok || json.ok === false) throw new Error(json.error || `HTTP ${res.status}`);

      setData(json.data);
      setLastUpdatedAt(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "UNKNOWN_ERROR");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setError(null);
        setLoading(true);

        const res = await fetch("/api/client", { cache: "no-store" });
        const json = (await res.json()) as { ok: boolean; data: Payload | null; error?: string };

        if (!res.ok || json.ok === false) throw new Error(json.error || `HTTP ${res.status}`);

        if (!cancelled) {
          setData(json.data);
          setLastUpdatedAt(Date.now());
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "UNKNOWN_ERROR");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    run();

    const t = setInterval(run, 3000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  const client = data?.client ?? null;

  return (
    <main className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Главная</h1>
            <p className="text-sm text-muted-foreground">
              Данные подтягиваются автоматически каждые 3 секунды.
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
            <Badge variant={loading ? "secondary" : "outline"} className="h-8">
              {loading ? "Обновление…" : "Онлайн"}
            </Badge>
            <Button onClick={load} disabled={loading} className="h-8">
              Обновить
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Профиль клиента</CardTitle>
              <CardDescription>Источник: /api/client</CardDescription>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-[60%]" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : error ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <div className="text-sm font-medium text-destructive">Ошибка загрузки</div>
                  <div className="mt-1 text-sm text-muted-foreground">{error}</div>
                </div>
              ) : !client ? (
                <div className="rounded-lg border bg-card p-4">
                  <div className="text-sm font-medium">Данных пока нет</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    Отправь JSON POST-запросом на{" "}
                    <code className="rounded bg-muted px-1.5 py-0.5">/api/client</code>:
                    <div className="mt-2 rounded bg-muted p-2 font-mono text-xs">
                      {"{ id: 1, name: \"Alex\", maxPoints: 500 }"}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="w-[50%]">Name</TableHead>
                        <TableHead className="w-[25%]">ID</TableHead>
                        <TableHead className="w-[25%]">Max Points</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{client.id}</TableCell>
                        <TableCell>{client.maxPoints.toLocaleString()}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Статус</CardTitle>
              <CardDescription>Быстрые показатели</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">Автообновление</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-medium">каждые 3 секунды</span>
                  <Badge variant="outline">ON</Badge>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">Данные</div>
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{client ? "Получены" : "Нет"}</span>
                  <Badge variant={client ? "secondary" : "outline"}>{client ? "OK" : "EMPTY"}</Badge>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-3">
                <div className="text-xs text-muted-foreground">Последнее обновление</div>
                <div className="mt-1 text-sm font-medium">
                  {lastUpdatedAt ? new Date(lastUpdatedAt).toLocaleTimeString() : "—"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
