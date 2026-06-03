import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: [{ pinned: "desc" }, { postedAt: "desc" }],
  });
  return NextResponse.json(videos);
}
