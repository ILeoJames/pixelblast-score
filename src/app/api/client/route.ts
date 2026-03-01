import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Incoming =
  | { name?: unknown; maxPoints?: unknown; id?: unknown }
  | { client?: { name?: unknown; maxPoints?: unknown; id?: unknown } };

function pick(body: Incoming | null) {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  const inner = typeof b.client === "object" && b.client !== null ? (b.client as Record<string, unknown>) : b;
  return inner;
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Incoming | null;
  const p = pick(body);

  const name = String(p?.name ?? "").trim();
  const maxPointsNum = Number(p?.maxPoints);
  const idRaw = p?.id;

  if (!name) return NextResponse.json({ ok: false, error: "BAD_NAME" }, { status: 400 });
  if (!Number.isFinite(maxPointsNum) || maxPointsNum < 0)
    return NextResponse.json({ ok: false, error: "BAD_MAX_POINTS" }, { status: 400 });

  const maxPoints = Math.trunc(maxPointsNum);

  // UPDATE если передали id
  if (idRaw !== undefined && idRaw !== null && String(idRaw).trim() !== "") {
    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });

    const updated = await prisma.client
      .update({
        where: { id },
        data: { name, maxPoints },
      })
      .catch(() => null);

    if (!updated) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

    // ✅ Запись в историю (можно писать всегда; или условно только если изменилось)
    if (updated.maxPoints && updated.maxPoints > 0) {
    await prisma.clientScore.create({
      data: {
        clientId: updated.id,
        maxPoints: updated.maxPoints,
      },
    });
    }

    return NextResponse.json({
      ok: true,
      data: {
        client: {
          id: updated.id,
          name: updated.name,
          maxPoints: updated.maxPoints,
          updatedAt: updated.updatedAt.getTime(),
        },
      },
    });
  }

  // CREATE если id нет
  const created = await prisma.client.create({
    data: { name, maxPoints },
  });

  // ✅ История при создании
  await prisma.clientScore.create({
    data: { clientId: created.id, maxPoints: created.maxPoints },
  });

  return NextResponse.json({
    ok: true,
    data: {
      client: {
        id: created.id,
        name: created.name,
        maxPoints: created.maxPoints,
        updatedAt: created.updatedAt.getTime(),
      },
    },
  });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const order = (url.searchParams.get("order") ?? "desc").toLowerCase() === "asc" ? "asc" : "desc";

  const clients = await prisma.client.findMany({
    orderBy: [{ maxPoints: order }, { id: "asc" }],
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
      order,
    },
  });
}
