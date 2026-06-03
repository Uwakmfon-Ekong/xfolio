"use client";
import { useState, useEffect, useRef } from "react";

interface Video {
  id: string;
  tweetId: string;
  text: string | null;
  thumbnailUrl: string | null;
  views: number;
  likes: number;
  tags: string[];
  pinned: boolean;
  hidden: boolean;
  postedAt: string;
  tweetUrl?: string | null;
}

export default function Dashboard() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [videos, setVideos] = useState<Video[]>([]);
  const [tagInput, setTagInput] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ text: "", postedAt: "", tweetUrl: "" });
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editVideo, setEditVideo] = useState<Video | null>(null);
  const [editForm, setEditForm] = useState({ text: "", postedAt: "", tweetUrl: "" });
  const fileRef = useRef<HTMLInputElement>(null);

  async function login() {
    const res = await fetch("/api/dashboard/auth", {
      method: "POST",
      body: JSON.stringify({ password }),
      headers: { "Content-Type": "application/json" },
    });
    if (res.ok) { setAuthed(true); fetchVideos(); }
    else alert("wrong password");
  }

  async function fetchVideos() {
    const res = await fetch("/api/dashboard/videos");
    if (res.ok) setVideos(await res.json());
  }

  async function uploadVideo(file: File) {
    setUploading(true);
    setUploadProgress(0);
    setUploadMsg("getting upload credentials...");

    const sigRes = await fetch("/api/upload");
    if (!sigRes.ok) { setUploadMsg("failed to get upload credentials"); setUploading(false); return; }
    const { timestamp, signature, apiKey, cloudName } = await sigRes.json();

    setUploadMsg("uploading to cloudinary...");

    const fd = new FormData();
    fd.append("file", file);
    fd.append("api_key", apiKey);
    fd.append("timestamp", timestamp);
    fd.append("signature", signature);
    fd.append("folder", "xfolio");
    fd.append("resource_type", "video");

    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
    };

    const uploadResult = await new Promise<{ secure_url: string; public_id: string } | null>((resolve) => {
      xhr.onload = () => {
        if (xhr.status === 200) resolve(JSON.parse(xhr.responseText));
        else resolve(null);
      };
      xhr.onerror = () => resolve(null);
      xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`);
      xhr.send(fd);
    });

    if (!uploadResult) { setUploadMsg("upload failed, try again"); setUploading(false); return; }

    const thumbnailUrl = uploadResult.secure_url
      .replace("/upload/", "/upload/so_0,f_jpg,w_400/")
      .replace(/\.[^.]+$/, ".jpg");

    setUploadMsg("saving to portfolio...");

    const addRes = await fetch("/api/add", {
      method: "POST",
      body: JSON.stringify({
        videoUrl: uploadResult.secure_url,
        thumbnailUrl,
        text: form.text,
        postedAt: form.postedAt,
        tweetUrl: form.tweetUrl,
      }),
      headers: { "Content-Type": "application/json" },
    });

    if (addRes.ok) {
      setUploadMsg("video added!");
      setForm({ text: "", postedAt: "", tweetUrl: "" });
      setUploadProgress(0);
      fetchVideos();
    } else {
      const d = await addRes.json();
      setUploadMsg(d.error ?? "something went wrong");
    }
    setUploading(false);
  }

  async function updateVideo(id: string, patch: Partial<Video>) {
    await fetch(`/api/dashboard/videos/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
      headers: { "Content-Type": "application/json" },
    });
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, ...patch } : v)));
  }

  async function saveEdit() {
    if (!editVideo) return;
    await fetch(`/api/dashboard/videos/${editVideo.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        text: editForm.text,
        postedAt: editForm.postedAt ? new Date(editForm.postedAt).toISOString() : undefined,
        tweetUrl: editForm.tweetUrl,
      }),
      headers: { "Content-Type": "application/json" },
    });
    setVideos((prev) => prev.map((v) =>
      v.id === editVideo.id
        ? { ...v, text: editForm.text, tweetUrl: editForm.tweetUrl }
        : v
    ));
    setEditVideo(null);
  }

  async function deleteVideo(id: string) {
    await fetch(`/api/dashboard/videos/${id}`, { method: "DELETE" });
    setVideos((prev) => prev.filter((x) => x.id !== id));
    setConfirmDelete(null);
  }

  async function setTags(id: string, tagStr: string) {
    const tags = tagStr.split(",").map((t) => t.trim()).filter(Boolean);
    await updateVideo(id, { tags });
  }

  function openEdit(v: Video) {
    setEditVideo(v);
    setEditForm({
      text: v.text ?? "",
      postedAt: v.postedAt ? new Date(v.postedAt).toISOString().split("T")[0] : "",
      tweetUrl: v.tweetUrl ?? "",
    });
  }

  useEffect(() => { if (authed) fetchVideos(); }, [authed]);

  const mono = { fontFamily: "'JetBrains Mono', monospace" };
  const s = { minHeight: "100vh", background: "#0a0a0a", color: "#fff", fontFamily: "'Syne', sans-serif" };

  if (!authed) {
    return (
      <main style={{ ...s, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
        <div style={{ width: 320 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24 }}>xfolio dashboard</h1>
          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()}
            style={{ ...mono, width: "100%", background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 14, marginBottom: 12 }}
          />
          <button onClick={login} style={{ width: "100%", background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "10px 14px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            enter
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={s}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;700&family=JetBrains+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        input, textarea { outline: none; }
        .progress-bar { height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; margin-top: 10px; }
        .progress-fill { height: 100%; background: #fff; transition: width 0.2s; }
        .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.75); display: flex; align-items: center; justify-content: center; z-index: 50; backdrop-filter: blur(4px); }
        .popup { background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; padding: 28px; width: 420px; max-width: 90vw; }
      `}</style>

      {/* delete confirmation popup */}
      {confirmDelete && (
        <div className="overlay" onClick={() => setConfirmDelete(null)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>delete this video?</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>removes it from your portfolio and database. it stays on cloudinary.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => deleteVideo(confirmDelete)} style={{ flex: 1, background: "#ff4444", color: "#fff", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
                yes, delete
              </button>
              <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
                cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* edit popup */}
      {editVideo && (
        <div className="overlay" onClick={() => setEditVideo(null)}>
          <div className="popup" onClick={(e) => e.stopPropagation()}>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>edit video</p>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>caption</p>
              <textarea
                value={editForm.text}
                onChange={(e) => setEditForm((p) => ({ ...p, text: e.target.value }))}
                rows={3}
                style={{ ...mono, width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13, resize: "vertical" }}
              />
            </div>

            <div style={{ marginBottom: 14 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>date posted</p>
              <input
                type="date"
                value={editForm.postedAt}
                onChange={(e) => setEditForm((p) => ({ ...p, postedAt: e.target.value }))}
                style={{ ...mono, width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13 }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>tweet URL</p>
              <input
                placeholder="https://x.com/whakee_/status/..."
                value={editForm.tweetUrl}
                onChange={(e) => setEditForm((p) => ({ ...p, tweetUrl: e.target.value }))}
                style={{ ...mono, width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 12px", color: "#fff", fontSize: 13 }}
              />
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={saveEdit} style={{ flex: 1, background: "#fff", color: "#000", border: "none", borderRadius: 8, padding: "10px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
                save changes
              </button>
              <button onClick={() => setEditVideo(null)} style={{ flex: 1, background: "transparent", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px", fontSize: 13, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
                cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>dashboard</h1>
          <a href="/" style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", fontFamily: "'Syne', sans-serif" }}>view portfolio →</a>
        </div>

        {/* upload section */}
        <div
          style={{ background: "#111", border: `1px solid ${dragOver ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 10, padding: "20px 18px", marginBottom: 16, transition: "border-color 0.15s" }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) uploadVideo(f); }}
        >
          <p style={{ ...mono, fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 14, letterSpacing: "0.08em" }}>ADD VIDEO</p>

          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ flex: 2, minWidth: 200 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>caption</p>
              <input
                placeholder="what's this video about?"
                value={form.text}
                onChange={(e) => setForm((p) => ({ ...p, text: e.target.value }))}
                style={{ ...mono, width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 12px", color: "#fff", fontSize: 12 }}
              />
            </div>
            <div style={{ flex: 1, minWidth: 140 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>date posted</p>
              <input
                type="date"
                value={form.postedAt}
                onChange={(e) => setForm((p) => ({ ...p, postedAt: e.target.value }))}
                style={{ ...mono, width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 12px", color: "#fff", fontSize: 12 }}
              />
            </div>
            <div style={{ flex: 2, minWidth: 200 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>tweet URL</p>
              <input
                placeholder="https://x.com/whakee_/status/..."
                value={form.tweetUrl}
                onChange={(e) => setForm((p) => ({ ...p, tweetUrl: e.target.value }))}
                style={{ ...mono, width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "8px 12px", color: "#fff", fontSize: 12 }}
              />
            </div>
          </div>

          <div
            onClick={() => !uploading && fileRef.current?.click()}
            style={{ border: "1px dashed rgba(255,255,255,0.15)", borderRadius: 8, padding: "28px 20px", textAlign: "center", cursor: uploading ? "not-allowed" : "pointer" }}
          >
            <input ref={fileRef} type="file" accept="video/*" style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadVideo(f); }} />
            {uploading ? (
              <>
                <p style={{ ...mono, fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{uploadMsg}</p>
                {uploadProgress > 0 && (
                  <div className="progress-bar" style={{ marginTop: 12 }}>
                    <div className="progress-fill" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                <p style={{ ...mono, fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 6 }}>{uploadProgress}%</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>drag & drop your video here</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>or click to browse · mp4, mov, avi</p>
              </>
            )}
          </div>

          {!uploading && uploadMsg && (
            <p style={{ ...mono, fontSize: 12, color: uploadMsg === "video added!" ? "#4ade80" : "#f87171", marginTop: 10 }}>{uploadMsg}</p>
          )}
        </div>

        {/* video list */}
        <div style={{ display: "grid", gap: 1, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
          {videos.length === 0 && (
            <div style={{ padding: 40, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
              no videos yet — upload one above
            </div>
          )}
          {videos.map((v) => (
            <div key={v.id} style={{ background: v.hidden ? "#0e0e0e" : "#111", padding: "14px 18px", display: "grid", gridTemplateColumns: "60px 1fr auto", gap: 16, alignItems: "center", opacity: v.hidden ? 0.5 : 1 }}>
              {v.thumbnailUrl ? (
                <img src={v.thumbnailUrl} alt="" style={{ width: 60, height: 80, objectFit: "cover", borderRadius: 6 }} />
              ) : (
                <div style={{ width: 60, height: 80, background: "#1a1a1a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 20, opacity: 0.3 }}>▶</span>
                </div>
              )}
              <div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 500 }}>
                  {v.text ?? "(no caption)"}
                </p>
                <div style={{ display: "flex", gap: 16, marginBottom: 10 }}>
                  <span style={{ ...mono, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{new Date(v.postedAt).toLocaleDateString()}</span>
                  {v.tweetUrl && (
                    <a href={v.tweetUrl} target="_blank" rel="noopener noreferrer" style={{ ...mono, fontSize: 11, color: "rgba(255,255,255,0.25)", textDecoration: "none" }}>
                      view on x ↗
                    </a>
                  )}
                </div>
                <input
                  placeholder="tags, comma separated (e.g. web3, fintech)"
                  defaultValue={v.tags.join(", ")}
                  onChange={(e) => setTagInput((prev) => ({ ...prev, [v.id]: e.target.value }))}
                  onBlur={() => tagInput[v.id] !== undefined && setTags(v.id, tagInput[v.id])}
                  style={{ ...mono, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "5px 10px", color: "rgba(255,255,255,0.6)", fontSize: 12, width: 340 }}
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openEdit(v)}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 12px", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}
                >
                  edit
                </button>
                <button
                  onClick={() => updateVideo(v.id, { pinned: !v.pinned })}
                  style={{ background: v.pinned ? "rgba(255,255,255,0.1)" : "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 12px", color: v.pinned ? "#fff" : "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}
                >
                  {v.pinned ? "📌 pinned" : "pin"}
                </button>
                <button
                  onClick={() => updateVideo(v.id, { hidden: !v.hidden })}
                  style={{ background: "transparent", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 12px", color: "rgba(255,255,255,0.4)", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}
                >
                  {v.hidden ? "show" : "hide"}
                </button>
                <button
                  onClick={() => setConfirmDelete(v.id)}
                  style={{ background: "transparent", border: "1px solid rgba(255,60,60,0.2)", borderRadius: 6, padding: "6px 12px", color: "rgba(255,80,80,0.6)", fontSize: 12, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}
                >
                  delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}