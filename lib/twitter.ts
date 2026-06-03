const BEARER_TOKEN = process.env.X_BEARER_TOKEN!;
const USERNAME = process.env.X_USERNAME!;

export interface XVideo {
  tweetId: string;
  text: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  views: number;
  likes: number;
  retweets: number;
  postedAt: Date;
}

async function getUserId(): Promise<string> {
  const res = await fetch(
    `https://api.twitter.com/2/users/by/username/${USERNAME}`,
    { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } }
  );
  if (!res.ok) throw new Error(`X API error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.data.id;
}

export async function fetchLatestVideos(sinceId?: string): Promise<XVideo[]> {
  const userId = await getUserId();

  const params = new URLSearchParams({
    max_results: "100",
    "tweet.fields": "created_at,public_metrics,attachments",
    "media.fields": "variants,preview_image_url,url",
    expansions: "attachments.media_keys",
  });

  if (sinceId) params.set("since_id", sinceId);

  const res = await fetch(
    `https://api.twitter.com/2/users/${userId}/tweets?${params}`,
    { headers: { Authorization: `Bearer ${BEARER_TOKEN}` } }
  );

  if (!res.ok) throw new Error(`X API error: ${res.status} ${await res.text()}`);

  const data = await res.json();
  if (!data.data) return [];

  const mediaMap = new Map<string, { videoUrl: string; thumbnailUrl: string | null }>();
  for (const media of data.includes?.media ?? []) {
    if (media.type !== "video" && media.type !== "animated_gif") continue;

    // pick highest bitrate mp4
    const variants: { content_type: string; bit_rate?: number; url: string }[] =
      media.variants ?? [];
    const mp4 = variants
      .filter((v) => v.content_type === "video/mp4")
      .sort((a, b) => (b.bit_rate ?? 0) - (a.bit_rate ?? 0))[0];

    if (mp4) {
      mediaMap.set(media.media_key, {
        videoUrl: mp4.url,
        thumbnailUrl: media.preview_image_url ?? null,
      });
    }
  }

  const videos: XVideo[] = [];
  for (const tweet of data.data) {
    const mediaKeys: string[] = tweet.attachments?.media_keys ?? [];
    const videoMedia = mediaKeys.map((k: string) => mediaMap.get(k)).find(Boolean);
    if (!videoMedia) continue;

    videos.push({
      tweetId: tweet.id,
      text: tweet.text ?? "",
      videoUrl: videoMedia.videoUrl,
      thumbnailUrl: videoMedia.thumbnailUrl,
      views: tweet.public_metrics?.impression_count ?? 0,
      likes: tweet.public_metrics?.like_count ?? 0,
      retweets: tweet.public_metrics?.retweet_count ?? 0,
      postedAt: new Date(tweet.created_at),
    });
  }

  return videos;
}
