import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ClientInput = {
  id: number;
  name: string;
  maxPoints: number;
};

function parseIntSafe(v: string | null, fallback: number) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function GET(req: Request) {
  const url = new URL(req.url);

  const sort = (url.searchParams.get("sort") ?? "maxPoints").trim();
  const order = (url.searchParams.get("order") ?? "desc").trim().toLowerCase();
  const limit = Math.min(Math.max(parseIntSafe(url.searchParams.get("limit"), 200), 1), 500);

  // allowlist, чтобы никто не смог подсунуть левое поле
  const sortField: "maxPoints" | "updatedAt" | "createdAt" | "id" | "name" =
    sort === "updatedAt" || sort === "createdAt" || sort === "id" || sort === "name" ? sort : "maxPoints";

  const sortOrder: "asc" | "desc" = order === "asc" ? "asc" : "desc";

  const rows = await prisma.client.findMany({
    orderBy: [{ [sortField]: sortOrder }, { id: "asc" }],
    take: limit,
  });

  return NextResponse.json({
    ok: true,
    data: {
      items: rows.map((c) => ({
        id: c.id,
        name: c.name,
        maxPoints: c.maxPoints,
        updatedAt: c.updatedAt.getTime(),
      })),
      sort: sortField,
      order: sortOrder,
      limit,
    },
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ClientInput | null;

  const id = Number(body?.id);
  const name = String(body?.name ?? "").trim();
  const maxPoints = Number(body?.maxPoints);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ ok: false, error: "BAD_NAME" }, { status: 400 });
  }
  if (!Number.isFinite(maxPoints) || maxPoints < 0) {
    return NextResponse.json({ ok: false, error: "BAD_MAX_POINTS" }, { status: 400 });
  }

  const saved = await prisma.client.upsert({
    where: { id },
    create: { id, name, maxPoints },
    update: { name, maxPoints },
  });

  return NextResponse.json({
    ok: true,
    data: {
      client: {
        id: saved.id,
        name: saved.name,
        maxPoints: saved.maxPoints,
        updatedAt: saved.updatedAt.getTime(),
      },
    },
  });
}
