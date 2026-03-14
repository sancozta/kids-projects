import { NextResponse } from "next/server";
import { patchDashboardItem } from "../store";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  const payload = (await request.json()) as {
    projectId?: string;
    itemId?: string;
    text?: string;
    done?: boolean;
  };
  const result = await patchDashboardItem(payload);

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
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
