"use client";

import { useEffect, useRef, useState } from "react";
import { useTeam } from "@/components/dashboard/team-context";
import { useUploadThing } from "@/lib/uploadthing";

interface Signal {
  id: string;
  source: string;
  title: string;
  status: string;
  createdAt: string;
}

const SOURCE_LABELS: Record<string, string> = {
  sentry: "Sentry", logs: "Logs", terminal: "Terminal",
  slack: "Slack", support: "Support", screenshot: "Screenshot",
};

const STATUS_COLORS: Record<string, string> = {
  new: "var(--priority-medium)", processing: "var(--priority-high)",
  converted: "var(--priority-minor)", dismissed: "var(--muted)",
};

const STATUS_BG: Record<string, string> = {
  new: "var(--badge-medium-bg)", processing: "var(--badge-high-bg)",
  converted: "var(--badge-minor-bg)", dismissed: "rgba(156,163,175,0.08)",
};

function relativeTime(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function SourceIcon({ source }: { source: string }) {
  switch (source) {
    case "sentry":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4.5 9.5l1.5-3 1.5 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.2 8.5h1.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "terminal":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="2.5" width="11" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4 5.5l2 1.5-2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M7.5 8.5h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    case "slack":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 2.5a1.5 1.5 0 000 3h1.5V4A1.5 1.5 0 005 2.5z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M5 8.5a1.5 1.5 0 01-1.5-1.5V5.5H5a1.5 1.5 0 010 3z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M9 5.5a1.5 1.5 0 010 3H7.5V7A1.5 1.5 0 019 5.5z" stroke="currentColor" strokeWidth="1.2" />
          <path d="M9 11.5a1.5 1.5 0 001.5-1.5V8.5H9a1.5 1.5 0 000 3z" stroke="currentColor" strokeWidth="1.2" />
        </svg>
      );
    case "support":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 4a1 1 0 011-1h8a1 1 0 011 1v5a1 1 0 01-1 1H8l-2 2-2-2H3a1 1 0 01-1-1V4z" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      );
    case "screenshot":
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="1.5" y="3" width="11" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M5.5 3V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <rect x="2" y="2" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M4.5 5h5M4.5 7h5M4.5 9h3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      );
  }
}

// ─── Ingest Modal ─────────────────────────────────────────────────────────────

type IngestTab = "text" | "screenshot";
const TEXT_SOURCES = ["logs", "terminal", "support", "sentry"] as const;

function IngestModal({
  teamId,
  onClose,
  onSuccess,
}: {
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [tab, setTab] = useState<IngestTab>("text");

  // Text form
  const [source, setSource] = useState<string>("logs");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Screenshot form
  const [imgTitle, setImgTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { startUpload, isUploading } = useUploadThing("screenshotUploader");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview(null);
    }
  };

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setError("");
    setSubmitting(true);
    const res = await fetch(`/api/signals/ingest?teamId=${teamId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, content: content.trim(), title: title.trim() || undefined }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (res.ok) { onSuccess(); onClose(); }
    else setError(data.error ?? "Failed to ingest signal");
  };

  const handleScreenshotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !imgTitle.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const uploaded = await startUpload([file]);
      if (!uploaded?.[0]?.url) throw new Error("Upload failed");
      const fileUrl = uploaded[0].url;
      const res = await fetch(`/api/signals?teamId=${teamId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "screenshot",
          title: imgTitle.trim(),
          rawPayload: { filename: file.name, size: file.size },
          fileUrl,
        }),
      });
      const data = await res.json();
      if (res.ok) { onSuccess(); onClose(); }
      else setError(data.error ?? "Failed to create signal");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    }
    setSubmitting(false);
  };

  const busy = submitting || isUploading;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b" style={{ borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold" style={{ color: "var(--text)" }}>Ingest Signal</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center cursor-pointer transition-colors"
            style={{ background: "transparent", border: "none", color: "var(--muted)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "var(--hover)"; e.currentTarget.style.color = "var(--text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--muted)"; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4">
          {(["text", "screenshot"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-all"
              style={{
                background: tab === t ? "var(--accent)" : "var(--panel)",
                color: tab === t ? "white" : "var(--muted)",
                border: `1px solid ${tab === t ? "var(--accent)" : "var(--border)"}`,
              }}
            >
              {t === "text" ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="1" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M3 4h6M3 6h6M3 8h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Text / Logs
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="1" y="2" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                    <circle cx="6" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.2" />
                    <path d="M4.5 2V1.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5V2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                  Screenshot
                </>
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="px-6 pt-4 pb-6">
          {tab === "text" ? (
            <form onSubmit={handleTextSubmit} className="space-y-3">
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "var(--muted)" }}>Source</label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm cursor-pointer"
                  style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
                >
                  {TEXT_SOURCES.map((s) => (
                    <option key={s} value={s}>{SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "var(--muted)" }}>Title <span style={{ color: "var(--border-strong)" }}>(optional)</span></label>
                <input
                  type="text"
                  placeholder="Short description of the issue"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "var(--muted)" }}>Content <span style={{ color: "var(--priority-critical)" }}>*</span></label>
                <textarea
                  placeholder="Paste logs, error messages, stack traces, or any text signal..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 rounded-lg border text-sm font-mono resize-none"
                  style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>
              {error && <p className="text-xs" style={{ color: "var(--priority-critical)" }}>{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm cursor-pointer"
                  style={{ background: "var(--panel)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={busy || !content.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
                  style={{ background: "var(--accent)", color: "white", border: "none" }}>
                  {submitting ? "Ingesting..." : "Ingest Signal"}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleScreenshotSubmit} className="space-y-3">
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "var(--muted)" }}>Title <span style={{ color: "var(--priority-critical)" }}>*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Broken checkout page on Safari"
                  value={imgTitle}
                  onChange={(e) => setImgTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border text-sm"
                  style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
                />
              </div>
              <div>
                <label className="text-xs block mb-1.5" style={{ color: "var(--muted)" }}>Image <span style={{ color: "var(--priority-critical)" }}>*</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {preview ? (
                  <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: "var(--border)" }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="preview" className="w-full max-h-48 object-contain" style={{ background: "var(--panel-deep)" }} />
                    <button
                      type="button"
                      onClick={() => { setFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center cursor-pointer"
                      style={{ background: "rgba(0,0,0,0.6)", color: "white", border: "none" }}
                    >
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-8 rounded-xl border-2 border-dashed flex flex-col items-center gap-2 cursor-pointer transition-colors"
                    style={{ borderColor: "var(--border)", background: "var(--panel)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent)"; e.currentTarget.style.background = "var(--accent-muted)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--panel)"; }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: "var(--muted)" }}>
                      <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M9 5V4a1 1 0 011-1h4a1 1 0 011 1v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <span className="text-sm" style={{ color: "var(--muted)" }}>Click to select an image</span>
                    <span className="text-xs" style={{ color: "var(--border-strong)" }}>PNG, JPG, GIF up to 4MB</span>
                  </button>
                )}
              </div>
              {error && <p className="text-xs" style={{ color: "var(--priority-critical)" }}>{error}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg text-sm cursor-pointer"
                  style={{ background: "var(--panel)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                  Cancel
                </button>
                <button type="submit" disabled={busy || !file || !imgTitle.trim()}
                  className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
                  style={{ background: "var(--accent)", color: "white", border: "none" }}>
                  {isUploading ? "Uploading..." : submitting ? "Creating..." : "Ingest Screenshot"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignalsPage() {
  const { activeTeam, loading: teamLoading } = useTeam();
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState("");
  const [fetching, setFetching] = useState(false);
  const [generating, setGenerating] = useState<string | null>(null);
  const [showIngest, setShowIngest] = useState(false);

  const isLoading = teamLoading || fetching;

  const fetchSignals = (teamId: string, status: string) => {
    const url = status ? `/api/signals?teamId=${teamId}&status=${status}` : `/api/signals?teamId=${teamId}`;
    fetch(url).then((r) => r.json()).then((data) => { setSignals(Array.isArray(data) ? data : []); setFetching(false); });
  };

  useEffect(() => {
    if (!activeTeam) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetching(true);
    fetchSignals(activeTeam.id, filter);
  }, [activeTeam, filter, teamLoading]);

  const handleGenerateTicket = async (signalId: string) => {
    if (!activeTeam) return;
    setGenerating(signalId);
    const res = await fetch(`/api/tickets/generate?teamId=${activeTeam.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalIds: [signalId] }),
    });
    setGenerating(null);
    if (res.ok) fetchSignals(activeTeam.id, filter);
    else { const d = await res.json(); alert(d.error ?? "Failed to generate ticket"); }
  };

  const FILTER_OPTIONS = ["", "new", "processing", "converted", "dismissed"] as const;

  return (
    <div>
      {showIngest && activeTeam && (
        <IngestModal
          teamId={activeTeam.id}
          onClose={() => setShowIngest(false)}
          onSuccess={() => fetchSignals(activeTeam.id, filter)}
        />
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Signals</h1>
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            {FILTER_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className="px-3 py-1.5 text-xs font-medium cursor-pointer transition-all"
                style={{
                  background: filter === s ? "var(--accent)" : "var(--panel)",
                  color: filter === s ? "white" : "var(--muted)",
                  border: `1px solid ${filter === s ? "var(--accent)" : "var(--border)"}`,
                  borderRadius: "9999px",
                }}
              >
                {s || "All"}
              </button>
            ))}
          </div>
          {activeTeam && (
            <button
              onClick={() => setShowIngest(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
              style={{ background: "var(--accent)", color: "white", border: "none" }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Ingest Signal
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--panel)" }} />
          ))}
        </div>
      ) : signals.length === 0 ? (
        <div
          className="p-8 rounded-xl border text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No signals yet.{" "}
            {activeTeam && (
              <button
                onClick={() => setShowIngest(true)}
                className="cursor-pointer underline"
                style={{ color: "var(--accent-text)", background: "none", border: "none" }}
              >
                Ingest your first signal
              </button>
            )}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {signals.map((signal) => (
            <div
              key={signal.id}
              className="flex items-center gap-4 p-4 rounded-xl border transition-all"
              style={{
                background: "var(--surface)",
                borderColor: "var(--border)",
                boxShadow: `inset 3px 0 0 ${STATUS_COLORS[signal.status] ?? "var(--accent)"}`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = `0 2px 12px rgba(0,0,0,0.12), inset 3px 0 0 ${STATUS_COLORS[signal.status] ?? "var(--accent)"}`;
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = `inset 3px 0 0 ${STATUS_COLORS[signal.status] ?? "var(--accent)"}`;
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <span className="shrink-0" style={{ color: "var(--muted)" }}>
                <SourceIcon source={signal.source} />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--text)" }}>{signal.title}</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  {SOURCE_LABELS[signal.source] ?? signal.source} · {relativeTime(signal.createdAt)}
                </p>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{ background: STATUS_BG[signal.status] ?? "var(--panel-deep)", color: STATUS_COLORS[signal.status] }}
              >
                {signal.status}
              </span>
              {signal.status === "new" && (
                <button
                  onClick={() => handleGenerateTicket(signal.id)}
                  disabled={generating === signal.id}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium cursor-pointer disabled:opacity-50 shrink-0 transition-opacity"
                  style={{ background: "var(--accent)", color: "white", border: "none" }}
                >
                  {generating === signal.id ? (
                    "Generating..."
                  ) : (
                    <>
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M5.5 1L6.7 4.3H10.2L7.3 6.4 8.5 9.7 5.5 7.6 2.5 9.7 3.7 6.4 0.8 4.3H4.3L5.5 1z" fill="currentColor" />
                      </svg>
                      Generate
                    </>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
