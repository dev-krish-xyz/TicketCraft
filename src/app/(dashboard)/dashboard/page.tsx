"use client";

import { useEffect, useState } from "react";
import { useTeam } from "@/components/dashboard/team-context";

interface Stats {
  signals: { total: number; newCount: number; processingCount: number; convertedCount: number };
  tickets: { total: number; openCount: number; inProgressCount: number; resolvedCount: number; criticalCount: number; highCount: number };
}

function IconSignal() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1 8h2.5L5.5 4l3 8 2-5.5 1.5 2.5H15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconInbox() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M2 5a1 1 0 011-1h10a1 1 0 011 1l1 5H1L2 5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M1 10v2a1 1 0 001 1h12a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconLoader() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 3" />
      <path d="M8 2.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconCheckCircle() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 8l2.5 2.5L11 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTicket() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M1.5 5.5a1 1 0 011-1h11a1 1 0 011 1v1a1.5 1.5 0 000 3v1a1 1 0 01-1 1h-11a1 1 0 01-1-1v-1a1.5 1.5 0 000-3v-1z" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconAlert() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="11" r="0.75" fill="currentColor" />
    </svg>
  );
}

function IconClock() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 5v3.5l2.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
  Icon,
}: {
  label: string;
  value: number;
  sub?: string;
  color?: string;
  Icon?: () => React.JSX.Element;
}) {
  return (
    <div
      className="p-5 rounded-xl border relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, var(--surface) 0%, var(--panel-deep) 100%)",
        borderColor: "var(--border)",
      }}
    >
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl"
        style={{ background: color ?? "var(--accent)" }}
      />
      {Icon && (
        <div className="absolute top-4 right-4 opacity-50" style={{ color: color ?? "var(--accent)" }}>
          <Icon />
        </div>
      )}
      <p className="text-xs uppercase tracking-wider mb-2 pr-6" style={{ color: "var(--muted)" }}>
        {label}
      </p>
      <p className="text-3xl font-bold tabular-nums" style={{ color: "var(--text)" }}>
        {value}
      </p>
      {sub && (
        <p className="text-xs mt-2" style={{ color: "var(--muted)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { activeTeam, loading: teamLoading } = useTeam();
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    if (!activeTeam) return;
    let cancelled = false;
    fetch(`/api/dashboard/stats?teamId=${activeTeam.id}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setStats(data); });
    return () => { cancelled = true; };
  }, [activeTeam]);

  if (teamLoading) {
    return (
      <div className="grid grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "var(--panel)" }} />
        ))}
      </div>
    );
  }

  if (!activeTeam) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-4" style={{ color: "var(--text)" }}>Dashboard</h1>
        <div
          className="p-12 rounded-xl border text-center"
          style={{ background: "var(--surface)", borderColor: "var(--border)" }}
        >
          <div
            className="w-12 h-12 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M3 9a1 1 0 011-1h16a1 1 0 011 1v2a2.5 2.5 0 000 5v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a2.5 2.5 0 000-5V9z" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </div>
          <p className="text-base font-medium mb-2" style={{ color: "var(--text)" }}>No team yet</p>
          <p className="text-sm mb-5" style={{ color: "var(--muted)" }}>Create a team in Settings to get started.</p>
          <a
            href="/dashboard/settings"
            className="inline-block px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent)", color: "white" }}
          >
            Create Team
          </a>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: "var(--text)" }}>Dashboard</h1>
      {stats ? (
        <>
          <h2 className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Signals
          </h2>
          <div className="grid grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Signals" value={stats.signals.total} color="var(--accent)" Icon={IconSignal} />
            <StatCard label="New" value={stats.signals.newCount} color="var(--priority-medium)" Icon={IconInbox} />
            <StatCard label="Processing" value={stats.signals.processingCount} color="var(--priority-high)" Icon={IconLoader} />
            <StatCard label="Converted" value={stats.signals.convertedCount} color="var(--priority-minor)" Icon={IconCheckCircle} />
          </div>
          <h2 className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Tickets
          </h2>
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Tickets" value={stats.tickets.total} color="var(--accent)" Icon={IconTicket} />
            <StatCard
              label="Open"
              value={stats.tickets.openCount}
              sub={`${stats.tickets.criticalCount} critical`}
              color="var(--priority-critical)"
              Icon={IconAlert}
            />
            <StatCard label="In Progress" value={stats.tickets.inProgressCount} color="var(--priority-high)" Icon={IconClock} />
            <StatCard label="Resolved" value={stats.tickets.resolvedCount} color="var(--priority-minor)" Icon={IconCheckCircle} />
          </div>
        </>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: "var(--panel)" }} />
          ))}
        </div>
      )}
    </div>
  );
}
