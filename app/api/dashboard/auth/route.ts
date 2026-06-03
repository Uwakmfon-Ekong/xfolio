import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { password } = await req.json();
  if (password === process.env.DASHBOARD_PASSWORD) {
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}
