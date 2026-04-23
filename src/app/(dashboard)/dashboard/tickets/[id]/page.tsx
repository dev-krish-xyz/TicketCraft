"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Ticket {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  rootCause: string | null;
  aiConfidence: number | null;
  groupKey: string | null;
  createdAt: string;
  updatedAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "var(--priority-critical)",
  high: "var(--priority-high)",
  medium: "var(--priority-medium)",
  minor: "var(--priority-minor)",
};

const PRIORITY_BG: Record<string, string> = {
  critical: "var(--badge-critical-bg)",
  high: "var(--badge-high-bg)",
  medium: "var(--badge-medium-bg)",
  minor: "var(--badge-minor-bg)",
};

const STATUSES = ["open", "in_progress", "resolved", "closed"] as const;
const PRIORITIES = ["critical", "high", "medium", "minor"] as const;

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/tickets/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setTicket)
      .catch(() => router.push("/dashboard/tickets"));
  }, [params.id, router]);

  const updateField = async (field: string, value: string) => {
    if (!ticket) return;
    setSaving(true);
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    if (res.ok) {
      const updated = await res.json();
      setTicket(updated);
    }
    setSaving(false);
  };

  if (!ticket) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 rounded animate-pulse" style={{ background: "var(--panel)" }} />
        <div className="h-40 rounded-xl animate-pulse" style={{ background: "var(--panel)" }} />
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-6">
        <Link
          href="/dashboard/tickets"
          style={{ color: "var(--muted)", textDecoration: "none" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
        >
          Tickets
        </Link>
        <span style={{ color: "var(--border-strong)" }}>/</span>
        <span className="truncate font-medium" style={{ color: "var(--text)" }}>{ticket.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <span
            className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-semibold uppercase mt-0.5 shrink-0"
            style={{
              background: PRIORITY_BG[ticket.priority] ?? "var(--panel-deep)",
              color: PRIORITY_COLORS[ticket.priority],
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[ticket.priority] }} />
            {ticket.priority}
          </span>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold leading-snug" style={{ color: "var(--text)" }}>{ticket.title}</h1>
            {ticket.rootCause && (
              <p className="text-sm mt-1 italic" style={{ color: "var(--muted)" }}>
                Root cause: {ticket.rootCause}
              </p>
            )}
          </div>
        </div>
        {saving && (
          <div className="flex items-center gap-1.5 shrink-0 ml-4 mt-1">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--accent)" }} />
            <span className="text-xs" style={{ color: "var(--muted)" }}>Saving</span>
          </div>
        )}
      </div>

      {/* Metadata grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Status</p>
          <select
            value={ticket.status}
            onChange={(e) => updateField("status", e.target.value)}
            className="text-sm w-full px-3 py-1.5 rounded-lg border cursor-pointer"
            style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
        </div>

        <div className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
          <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Priority</p>
          <select
            value={ticket.priority}
            onChange={(e) => updateField("priority", e.target.value)}
            className="text-sm w-full px-3 py-1.5 rounded-lg border cursor-pointer"
            style={{ background: "var(--panel)", borderColor: "var(--border)", color: "var(--text)" }}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>

        {ticket.aiConfidence !== null && (
          <div className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>AI Confidence</p>
            <p className="text-2xl font-bold tabular-nums mb-3" style={{ color: "var(--text)" }}>
              {(ticket.aiConfidence * 100).toFixed(0)}%
            </p>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--panel-deep)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(ticket.aiConfidence * 100).toFixed(0)}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
          </div>
        )}

        {ticket.groupKey && (
          <div className="p-4 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>Group</p>
            <span
              className="text-sm font-mono px-2 py-0.5 rounded"
              style={{ background: "var(--panel-deep)", color: "var(--muted)" }}
            >
              {ticket.groupKey}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="p-6 rounded-xl border" style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
        <h2 className="text-xs font-medium mb-4 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
          Description
        </h2>
        <div
          className="text-sm leading-7 whitespace-pre-wrap"
          style={{ color: "var(--text)" }}
        >
          {ticket.description}
        </div>
      </div>

      <p className="text-xs mt-4" style={{ color: "var(--muted)" }}>
        Created {new Date(ticket.createdAt).toLocaleString()} &middot; Updated{" "}
        {new Date(ticket.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
