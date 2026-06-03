import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { videoUrl, thumbnailUrl, text, postedAt, tweetUrl } = await req.json();

  if (!videoUrl) {
    return NextResponse.json({ error: "video URL is required" }, { status: 400 });
  }

  const existing = await prisma.video.findFirst({ where: { videoUrl } });
  if (existing) {
    return NextResponse.json({ error: "video already in portfolio" }, { status: 409 });
  }

  const tweetId = Buffer.from(videoUrl).toString("base64").slice(0, 20) + Date.now();

  const video = await prisma.video.create({
    data: {
      tweetId,
      text: text ?? "",
      videoUrl,
      thumbnailUrl: thumbnailUrl ?? null,
      tweetUrl: tweetUrl ?? null,
      views: 0,
      likes: 0,
      retweets: 0,
      postedAt: postedAt ? new Date(postedAt) : new Date(),
    },
  });

  return NextResponse.json({ ok: true, video });
}