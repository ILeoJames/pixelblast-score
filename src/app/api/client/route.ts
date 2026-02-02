import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Incoming = {
  client?: {
    name?: unknown;
    id?: unknown;
    maxPoints?: unknown;
  };
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Incoming | null;

  const raw = body?.client;
  const id = Number(raw?.id);
  const name = String(raw?.name ?? "").trim();
  const maxPoints = Number(raw?.maxPoints);

  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
  }
  if (!name) {
    return NextResponse.json({ ok: false, error: "BAD_NAME" }, { status: 400 });
  }
  if (!Number.isFinite(maxPoints) || maxPoints < 0) {
    return NextResponse.json({ ok: false, error: "BAD_MAX_POINTS" }, { status: 400 });
  }

  await prisma.client.upsert({
    where: { id },
    create: { id, name, maxPoints },
    update: { name, maxPoints },
  });

  return NextResponse.json({ ok: true });
}

export async function GET() {
  const clients = await prisma.client.findMany({
    orderBy: [{ maxPoints: "desc" }, { id: "asc" }],
  });

  return NextResponse.json({
    ok: true,
    data: {
      items: clients.map((c) => ({
        id: c.id,
        name: c.name,
        maxPoints: c.maxPoints,
        updatedAt: c.updatedAt.getTime(),
      })),
    },
  });
}
