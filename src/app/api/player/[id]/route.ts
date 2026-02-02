import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: Request, ctx: { params: { id: string } }) {
  const id = Number(ctx.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ ok: false, error: "BAD_ID" }, { status: 400 });
  }

  const client = await prisma.client.findUnique({ where: { id } });
  if (!client) return NextResponse.json({ ok: false, error: "NOT_FOUND" }, { status: 404 });

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
