"use client";

import { useEffect, useRef, useState } from "react";
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

const COLOR_BG: Record<string, string> = {
  "var(--accent)":            "var(--accent-muted)",
  "var(--priority-critical)": "var(--badge-critical-bg)",
  "var(--priority-high)":     "var(--badge-high-bg)",
  "var(--priority-medium)":   "var(--badge-medium-bg)",
  "var(--priority-minor)":    "var(--badge-minor-bg)",
};

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
  const bg = COLOR_BG[color ?? ""] ?? "var(--surface)";
  return (
    <div
      className="p-5 rounded-xl border relative overflow-hidden"
      style={{
        background: bg,
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

interface DayPoint {
  date: string;
  total: number;
  new: number;
  processing: number;
  converted: number;
  dismissed: number;
}

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function buildFullMonth(year: number, month: number, rows: DayPoint[]): DayPoint[] {
  const byDate: Record<string, DayPoint> = {};
  for (const r of rows) byDate[r.date] = r;
  const days = daysInMonth(year, month);
  return Array.from({ length: days }, (_, i) => {
    const d = i + 1;
    const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return byDate[key] ?? { date: key, total: 0, new: 0, processing: 0, converted: 0, dismissed: 0 };
  });
}

// Demo resolved-ticket counts per day (index 0 = day 1). Covers up to 31 days.
const DEMO_RESOLVED = [0,1,0,2,1,0,3,2,1,0,1,2,0,1,3,2,0,1,0,2,1,0,1,2,3,1,0,2,1,0,1];

function SignalGraph() {
  const { teams, activeTeam } = useTeam();
  const now = new Date();
  const [year] = useState(now.getFullYear());
  const [month] = useState(now.getMonth() + 1);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [data, setData] = useState<DayPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [chartWidth, setChartWidth] = useState(600);

  const effectiveTeamId = selectedTeamId ?? activeTeam?.id ?? null;

  useEffect(() => {
    if (!effectiveTeamId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/dashboard/signals-timeline?teamId=${effectiveTeamId}&year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((rows) => {
        if (!cancelled) {
          setData(buildFullMonth(year, month, Array.isArray(rows) ? rows : []));
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [effectiveTeamId, year, month]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const obs = new ResizeObserver(() => setChartWidth(el.clientWidth));
    obs.observe(el);
    setChartWidth(el.clientWidth);
    return () => obs.disconnect();
  }, []);

  const ML = 28, MR = 8, MT = 8, MB = 24;
  const chartH = 160;
  const innerW = Math.max(chartWidth - ML - MR, 1);
  const innerH = chartH - MT - MB;

  const maxSignals = Math.max(...data.map((d) => d.total), 1);
  const maxTickets = Math.max(...DEMO_RESOLVED.slice(0, data.length), 1);
  const maxVal = Math.max(maxSignals, maxTickets);

  const barCount = data.length || 1;
  const barSlot = innerW / barCount;
  const pairW = Math.max(barSlot * 0.65, 4);
  const singleW = Math.max((pairW - 2) / 2, 2);
  const yLines = [0.25, 0.5, 0.75, 1];

  const hoveredSignals = hoveredIdx !== null ? data[hoveredIdx] : null;
  const hoveredTickets = hoveredIdx !== null ? (DEMO_RESOLVED[hoveredIdx] ?? 0) : 0;
  const hoveredX = hoveredIdx !== null ? ML + hoveredIdx * barSlot + barSlot / 2 : 0;

  if (!effectiveTeamId) return null;

  return (
    <section className="mt-10">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-xs font-medium uppercase tracking-widest" style={{ color: "var(--muted)" }}>
            Signal Activity
          </h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--muted)", opacity: 0.6 }}>
            {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Legend */}
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: "var(--accent)" }} />
              Signals
            </span>
            <span className="flex items-center gap-1.5 text-xs" style={{ color: "var(--muted)" }}>
              <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: "var(--priority-minor)" }} />
              Resolved Tickets
            </span>
          </div>
          {/* Team pills */}
          {teams.length > 1 && (
            <div className="flex gap-1.5 flex-wrap justify-end">
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setSelectedTeamId(t.id)}
                  className="px-3 py-1 text-xs font-medium cursor-pointer transition-all"
                  style={{
                    background: selectedTeamId === t.id ? "var(--accent)" : "var(--panel)",
                    color: selectedTeamId === t.id ? "white" : "var(--muted)",
                    border: `1px solid ${selectedTeamId === t.id ? "var(--accent)" : "var(--border)"}`,
                    borderRadius: "9999px",
                  }}
                >
                  {t.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div
        className="p-4 rounded-xl border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {loading ? (
          <div className="animate-pulse rounded-lg" style={{ height: chartH, background: "var(--panel)" }} />
        ) : (
          <div ref={containerRef} className="relative" style={{ height: chartH }}>
            <svg
              width="100%"
              height={chartH}
              style={{ overflow: "visible", display: "block" }}
            >
              {/* Y gridlines + labels */}
              {yLines.map((frac) => {
                const y = MT + innerH - frac * innerH;
                const label = Math.round(frac * maxVal);
                return (
                  <g key={frac}>
                    <line
                      x1={ML} y1={y} x2={ML + innerW} y2={y}
                      stroke="var(--border)" strokeWidth="1" strokeDasharray="3 3"
                    />
                    <text
                      x={ML - 4} y={y + 4}
                      textAnchor="end" fontSize="9" fill="var(--muted)"
                    >
                      {label}
                    </text>
                  </g>
                );
              })}
              {/* X baseline */}
              <line
                x1={ML} y1={MT + innerH} x2={ML + innerW} y2={MT + innerH}
                stroke="var(--border)" strokeWidth="1"
              />

              {/* Bar pairs */}
              {data.map((d, i) => {
                const sigH = (d.total / maxVal) * innerH;
                const tickH = ((DEMO_RESOLVED[i] ?? 0) / maxVal) * innerH;
                const pairX = ML + i * barSlot + (barSlot - pairW) / 2;
                const bar1X = pairX;
                const bar2X = pairX + singleW + 2;
                const isHovered = hoveredIdx === i;

                return (
                  <g
                    key={d.date}
                    onMouseEnter={() => setHoveredIdx(i)}
                    onMouseLeave={() => setHoveredIdx(null)}
                    style={{ cursor: "default" }}
                  >
                    {/* Hover hit area */}
                    <rect
                      x={ML + i * barSlot} y={MT}
                      width={barSlot} height={innerH}
                      fill="transparent"
                    />
                    {/* Signals bar */}
                    <rect
                      x={bar1X}
                      y={sigH > 0 ? MT + innerH - sigH : MT + innerH - 1}
                      width={singleW}
                      height={Math.max(sigH, sigH > 0 ? 2 : 0)}
                      rx="2"
                      fill="var(--accent)"
                      opacity={d.total === 0 ? 0.1 : isHovered ? 1 : 0.75}
                      style={{ transition: "opacity 0.1s" }}
                    />
                    {/* Resolved tickets bar */}
                    <rect
                      x={bar2X}
                      y={tickH > 0 ? MT + innerH - tickH : MT + innerH - 1}
                      width={singleW}
                      height={Math.max(tickH, tickH > 0 ? 2 : 0)}
                      rx="2"
                      fill="var(--priority-minor)"
                      opacity={(DEMO_RESOLVED[i] ?? 0) === 0 ? 0.1 : isHovered ? 1 : 0.75}
                      style={{ transition: "opacity 0.1s" }}
                    />
                  </g>
                );
              })}

              {/* X axis day labels every 5 days */}
              {data.map((d, i) => {
                const day = i + 1;
                if (day !== 1 && day % 5 !== 0) return null;
                const x = ML + i * barSlot + barSlot / 2;
                return (
                  <text
                    key={d.date}
                    x={x} y={MT + innerH + 16}
                    textAnchor="middle" fontSize="9" fill="var(--muted)"
                  >
                    {day}
                  </text>
                );
              })}
            </svg>

            {/* Tooltip */}
            {hoveredSignals && hoveredIdx !== null && (
              <div
                className="absolute pointer-events-none px-2.5 py-1.5 rounded-lg text-xs"
                style={{
                  bottom: MB + 8,
                  left: Math.min(Math.max(hoveredX - 60, 0), chartWidth - 140),
                  background: "var(--panel-deep)",
                  border: "1px solid var(--border-strong)",
                  color: "var(--text)",
                  whiteSpace: "nowrap",
                  zIndex: 10,
                }}
              >
                <span className="font-medium" style={{ color: "var(--muted)" }}>Day {hoveredIdx + 1}</span>
                <div className="flex flex-col gap-0.5 mt-1">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: "var(--accent)" }} />
                    <span>{hoveredSignals.total} signal{hoveredSignals.total !== 1 ? "s" : ""}</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: "var(--priority-minor)" }} />
                    <span>{hoveredTickets} resolved ticket{hoveredTickets !== 1 ? "s" : ""}</span>
                  </span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

const SOURCE_LABELS: Record<string, string> = {
  sentry: "Sentry", logs: "Logs", terminal: "Terminal",
  slack: "Slack", support: "Support", screenshot: "Screenshot",
};


const SOURCE_COLORS: Record<string, string> = {
  sentry:     "#e05c5c",
  logs:       "#5b8dee",
  terminal:   "#4caf7d",
  slack:      "#9b72e8",
  support:    "#e8a44a",
  screenshot: "#3bbfbf",
};

function polarToCartesian(cx: number, cy: number, r: number, angleRad: number) {
  return { x: cx + r * Math.cos(angleRad), y: cy + r * Math.sin(angleRad) };
}

function donutSegment(
  cx: number, cy: number, outerR: number, innerR: number,
  startAngle: number, endAngle: number
): string {
  const GAP = 0.025;
  const s = startAngle + GAP;
  const e = endAngle - GAP;
  if (e <= s) return "";
  const os = polarToCartesian(cx, cy, outerR, s);
  const oe = polarToCartesian(cx, cy, outerR, e);
  const is = polarToCartesian(cx, cy, innerR, s);
  const ie = polarToCartesian(cx, cy, innerR, e);
  const large = e - s > Math.PI ? 1 : 0;
  return `M ${os.x} ${os.y} A ${outerR} ${outerR} 0 ${large} 1 ${oe.x} ${oe.y} L ${ie.x} ${ie.y} A ${innerR} ${innerR} 0 ${large} 0 ${is.x} ${is.y} Z`;
}

function SignalCategories() {
  const { activeTeam } = useTeam();
  const [categories, setCategories] = useState<{ source: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTeam) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    fetch(`/api/dashboard/signals-by-source?teamId=${activeTeam.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled) {
          setCategories(Array.isArray(data) ? data : []);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [activeTeam]);

  if (!activeTeam) return null;

  const total = categories.reduce((s, c) => s + c.count, 0);
  const CX = 80, CY = 80, OR = 68, IR = 44;

  // Build segments without mutable cursor
  const segments = categories.reduce<{ source: string; count: number; start: number; end: number }[]>(
    (acc, cat) => {
      const start = acc.length > 0 ? acc[acc.length - 1].end : -Math.PI / 2;
      const span = total > 0 ? (cat.count / total) * 2 * Math.PI : 0;
      acc.push({ source: cat.source, count: cat.count, start, end: start + span });
      return acc;
    },
    []
  );

  const hoveredCat = hovered ? categories.find((c) => c.source === hovered) : null;

  return (
    <section className="mt-8">
      <h2 className="text-xs font-medium mb-3 uppercase tracking-widest" style={{ color: "var(--muted)" }}>
        Signal Categories
      </h2>
      <div
        className="p-5 rounded-xl border"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        {loading ? (
          <div className="flex gap-8 items-center">
            <div className="w-40 h-40 rounded-full animate-pulse shrink-0" style={{ background: "var(--panel)" }} />
            <div className="flex-1 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 rounded-lg animate-pulse" style={{ background: "var(--panel)" }} />
              ))}
            </div>
          </div>
        ) : categories.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>
            No signals yet. Ingest signals to see category distribution.
          </p>
        ) : (
          <div className="flex gap-8 items-center">
            {/* Donut chart */}
            <div className="shrink-0 relative" style={{ width: 160, height: 160 }}>
              <svg width="160" height="160" viewBox="0 0 160 160">
                {/* Empty ring background */}
                <circle cx={CX} cy={CY} r={(OR + IR) / 2} fill="none"
                  stroke="var(--panel-deep)" strokeWidth={OR - IR} />
                {segments.map((seg) => {
                  const isHov = hovered === seg.source;
                  const path = donutSegment(CX, CY, isHov ? OR + 4 : OR, IR, seg.start, seg.end);
                  return path ? (
                    <path
                      key={seg.source}
                      d={path}
                      fill={SOURCE_COLORS[seg.source] ?? "#888"}
                      opacity={hovered === null || isHov ? 1 : 0.35}
                      style={{ cursor: "pointer", transition: "opacity 0.15s, d 0.15s" }}
                      onMouseEnter={() => setHovered(seg.source)}
                      onMouseLeave={() => setHovered(null)}
                    />
                  ) : null;
                })}
                {/* Center label */}
                <text x={CX} y={CY - 6} textAnchor="middle" fontSize="18" fontWeight="700"
                  fill="var(--text)" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {hoveredCat ? hoveredCat.count : total}
                </text>
                <text x={CX} y={CY + 12} textAnchor="middle" fontSize="9"
                  fill="var(--muted)">
                  {hoveredCat ? SOURCE_LABELS[hoveredCat.source] : "total"}
                </text>
              </svg>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-2.5">
              {categories.map((cat) => {
                const pct = total > 0 ? Math.round((cat.count / total) * 100) : 0;
                const color = SOURCE_COLORS[cat.source] ?? "#888";
                const isHov = hovered === cat.source;
                return (
                  <div
                    key={cat.source}
                    className="flex items-center gap-3 cursor-default"
                    style={{ opacity: hovered === null || isHov ? 1 : 0.45, transition: "opacity 0.15s" }}
                    onMouseEnter={() => setHovered(cat.source)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: color }} />
                    <span className="text-sm flex-1" style={{ color: "var(--text)" }}>
                      {SOURCE_LABELS[cat.source] ?? cat.source}
                    </span>
                    <span className="text-xs tabular-nums" style={{ color: "var(--muted)" }}>{pct}%</span>
                    <span className="text-sm font-semibold tabular-nums w-7 text-right" style={{ color: "var(--text)" }}>
                      {cat.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
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
          <SignalGraph />
          <SignalCategories />
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
