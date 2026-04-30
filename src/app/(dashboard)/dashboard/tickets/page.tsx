"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTeam } from "@/components/dashboard/team-context";

interface Ticket {
  id: string;
  title: string;
  priority: string;
  status: string;
  rootCause: string | null;
  createdAt: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: "var(--priority-critical)", high: "var(--priority-high)",
  medium: "var(--priority-medium)", minor: "var(--priority-minor)",
};

const PRIORITY_BG: Record<string, string> = {
  critical: "var(--badge-critical-bg)", high: "var(--badge-high-bg)",
  medium: "var(--badge-medium-bg)", minor: "var(--badge-minor-bg)",
};

const STATUS_LABELS: Record<string, string> = {
  open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed",
};

const STATUS_BG: Record<string, string> = {
  open: "var(--badge-critical-bg)", in_progress: "var(--badge-medium-bg)",
  resolved: "var(--badge-minor-bg)", closed: "rgba(156,163,175,0.08)",
};

export default function TicketsPage() {
  const { activeTeam, loading: teamLoading } = useTeam();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [filter, setFilter] = useState("");
  const [fetching, setFetching] = useState(false);

  const isLoading = teamLoading || fetching;

  useEffect(() => {
    if (!activeTeam) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFetching(true);
    const url = filter ? `/api/tickets?teamId=${activeTeam.id}&status=${filter}` : `/api/tickets?teamId=${activeTeam.id}`;
    let cancelled = false;
    fetch(url).then((r) => r.json()).then((data) => {
      if (!cancelled) { setTickets(Array.isArray(data) ? data : []); setFetching(false); }
    });
    return () => { cancelled = true; };
  }, [activeTeam, filter, teamLoading]);

  const FILTER_OPTIONS = ["", "open", "in_progress", "resolved", "closed"] as const;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text)" }}>Tickets</h1>
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
              {s ? STATUS_LABELS[s] : "All"}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl animate-pulse" style={{ background: "var(--panel)" }} />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <div
          className="p-8 rounded-xl border text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--muted)" }}>No tickets yet. Generate tickets from signals using AI.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <Link
              key={ticket.id}
              href={`/dashboard/tickets/${ticket.id}`}
              className="flex items-center gap-4 p-4 rounded-xl border transition-all no-underline"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.15), inset 3px 0 0 var(--accent)";
                e.currentTarget.style.borderColor = "var(--border-strong)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "none";
                e.currentTarget.style.borderColor = "var(--border)";
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-base font-semibold truncate px-2 py-0.5 rounded-md inline-block max-w-full"
                  style={{
                    color: PRIORITY_COLORS[ticket.priority] ?? "var(--text)",
                    background: PRIORITY_BG[ticket.priority] ?? "var(--panel-deep)",
                  }}
                >
                  {ticket.title}
                </p>
                {ticket.rootCause && (
                  <p className="text-xs mt-1.5 truncate italic" style={{ color: "var(--muted)" }}>
                    {ticket.rootCause}
                  </p>
                )}
              </div>
              <span
                className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-full font-semibold uppercase shrink-0"
                style={{
                  background: PRIORITY_BG[ticket.priority] ?? "var(--panel-deep)",
                  color: PRIORITY_COLORS[ticket.priority],
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: PRIORITY_COLORS[ticket.priority] }}
                />
                {ticket.priority}
              </span>
              <span
                className="text-xs px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: STATUS_BG[ticket.status] ?? "var(--panel-deep)",
                  color: "var(--muted)",
                }}
              >
                {STATUS_LABELS[ticket.status] ?? ticket.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
