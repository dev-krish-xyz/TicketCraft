"use client";

import { useState } from "react";
import { useTeam } from "@/components/dashboard/team-context";

export default function SettingsPage() {
  const { teams, activeTeam, setActiveTeam } = useTeam();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setCreating(true);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug }),
    });
    const data = await res.json();
    if (res.ok) {
      setActiveTeam({ ...data, role: "owner" });
      setName("");
      setSlug("");
      window.location.reload();
    } else {
      setError(data.error || "Failed to create team");
    }
    setCreating(false);
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(text);
    setTimeout(() => setCopied(null), 2000);
  };

  const teamId = activeTeam?.id ?? "TEAM_ID";
  const API_ENDPOINTS = [
    `POST /api/signals/ingest?teamId=${teamId}`,
    `POST /api/webhooks/sentry  (header: x-team-id, sentry-hook-signature)`,
    `POST /api/webhooks/slack   (header: x-team-id)`,
    `POST /api/tickets/generate?teamId=${teamId}`,
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Settings</h1>

      {/* Teams */}
      <div className="p-6 rounded-xl border mb-6" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="text-xs font-medium mb-4 uppercase tracking-widest" style={{ color: "var(--muted)" }}>Your Teams</h2>
        {teams.length > 0 ? (
          <div className="space-y-2 mb-6">
            {teams.map((team) => (
              <div
                key={team.id}
                className="flex items-center gap-3 p-3 rounded-xl border"
                style={{ background: "var(--panel)", borderColor: "var(--border)" }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}
                >
                  {team.name[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{team.name}</p>
                  <p className="text-xs" style={{ color: "var(--muted)" }}>/{team.slug} · {team.role}</p>
                </div>
                {activeTeam?.id === team.id ? (
                  <span
                    className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                    style={{ background: "var(--accent)", color: "white" }}
                  >
                    Active
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveTeam(team)}
                    className="text-xs px-2.5 py-1 rounded-lg cursor-pointer shrink-0"
                    style={{ background: "var(--hover)", color: "var(--text)", border: "1px solid var(--border)" }}
                  >
                    Switch
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>You don&apos;t belong to any teams yet.</p>
        )}

        <form onSubmit={handleCreate} className="space-y-3">
          <h3 className="text-sm font-medium" style={{ color: "var(--text)" }}>Create a new team</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs block mb-1.5" style={{ color: "var(--muted)" }}>Team name</label>
              <input
                type="text"
                placeholder="e.g. Engineering"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""));
                }}
                className="w-full px-3 py-2 rounded-lg border text-sm"
                style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
            <div>
              <label className="text-xs block mb-1.5" style={{ color: "var(--muted)" }}>Slug</label>
              <input
                type="text"
                placeholder="engineering"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border text-sm font-mono"
                style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={creating || !name || !slug}
              className="px-4 py-2 rounded-lg text-sm font-medium cursor-pointer disabled:opacity-50"
              style={{ background: "var(--accent)", color: "white", border: "none" }}
            >
              {creating ? "Creating..." : "Create Team"}
            </button>
            {error && <p className="text-xs" style={{ color: "var(--priority-critical)" }}>{error}</p>}
          </div>
        </form>
      </div>

      {/* API Info */}
      <div className="p-6 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="text-xs font-medium mb-4 uppercase tracking-widest" style={{ color: "var(--muted)" }}>API Endpoints</h2>
        {activeTeam && (
          <div
            className="flex items-center gap-2 mb-4 px-3 py-2 rounded-lg"
            style={{ background: "var(--accent-muted)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <span className="text-xs" style={{ color: "var(--muted)" }}>Active team ID:</span>
            <span className="text-xs font-mono" style={{ color: "var(--accent-text)" }}>{activeTeam.id}</span>
          </div>
        )}
        <div className="space-y-2">
          {API_ENDPOINTS.map((endpoint) => (
            <div
              key={endpoint}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style={{
                background: "var(--panel)",
                border: "1px solid var(--border)",
                fontFamily: "var(--font-jetbrains), monospace",
              }}
            >
              <span className="flex-1 truncate text-xs" style={{ color: "var(--muted)" }}>{endpoint}</span>
              <button
                onClick={() => copyText(endpoint)}
                className="shrink-0 px-2 py-0.5 rounded text-xs cursor-pointer transition-all"
                style={{
                  background: copied === endpoint ? "var(--accent-muted)" : "var(--hover)",
                  color: copied === endpoint ? "var(--accent-text)" : "var(--muted)",
                  border: "none",
                }}
              >
                {copied === endpoint ? "Copied!" : "Copy"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
