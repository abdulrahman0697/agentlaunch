import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { slugify } from "@/lib/utils";

export async function POST(req: NextRequest) {
  let session;
  try {
    session = await requireSession("sia_admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || !body.name || !body.clientOrgName || !body.startDate || !body.endDate) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  let slug = slugify(body.shortName || body.clientOrgName || body.name);
  // Avoid collisions
  let suffix = 1;
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${slugify(body.shortName || body.clientOrgName || body.name)}-${++suffix}`;
  }

  const project = await prisma.project.create({
    data: {
      name: body.name,
      clientOrgName: body.clientOrgName,
      shortName: body.shortName || null,
      slug,
      description: body.description || null,
      welcomeMessage: body.welcomeMessage || null,
      logoUrl: body.logoUrl || null,
      primaryColor: body.primaryColor || "#0B1F3A",
      secondaryColor: body.secondaryColor || "#C5A572",
      backgroundAccent: body.backgroundAccent || "#F5F0EA",
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      cohortSize: body.cohortSize || 0,
      programWeek: 1,
      status: "draft",
      createdBySiaAdminId: session.sub,
    },
  });

  await prisma.activityLog.create({
    data: {
      projectId: project.id,
      userId: session.sub,
      userType: "sia_admin",
      userName: session.name,
      action: "sia_admin.project_created",
      payload: JSON.stringify({ name: project.name }),
    },
  });

  return NextResponse.json({ id: project.id, slug: project.slug });
}
