import { NextResponse } from "next/server";
import { readDashboardStoreHealth } from "../dashboard-state/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const health = await readDashboardStoreHealth();

  return NextResponse.json(health, {
    status: health.ok ? 200 : 503,
  });
}
