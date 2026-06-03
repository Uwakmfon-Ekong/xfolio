import { prisma } from "@/lib/db";
import Link from "next/link";

export const revalidate = 3600;

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: { tag?: string };
}) {
  const tag = searchParams.tag;

  const videos = await prisma.video.findMany({
    where: {
      hidden: false,
      ...(tag ? { tags: { has: tag } } : {}),
    },
    orderBy: [{ pinned: "desc" }, { postedAt: "desc" }],
  });

  const allTags = await prisma.video
    .findMany({ where: { hidden: false }, select: { tags: true } })
    .then((rows) => [...new Set(rows.flatMap((r) => r.tags))]);

  const totalViews = videos.reduce((sum, v) => sum + v.views, 0);
  const username = process.env.X_USERNAME ?? "creator";
  const displayName = process.env.DISPLAY_NAME ?? `@${username}`;
  const bio = process.env.BIO ?? "video creator on X";

  // customisable accent color — set ACCENT_COLOR in your .env to change it
  const accent = process.env.ACCENT_COLOR ?? "#ff6b9d";
  const accentDim = process.env.ACCENT_COLOR_DIM ?? "#ff6b9d33";

  return (
    <main style={{ minHeight: "100vh", background: "#080808", color: "#fff" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Syne', sans-serif; background: #080808; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        a { color: inherit; text-decoration: none; }

        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 12px;
        }

        .video-card {
          position: relative;
          cursor: pointer;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.06);
          background: #111;
          transition: transform 0.25s cubic-bezier(.22,.68,0,1.2), border-color 0.2s, box-shadow 0.2s;
        }
        .video-card:hover {
          transform: translateY(-4px) scale(1.01);
          border-color: ${accent}55;
          box-shadow: 0 16px 40px rgba(0,0,0,0.4), 0 0 0 1px ${accent}22;
        }
        .video-card:hover .play-btn { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        .video-card:hover .card-footer { background: linear-gradient(transparent, rgba(0,0,0,0.95)); }

        .play-btn {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0.8);
          opacity: 0;
          transition: opacity 0.2s, transform 0.2s cubic-bezier(.22,.68,0,1.2);
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: ${accent};
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px ${accent}88;
        }

        .card-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 40px 12px 14px;
          background: linear-gradient(transparent, rgba(0,0,0,0.85));
          transition: background 0.2s;
        }

        .tag-pill {
          display: inline-block;
          font-size: 12px;
          padding: 5px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: all 0.15s;
          font-family: 'Syne', sans-serif;
        }
        .tag-pill:hover { border-color: ${accent}88; color: ${accent}; }
        .tag-pill.active { border-color: ${accent}; color: ${accent}; background: ${accentDim}; }

        .stat-box {
          background: #111;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 12px;
          padding: 14px 18px;
        }

        .pinned-badge {
          position: absolute;
          top: 10px;
          left: 10px;
          background: ${accent};
          border-radius: 6px;
          padding: 2px 8px;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.05em;
          color: #fff;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease both; }
        ${videos.map((_, i) => `.fade-up:nth-child(${i + 1}) { animation-delay: ${i * 0.04}s; }`).join("\n")}
      `}</style>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>

        {/* header */}
        <header style={{ padding: "52px 0 36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 14, background: accentDim, border: `1px solid ${accent}44`, borderRadius: 20, padding: "4px 12px" }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: accent, display: "inline-block" }} />
                <span className="mono" style={{ fontSize: 11, color: accent, letterSpacing: "0.08em" }}>VIDEO PORTFOLIO</span>
              </div>
              <h1 style={{ fontSize: "clamp(30px, 5vw, 52px)", fontWeight: 700, lineHeight: 1.05, letterSpacing: "-0.02em" }}>{displayName}</h1>
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginTop: 10, maxWidth: 420 }}>{bio}</p>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <div className="stat-box">
                <p className="mono" style={{ fontSize: 26, fontWeight: 600, color: "#fff" }}>{videos.length}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3, letterSpacing: "0.05em" }}>VIDEOS</p>
              </div>
              <div className="stat-box">
                <p className="mono" style={{ fontSize: 26, fontWeight: 600, color: "#fff" }}>{formatCount(totalViews)}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 3, letterSpacing: "0.05em" }}>VIEWS</p>
              </div>
            </div>
          </div>

          {/* divider */}
          <div style={{ marginTop: 32, height: 1, background: `linear-gradient(to right, ${accent}44, rgba(255,255,255,0.04), transparent)` }} />
        </header>

        {/* filter bar */}
        {allTags.length > 0 && (
          <div style={{ paddingBottom: 24, display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/" className={`tag-pill ${!tag ? "active" : ""}`}>all</Link>
            {allTags.map((t) => (
              <Link key={t} href={`?tag=${t}`} className={`tag-pill ${tag === t ? "active" : ""}`}>{t}</Link>
            ))}
          </div>
        )}

        {/* grid */}
        {videos.length === 0 ? (
          <div style={{ padding: "80px 0", textAlign: "center", color: "rgba(255,255,255,0.2)" }}>
            <p style={{ fontSize: 15 }}>no videos yet — add one from the dashboard</p>
          </div>
        ) : (
          <div className="grid">
            {videos.map((video) => (
              <Link key={video.id} href={`/video/${video.tweetId}`} className="fade-up">
                <div className="video-card" style={{ aspectRatio: "9/16" }}>
                  {video.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={video.thumbnailUrl}
                      alt={video.text ?? ""}
                      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                    />
                  ) : (
                    <div style={{ width: "100%", height: "100%", background: "#1a1a1a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 28, opacity: 0.15 }}>▶</span>
                    </div>
                  )}

                  <div className="play-btn">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                      <path d="M3 2.5l10 5.5-10 5.5V2.5z"/>
                    </svg>
                  </div>

                  {video.pinned && <div className="pinned-badge">pinned</div>}

                  <div className="card-footer">
                    <p style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 6, fontWeight: 500 }}>
                      {video.text || "untitled"}
                    </p>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {video.tags.slice(0, 1).map((t) => (
                        <span key={t} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 10, background: accentDim, color: accent, border: `1px solid ${accent}44`, fontWeight: 500 }}>
                          {t}
                        </span>
                      ))}
                      <span className="mono" style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{formatCount(video.views)} views</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        <footer style={{ padding: "48px 0 32px", marginTop: 32, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.15)" }}>
            built with <a href="https://github.com/whakee/xfolio" style={{ color: "rgba(255,255,255,0.3)" }}>xfolio</a>
          </p>
          <a href={`https://x.com/${username}`} style={{ fontSize: 12, color: "rgba(255,255,255,0.25)" }}>x.com/{username} ↗</a>
        </footer>

      </div>
    </main>
  );
}