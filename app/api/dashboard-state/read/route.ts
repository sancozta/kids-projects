import { NextResponse } from "next/server";
import { readDashboardState } from "../store";

export const dynamic = "force-dynamic";

export async function GET() {
  const state = await readDashboardState();

  return NextResponse.json({
    ok: true,
    state,
  });
}
