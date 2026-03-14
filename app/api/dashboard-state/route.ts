import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import {
  createInitialDashboardState,
  parseDashboardState,
} from "@/app/dashboard-state";

export const dynamic = "force-dynamic";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "dashboard-state.json");

async function ensureDashboardStateFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    const initialState = createInitialDashboardState();
    await fs.writeFile(dataFile, JSON.stringify(initialState, null, 2), "utf8");
  }
}

export async function GET() {
  await ensureDashboardStateFile();
  const raw = await fs.readFile(dataFile, "utf8");
  const state = parseDashboardState(raw);

  return NextResponse.json(state);
}

export async function PUT(request: Request) {
  await ensureDashboardStateFile();

  const payload = await request.json();
  const state = parseDashboardState(JSON.stringify(payload));

  await fs.writeFile(dataFile, JSON.stringify(state, null, 2), "utf8");

  return NextResponse.json({ ok: true, state });
}
