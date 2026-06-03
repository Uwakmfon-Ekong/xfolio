import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const patch = await req.json();

  const allowed = ["tags", "pinned", "hidden", "category", "text", "tweetUrl", "postedAt"];
  const data = Object.fromEntries(
    Object.entries(patch).filter(([k]) => allowed.includes(k))
  );

  if (data.postedAt) data.postedAt = new Date(data.postedAt as string);

  const video = await prisma.video.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(video);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  await prisma.video.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}