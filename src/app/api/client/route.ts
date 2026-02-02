import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type ClientPayload = {
  id: string;
  name: string;
  maxPoints: string;
};

export async function GET() {
  // Тут можно вернуть "последнего обновленного" клиента,
  // либо конкретного по query, но ты пока в UI показываешь одного — берем последнего.
  const client = await prisma.client.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  if (!client) {
    return NextResponse.json({ ok: true, data: null });
  }

  return NextResponse.json({
    ok: true,
    data: {
      client: {
        id: client.id,
        name: client.name,
        maxPoints: client.maxPoints,
      },
    },
  });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as ClientPayload | null;

  const id = Number(body?.id);
  const name = String(body?.name ?? "").trim();
  const maxPoints = Number(body?.maxPoints);

  // if (id <= 0) {
  //   return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
  // }
  // if (name.length <= 0) {
  //   return NextResponse.json({ ok: false, error: "BAD_NAME" }, { status: 400 });
  // }
  // if (maxPoints < 0) {
  //   return NextResponse.json({ ok: false, error: "BAD_MAX_POINTS" }, { status: 400 });
  // }

  // ВОТ ТУТ МАГИЯ: если id есть — update, если нет — create
  const client = await prisma.client.upsert({
    where: { id },
    create: { id, name, maxPoints },
    update: { name, maxPoints },
  });

  return NextResponse.json({
    ok: true,
    data: {
      client: {
        id: client.id,
        name: client.name,
        maxPoints: client.maxPoints,
      },
    },
  });
}
