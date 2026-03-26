import { NextResponse } from "next/server";
import { writeDashboardState } from "../store";

export const dynamic = "force-dynamic";

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

  return NextResponse.json({
    ok: true,
    state: result.state,
    updatedAt: result.state.updatedAt,
  });
}
