import { NextResponse } from "next/server";
import { openApiDocument } from "../api/openapi/spec";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(openApiDocument);
}
