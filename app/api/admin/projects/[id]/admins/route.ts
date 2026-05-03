import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/passwords";

interface AdminRow {
  email: string;
  name: string;
  jobTitle?: string;
  department?: string;
}

function parseCsv(csv: string): AdminRow[] {
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  // Header detection — same convention as participants importer.
  const firstHasEmail = lines[0].includes("@");
  const headers = firstHasEmail
    ? ["email", "name", "department", "jobtitle"]
    : lines[0].split(",").map((h) => h.trim().toLowerCase());
  const dataLines = firstHasEmail ? lines : lines.slice(1);

  const idx = (key: string) => headers.indexOf(key);
  const out: AdminRow[] = [];
  for (const line of dataLines) {
    const cells = line.split(",").map((c) => c.trim());
    if (cells.every((c) => !c)) continue;
    const row: AdminRow = {
      email: idx("email") >= 0 ? cells[idx("email")] : "",
      name: idx("name") >= 0 ? cells[idx("name")] : "",
      department: idx("department") >= 0 ? cells[idx("department")] : undefined,
      jobTitle:
        (idx("jobtitle") >= 0 && cells[idx("jobtitle")]) ||
        (idx("job title") >= 0 && cells[idx("job title")]) ||
        undefined,
    };
    if (row.email && row.name) out.push(row);
  }
  return out;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let session;
  try {
    session = await requireSession("sia_admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();

  // CSV bulk mode (mirrors the participants importer).
  if (body.mode === "csv") {
    if (!body.csv || !body.defaultPassword) {
      return NextResponse.json(
        { error: "CSV and default password required" },
        { status: 400 },
      );
    }
    const rows = parseCsv(String(body.csv));
    const hash = await hashPassword(String(body.defaultPassword));
    let added = 0;
    let skipped = 0;
    for (const row of rows) {
      const e = row.email.toLowerCase();
      const exists = await prisma.projectAdmin.findUnique({ where: { email: e } });
      if (exists) {
        skipped++;
        continue;
      }
      await prisma.projectAdmin.create({
        data: {
          email: e,
          name: row.name,
          jobTitle: row.jobTitle || null,
          department: row.department || null,
          passwordHash: hash,
          projectId: id,
        },
      });
      added++;
    }
    await prisma.activityLog.create({
      data: {
        projectId: id,
        userId: session.sub,
        userType: "sia_admin",
        userName: session.name,
        action: "sia_admin.project_admins_added",
        payload: JSON.stringify({ added, skipped, mode: "csv" }),
      },
    });
    return NextResponse.json({ added, skipped });
  }

  // Single admin (default — used by both "Invite" and the manual add form).
  if (!body.email || !body.name || !body.password) {
    return NextResponse.json({ error: "Email, name, password required" }, { status: 400 });
  }
  const e = String(body.email).toLowerCase();
  const exists = await prisma.projectAdmin.findUnique({ where: { email: e } });
  if (exists) {
    return NextResponse.json({ error: "Email already used" }, { status: 409 });
  }
  const admin = await prisma.projectAdmin.create({
    data: {
      email: e,
      name: body.name,
      jobTitle: body.jobTitle || null,
      department: body.department || null,
      passwordHash: await hashPassword(body.password),
      projectId: id,
    },
  });
  // Mock email send only when explicitly requested ("invite" mode).
  if (body.mode === "invite") {
    console.log(
      `[email-mock] Project Admin invitation → ${admin.email}: temporary password "${body.password}"`,
    );
  }
  await prisma.activityLog.create({
    data: {
      projectId: id,
      userId: session.sub,
      userType: "sia_admin",
      userName: session.name,
      action:
        body.mode === "invite"
          ? "sia_admin.project_admin_invited"
          : "sia_admin.project_admin_added",
      payload: JSON.stringify({ email: admin.email, name: admin.name }),
    },
  });
  return NextResponse.json({ id: admin.id, added: 1 });
}
