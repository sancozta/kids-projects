import { NextResponse } from "next/server";
import { writeDashboardState } from "../store";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const payload = await request.json();
  const state = await writeDashboardState(payload);

  return NextResponse.json({
    ok: true,
    state,
    updatedAt: state.updatedAt,
  });
}
