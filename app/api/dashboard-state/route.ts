import { NextResponse } from "next/server";
import { readDashboardState, writeDashboardState } from "./store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await readDashboardState());
}

export async function PUT(request: Request) {
  const payload = await request.json();
  const result = await writeDashboardState(payload);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        state: result.state,
      },
      { status: result.status },
    );
  }

  return NextResponse.json({ ok: true, state: result.state });
}
