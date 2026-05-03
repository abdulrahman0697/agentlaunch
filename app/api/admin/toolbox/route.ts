import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try { await requireSession("sia_admin"); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const item = await prisma.toolboxItem.create({
    data: {
      pillar: String(body.pillar),
      name: String(body.name),
      description: String(body.description || ""),
      url: body.url ? String(body.url) : null,
    },
  });
  return NextResponse.json({ id: item.id });
}

export async function PUT(req: NextRequest) {
  try { await requireSession("sia_admin"); } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "id required" }, { status: 400 });
  await prisma.toolboxItem.update({
    where: { id: body.id },
    data: {
      pillar: body.pillar,
      name: body.name,
      description: body.description,
      url: body.url || null,
    },
  });
  return NextResponse.json({ ok: true });
}
