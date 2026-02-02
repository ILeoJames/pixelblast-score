import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, context: Ctx) {
  // ✅ В Next 16 params типизируется как Promise
  const { id: idParam } = await context.params;

  const id = Number(idParam);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) {
    return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });
  }

  const history = await prisma.clientScore.findMany({
    where: { clientId: id },
    orderBy: { createdAt: "asc" },
    take: 5000,
  });

  return NextResponse.json({
    ok: true,
    data: {
      client: {
        id: client.id,
        name: client.name,
        maxPoints: client.maxPoints,
        updatedAt: client.updatedAt.getTime(),
      },
      history: history.map((h) => ({
        id: h.id,
        maxPoints: h.maxPoints,
        createdAt: h.createdAt.getTime(),
      })),
    },
  });
}
