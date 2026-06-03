import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { fetchLatestVideos } from "@/lib/twitter";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  // protect the endpoint with a shared secret
  const secret = req.nextUrl.searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    // find the most recent tweet we already have
    const latest = await prisma.video.findFirst({
      orderBy: { postedAt: "desc" },
      select: { tweetId: true },
    });

    const videos = await fetchLatestVideos(latest?.tweetId);

    if (videos.length === 0) {
      return NextResponse.json({ synced: 0, message: "no new videos" });
    }

    const result = await prisma.$transaction(
      videos.map((v) =>
        prisma.video.upsert({
          where: { tweetId: v.tweetId },
          update: {
            views: v.views,
            likes: v.likes,
            retweets: v.retweets,
          },
          create: {
            tweetId: v.tweetId,
            text: v.text,
            videoUrl: v.videoUrl,
            thumbnailUrl: v.thumbnailUrl,
            views: v.views,
            likes: v.likes,
            retweets: v.retweets,
            postedAt: v.postedAt,
          },
        })
      )
    );

    return NextResponse.json({ synced: result.length });
  } catch (err: unknown) {
    console.error("[sync error]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "unknown error" },
      { status: 500 }
    );
  }
}
