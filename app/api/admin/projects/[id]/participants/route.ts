import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/passwords";

interface ParticipantRow {
  email: string;
  name: string;
  department?: string;
  jobTitle?: string;
}

function parseCsv(csv: string): ParticipantRow[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (key: string) => headers.indexOf(key);
  const out: ParticipantRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = lines[i].split(",").map((c) => c.trim());
    if (cells.every((c) => !c)) continue;
    const row: ParticipantRow = {
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
  { params }: { params: { id: string } },
) {
  let session;
  try {
    session = await requireSession("sia_admin");
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();

  let rows: ParticipantRow[] = [];
  let pwd = "";
  if (body.mode === "csv") {
    if (!body.csv || !body.defaultPassword) {
      return NextResponse.json({ error: "CSV and default password required" }, { status: 400 });
    }
    rows = parseCsv(String(body.csv));
    pwd = String(body.defaultPassword);
  } else {
    if (!body.email || !body.name || !body.password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    rows = [
      {
        email: body.email,
        name: body.name,
        department: body.department,
        jobTitle: body.jobTitle,
      },
    ];
    pwd = String(body.password);
  }

  const hash = await hashPassword(pwd);
  let added = 0;
  let skipped = 0;
  for (const row of rows) {
    const e = row.email.toLowerCase();
    const exists = await prisma.participant.findUnique({ where: { email: e } });
    if (exists) {
      skipped++;
      continue;
    }
    await prisma.participant.create({
      data: {
        email: e,
        name: row.name,
        department: row.department || null,
        jobTitle: row.jobTitle || null,
        passwordHash: hash,
        projectId: params.id,
      },
    });
    added++;
  }

  await prisma.activityLog.create({
    data: {
      projectId: params.id,
      userId: session.sub,
      userType: "sia_admin",
      userName: session.name,
      action: "sia_admin.participants_added",
      payload: JSON.stringify({ added, skipped, mode: body.mode || "single" }),
    },
  });

  return NextResponse.json({ added, skipped });
}
