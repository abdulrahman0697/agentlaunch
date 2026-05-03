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
  const lines = csv.trim().split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  // Detect header presence: a header line will NOT contain an "@" (no email
  // in column names). If the first line already looks like data, we assume
  // the canonical column order: email, name, department, jobTitle.
  const firstHasEmail = lines[0].includes("@");
  const headers = firstHasEmail
    ? ["email", "name", "department", "jobtitle"]
    : lines[0].split(",").map((h) => h.trim().toLowerCase());
  const dataLines = firstHasEmail ? lines : lines.slice(1);

  const idx = (key: string) => headers.indexOf(key);
  const out: ParticipantRow[] = [];
  for (const line of dataLines) {
    const cells = line.split(",").map((c) => c.trim());
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
      action: "sia_admin.participants_added",
      payload: JSON.stringify({ added, skipped, mode: body.mode || "single" }),
    },
  });

  return NextResponse.json({ added, skipped });
}
