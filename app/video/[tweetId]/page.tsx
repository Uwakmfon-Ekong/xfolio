import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function VideoPage({ params }: { params: { tweetId: string } }) {
  const video = await prisma.video.findUnique({
    where: { tweetId: params.tweetId },
  });

  if (!video || video.hidden) notFound();

  return (
    <main style={{ minHeight: "100vh", background: "#0a0a0a", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Syne', sans-serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        video { width: 100%; border-radius: 12px; background: #111; }
        a { color: inherit; text-decoration: none; }
      `}</style>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "24px" }}>
        <Link href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 24 }}>
          back to portfolio
        </Link>

        <video controls playsInline src={video.videoUrl} poster={video.thumbnailUrl ?? undefined} />

        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,0.8)" }}>{video.text}</p>

          <div style={{ display: "flex", gap: 24, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div>
              <p className="mono" style={{ fontSize: 20, fontWeight: 500 }}>{video.views.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>views</p>
            </div>
            <div>
              <p className="mono" style={{ fontSize: 20, fontWeight: 500 }}>{video.likes.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>likes</p>
            </div>
            <div>
              <p className="mono" style={{ fontSize: 20, fontWeight: 500 }}>{video.retweets.toLocaleString()}</p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>retweets</p>
            </div>
            <div style={{ marginLeft: "auto" }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>posted</p>
              <p className="mono" style={{ fontSize: 13 }}>
                {new Date(video.postedAt).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {video.tags.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 16 }}>
              {video.tags.map((t) => (
                <Link key={t} href={"/?tag=" + t} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 20, border: "1px solid rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.6)" }}>
                  {t}
                </Link>
              ))}
            </div>
          )}

          {video.tweetUrl && (
            <a href={video.tweetUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 24, fontSize: 13, color: "rgba(255,255,255,0.4)", borderBottom: "1px solid rgba(255,255,255,0.15)", paddingBottom: 2 }}>
              view original on X
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
