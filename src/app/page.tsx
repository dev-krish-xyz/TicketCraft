"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

type ThemeMode = "dark" | "light";

type BugSignal = {
  id: string;
  source: string;
  kind: "sentry" | "terminal" | "logs" | "slack" | "support" | "screenshot";
  top: number;
  laneY: number;
  mergeX: number;
};

type Ticket = {
  id: string;
  title: string;
  priority: "Critical" | "High" | "Medium" | "Minor";
};

type WirePath = {
  d: string;
  points: Array<{ x: number; y: number }>;
  joinX: number;
};

const THEME_KEY = "ticketcraft-theme";
const LOOP_DURATION = 8;

const BUG_SIGNALS: BugSignal[] = [
  { id: "signal-1", source: "Error Monitoring", kind: "sentry", top: 44, laneY: 78, mergeX: 530 },
  { id: "signal-2", source: "Runtime", kind: "terminal", top: 126, laneY: 160, mergeX: 506 },
  { id: "signal-3", source: "Application", kind: "logs", top: 208, laneY: 242, mergeX: 474 },
  { id: "signal-4", source: "Support Ops", kind: "slack", top: 290, laneY: 324, mergeX: 492 },
  { id: "signal-5", source: "Customer Care", kind: "support", top: 372, laneY: 406, mergeX: 520 },
  { id: "signal-6", source: "Attachments", kind: "screenshot", top: 454, laneY: 488, mergeX: 538 },
];

const TICKETS: Ticket[] = [
  {
    id: "ticket-1",
    title: "Product list crashes when products array is undefined",
    priority: "High",
  },
  {
    id: "ticket-2",
    title: "Backend fails to connect to MongoDB in production",
    priority: "Critical",
  },
  {
    id: "ticket-3",
    title: "Stripe payment requests timing out",
    priority: "High",
  },
  {
    id: "ticket-4",
    title: "Checkout fails after card submission",
    priority: "High",
  },
  {
    id: "ticket-5",
    title: "Profile image upload fails for PNG files",
    priority: "Medium",
  },
  {
    id: "ticket-6",
    title: "Payment screen shows error after submit",
    priority: "High",
  },
];

const NODE_CENTER = { x: 600, y: 280 };
const LEFT_WIRE_START_X = 398;
const MAIN_JOIN_Y = 280;
const MAIN_INPUT_START_X = 470;
const NODE_INPUT_X = 560;
const NODE_OUTPUT_X = 640;
const RIGHT_WIRE_END = { x: 806, y: 280 };

function createOrthogonalPath(startX: number, startY: number, mergeX: number, mergeY: number, radius = 14): WirePath {
  const direction = mergeY >= startY ? 1 : -1;
  const firstTurnX = mergeX - radius;
  const joinX = mergeX + radius;

  const points = [
    { x: startX, y: startY },
    { x: firstTurnX, y: startY },
    { x: mergeX, y: startY + direction * radius },
    { x: mergeX, y: mergeY - direction * radius },
    { x: joinX, y: mergeY },
    { x: joinX, y: mergeY },
  ];

  const d = [
    `M ${startX} ${startY}`,
    `H ${firstTurnX}`,
    `Q ${mergeX} ${startY} ${mergeX} ${startY + direction * radius}`,
    `V ${mergeY - direction * radius}`,
    `Q ${mergeX} ${mergeY} ${joinX} ${mergeY}`,
    `H ${joinX}`,
  ].join(" ");

  return { d, points, joinX };
}

const INPUT_PATHS: WirePath[] = BUG_SIGNALS.map((signal) =>
  createOrthogonalPath(LEFT_WIRE_START_X, signal.laneY, signal.mergeX, MAIN_JOIN_Y),
);

const OUTPUT_PATH: WirePath = {
  d: `M ${NODE_OUTPUT_X} ${NODE_CENTER.y} H ${RIGHT_WIRE_END.x}`,
  points: [
    { x: NODE_OUTPUT_X, y: NODE_CENTER.y },
    { x: (NODE_OUTPUT_X + RIGHT_WIRE_END.x) / 2, y: NODE_CENTER.y },
    { x: RIGHT_WIRE_END.x, y: RIGHT_WIRE_END.y },
  ],
};

const SIGNAL_TONES: Record<BugSignal["kind"], { chipBg: string; chipBorder: string; chipText: string; cardTint: string; accent: string }> = {
  sentry: {
    chipBg: "rgba(244, 63, 94, 0.12)",
    chipBorder: "rgba(244, 63, 94, 0.34)",
    chipText: "rgb(220 122 138)",
    cardTint: "rgba(244, 63, 94, 0.045)",
    accent: "rgba(244, 63, 94, 0.58)",
  },
  terminal: {
    chipBg: "rgba(16, 185, 129, 0.12)",
    chipBorder: "rgba(16, 185, 129, 0.3)",
    chipText: "rgb(104 190 159)",
    cardTint: "rgba(16, 185, 129, 0.04)",
    accent: "rgba(16, 185, 129, 0.54)",
  },
  logs: {
    chipBg: "rgba(245, 158, 11, 0.12)",
    chipBorder: "rgba(245, 158, 11, 0.32)",
    chipText: "rgb(210 170 82)",
    cardTint: "rgba(245, 158, 11, 0.04)",
    accent: "rgba(245, 158, 11, 0.54)",
  },
  slack: {
    chipBg: "rgba(99, 102, 241, 0.12)",
    chipBorder: "rgba(99, 102, 241, 0.3)",
    chipText: "rgb(136 143 213)",
    cardTint: "rgba(99, 102, 241, 0.04)",
    accent: "rgba(99, 102, 241, 0.52)",
  },
  support: {
    chipBg: "rgba(148, 163, 184, 0.11)",
    chipBorder: "rgba(148, 163, 184, 0.26)",
    chipText: "rgb(148 163 184)",
    cardTint: "rgba(148, 163, 184, 0.035)",
    accent: "rgba(148, 163, 184, 0.45)",
  },
  screenshot: {
    chipBg: "rgba(203, 213, 225, 0.1)",
    chipBorder: "rgba(148, 163, 184, 0.22)",
    chipText: "rgb(148 163 184)",
    cardTint: "rgba(148, 163, 184, 0.03)",
    accent: "rgba(148, 163, 184, 0.4)",
  },
};

function getSignalTiming(index: number) {
  const activate = 0.08 + index * 0.11;
  return {
    activate,
    wirePeak: activate + 0.06,
    nodeHit: activate + 0.12,
    ticketShow: activate + 0.2,
    settle: activate + 0.28,
  };
}

function ThemeToggle({ mode, onToggle }: { mode: ThemeMode; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3.5 py-2 text-xs font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
      aria-label="Toggle theme"
    >
      {mode === "dark" ? "Light Mode" : "Dark Mode"}
    </button>
  );
}

function LogoMark() {
  return (
    <div className="flex items-center gap-2.5">
      <span className="grid h-7 w-7 place-items-center rounded-md border border-[var(--border)] bg-[var(--surface)]">
        <span className="h-2.5 w-2.5 rounded-[2px] border border-[var(--text)]" />
      </span>
      <span className="text-sm font-semibold tracking-[0.1em] text-[var(--text)]">TICKETCRAFT</span>
    </div>
  );
}

function Navbar({ mode, onToggle }: { mode: ThemeMode; onToggle: () => void }) {
  return (
    <header className="border-b border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-[1300px] items-center justify-between px-6 py-4 sm:px-10 lg:px-16">
        <LogoMark />
        <div className="flex items-center gap-2">
          <ThemeToggle mode={mode} onToggle={onToggle} />
          <button
            type="button"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
          >
            Login
          </button>
          <button
            type="button"
            className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] transition hover:bg-[var(--hover)]"
          >
            Signup
          </button>
        </div>
      </div>
    </header>
  );
}

function SourceChip({ label, kind }: { label: string; kind: BugSignal["kind"] }) {
  const tone = SIGNAL_TONES[kind];

  return (
    <span
      className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-[0.08em]"
      style={{ backgroundColor: tone.chipBg, borderColor: tone.chipBorder, color: tone.chipText }}
    >
      {label}
    </span>
  );
}

function SignalBody({ kind }: { kind: BugSignal["kind"] }) {
  if (kind === "sentry") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <SourceChip label="Sentry Alert" kind={kind} />
          <span className="text-[10px] text-[var(--muted)]">new</span>
        </div>
        <p className="mt-2 font-mono text-[11px] leading-relaxed text-[var(--text)]">
          {"TypeError: Cannot read properties of undefined (reading 'map')"}
        </p>
        <p className="mt-1 font-mono text-[10px] text-[var(--muted)]">ProductList.jsx:42</p>
      </div>
    );
  }

  if (kind === "terminal") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <SourceChip label="Terminal" kind={kind} />
          <span className="text-[10px] text-[var(--muted)]">stderr</span>
        </div>
        <div className="mt-2 rounded-md border border-[var(--border-soft)] bg-[var(--panel-deep)] p-2 font-mono text-[10px] leading-relaxed text-[var(--text)]">
          <p>$ yarn start:prod</p>
          <p>MongoNetworkError: failed to connect to server</p>
          <p>ECONNREFUSED</p>
        </div>
      </div>
    );
  }

  if (kind === "logs") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <SourceChip label="Production Logs" kind={kind} />
          <span className="text-[10px] text-[var(--muted)]">api-3</span>
        </div>
        <div className="mt-2 space-y-1 font-mono text-[10px] text-[var(--text)]">
          <p>[ERROR] PaymentService</p>
          <p className="text-[var(--muted)]">Stripe API timeout after 10 seconds</p>
        </div>
      </div>
    );
  }

  if (kind === "slack") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <SourceChip label="Slack" kind={kind} />
          <span className="font-mono text-[10px] text-[var(--muted)]">#support</span>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-[var(--text)]">
          {'"Users reporting checkout failure after entering card details"'}
        </p>
      </div>
    );
  }

  if (kind === "support") {
    return (
      <div>
        <div className="flex items-center justify-between">
          <SourceChip label="Support Ticket" kind={kind} />
          <span className="text-[10px] text-[var(--muted)]">P2</span>
        </div>
        <p className="mt-2 text-[11px] text-[var(--text)]">{'Customer: "Avatar upload fails for PNG images"'}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <SourceChip label="Screenshot" kind={kind} />
        <span className="text-[10px] text-[var(--muted)]">attachment</span>
      </div>
      <div className="mt-2 rounded-md border border-[var(--border-soft)] bg-[var(--panel-deep)] p-2">
        <p className="font-mono text-[10px] text-[var(--text)]">checkout-error.png</p>
        <p className="mt-1 text-[10px] text-[var(--muted)]">{'"Payment could not be processed"'}</p>
      </div>
    </div>
  );
}

function BugSignalCard({ signal, index, reduceMotion }: { signal: BugSignal; index: number; reduceMotion: boolean }) {
  const { activate, wirePeak, settle } = getSignalTiming(index);
  const tone = SIGNAL_TONES[signal.kind];

  return (
    <motion.article
      className="absolute left-[2%] w-[96%] rounded-xl border border-[var(--border)] bg-[var(--panel)] p-3"
      style={{ top: signal.top, boxShadow: "var(--card-shadow)" }}
      animate={
        reduceMotion
          ? { y: 0 }
          : {
              y: [0, -1.6, 0, 1.2, 0],
            }
      }
      transition={{ duration: 5.5 + index * 0.35, repeat: Infinity, ease: "easeInOut" }}
    >
      <span className="pointer-events-none absolute left-0 top-0 h-full w-[2px] rounded-l-xl" style={{ backgroundColor: tone.accent }} />
      <span className="pointer-events-none absolute inset-0 rounded-xl" style={{ backgroundColor: tone.cardTint }} />

      <motion.div
        className="pointer-events-none absolute inset-0 rounded-xl border border-[var(--border-active)]"
        style={{ boxShadow: "var(--card-glow)" }}
        animate={
          reduceMotion
            ? { opacity: 0 }
            : {
                opacity: [0, 0, 0.95, 0.4, 0],
              }
        }
        transition={{
          duration: LOOP_DURATION,
          repeat: Infinity,
          ease: "linear",
          times: [0, activate, wirePeak, settle, 1],
        }}
      />

      <motion.span
        className="absolute -right-[6px] top-1/2 h-3 w-3 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--surface)]"
        animate={
          reduceMotion
            ? { scale: 1, opacity: 1 }
            : {
                scale: [1, 1, 1.3, 1, 1],
                opacity: [0.7, 0.7, 1, 0.8, 0.7],
              }
        }
        transition={{
          duration: LOOP_DURATION,
          repeat: Infinity,
          ease: "linear",
          times: [0, activate, wirePeak, settle, 1],
        }}
      />

      <div className="relative z-10">
        <p className="mb-2 text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">{signal.source}</p>
        <SignalBody kind={signal.kind} />
      </div>
    </motion.article>
  );
}

function ProcessingNode({ reduceMotion }: { reduceMotion: boolean }) {
  const interval = LOOP_DURATION / BUG_SIGNALS.length;

  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 z-30 -translate-x-1/2 -translate-y-1/2">
      <div
        className="relative grid h-24 w-24 place-items-center rounded-2xl border border-[var(--border-active)] bg-[var(--node-bg)]"
        style={{ boxShadow: "var(--node-shadow)" }}
      >
        {!reduceMotion &&
          BUG_SIGNALS.map((signal, index) => (
            <motion.span
              key={signal.id}
              className="absolute inset-0 rounded-2xl border border-[var(--border-active)]"
              animate={{ scale: [1, 1.26], opacity: [0.35, 0] }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
                repeat: Infinity,
                repeatDelay: LOOP_DURATION - 0.8,
                delay: 1 + index * interval,
              }}
            />
          ))}
        <p className="text-center text-[9px] uppercase tracking-[0.1em] text-[var(--muted)]">
          Processing
          <span className="mt-1 block text-xs font-semibold normal-case tracking-normal text-[var(--text)]">
            TicketCraft Engine
          </span>
        </p>
      </div>
    </div>
  );
}

function WireNetwork({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 hidden lg:block">
      <svg viewBox="0 0 1200 560" className="h-full w-full" preserveAspectRatio="none" aria-hidden="true">
        {INPUT_PATHS.map((path, index) => {
          const { activate, wirePeak, nodeHit, settle } = getSignalTiming(index);

          return (
            <g key={path.d}>
              <path d={path.d} fill="none" stroke="var(--wire)" strokeWidth="1.25" />

              <motion.path
                d={path.d}
                fill="none"
                stroke="var(--wire-active)"
                strokeWidth="1.45"
                strokeLinecap="round"
                strokeDasharray="8 11"
                animate={
                  reduceMotion
                    ? { opacity: 0.35 }
                    : {
                        pathLength: [0, 0, 1, 1, 0],
                        opacity: [0, 0, 0.95, 0.6, 0],
                        strokeDashoffset: [8, 8, -26, -46, -62],
                      }
                }
                transition={{
                  duration: LOOP_DURATION,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, activate, wirePeak, nodeHit, 1],
                }}
              />

              {!reduceMotion && (
                <motion.circle
                  r="2.7"
                  fill="var(--wire-active)"
                  filter="drop-shadow(0 0 6px var(--wire-pulse))"
                  animate={{
                    cx: [
                      path.points[0].x,
                      path.points[0].x,
                      path.points[1].x,
                      path.points[2].x,
                      path.points[3].x,
                      path.points[4].x,
                      path.points[5].x,
                    ],
                    cy: [
                      path.points[0].y,
                      path.points[0].y,
                      path.points[1].y,
                      path.points[2].y,
                      path.points[3].y,
                      path.points[4].y,
                      path.points[5].y,
                    ],
                    opacity: [0, 0, 1, 1, 0.85, 0.55, 0],
                  }}
                  transition={{
                    duration: LOOP_DURATION,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, activate, activate + 0.04, wirePeak, nodeHit, settle, 1],
                  }}
                />
              )}

              {!reduceMotion && (
                <motion.circle
                  r="2.6"
                  fill="var(--wire-active)"
                  filter="drop-shadow(0 0 6px var(--wire-pulse))"
                  animate={{
                    cx: [path.joinX, path.joinX, NODE_INPUT_X],
                    cy: [MAIN_JOIN_Y, MAIN_JOIN_Y, MAIN_JOIN_Y],
                    opacity: [0, 1, 0],
                  }}
                  transition={{
                    duration: LOOP_DURATION,
                    repeat: Infinity,
                    ease: "linear",
                    times: [0, nodeHit, nodeHit + 0.08, 1],
                  }}
                />
              )}
            </g>
          );
        })}

        <path d={`M ${MAIN_INPUT_START_X} ${MAIN_JOIN_Y} H ${NODE_INPUT_X}`} fill="none" stroke="var(--wire)" strokeWidth="1.35" />
        <motion.path
          d={`M ${MAIN_INPUT_START_X} ${MAIN_JOIN_Y} H ${NODE_INPUT_X}`}
          fill="none"
          stroke="var(--wire-active)"
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeDasharray="7 10"
          animate={
            reduceMotion
              ? { opacity: 0.35 }
              : {
                  strokeDashoffset: [0, -32],
                  opacity: [0.22, 0.44, 0.22],
                }
          }
          transition={{ duration: 2.3, repeat: Infinity, ease: "linear" }}
        />

        <path d={OUTPUT_PATH.d} fill="none" stroke="var(--wire)" strokeWidth="1.35" />
        <motion.path
          d={OUTPUT_PATH.d}
          fill="none"
          stroke="var(--wire-active)"
          strokeWidth="1.45"
          strokeLinecap="round"
          strokeDasharray="7 10"
          animate={
            reduceMotion
              ? { opacity: 0.35 }
              : {
                  strokeDashoffset: [0, -44],
                  opacity: [0.2, 0.45, 0.2],
                }
          }
          transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
        />

        {!reduceMotion &&
          BUG_SIGNALS.map((signal, index) => {
            const { nodeHit, settle } = getSignalTiming(index);
            return (
              <motion.circle
                key={`${signal.id}-out`}
                r="2.7"
                fill="var(--wire-active)"
                filter="drop-shadow(0 0 6px var(--wire-pulse))"
                animate={{
                  cx: [OUTPUT_PATH.points[0].x, OUTPUT_PATH.points[1].x, OUTPUT_PATH.points[2].x],
                  cy: [OUTPUT_PATH.points[0].y, OUTPUT_PATH.points[1].y, OUTPUT_PATH.points[2].y],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: LOOP_DURATION,
                  repeat: Infinity,
                  ease: "linear",
                  times: [0, nodeHit, nodeHit + 0.09, settle, 1],
                }}
              />
            );
          })}

      </svg>
    </div>
  );
}

function priorityClass(priority: Ticket["priority"]) {
  if (priority === "Critical") {
    return "border-red-500/50 bg-red-500/10 text-[var(--priority-critical)]";
  }

  if (priority === "Medium") {
    return "border-amber-500/50 bg-amber-500/10 text-[var(--priority-medium)]";
  }

  if (priority === "Minor") {
    return "border-emerald-500/50 bg-emerald-500/10 text-[var(--priority-minor)]";
  }

  return "border-red-400/45 bg-red-400/10 text-[var(--priority-high)]";
}

function TicketPanel({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative h-[560px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-4" style={{ boxShadow: "var(--card-shadow)" }}>
      <span className="absolute -left-1 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border border-[var(--border)] bg-[var(--surface)]" />
      <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Structured Developer Tickets</p>

      <div className="mt-4 space-y-2.5">
        {TICKETS.map((ticket, index) => {
          const { activate, ticketShow, settle } = getSignalTiming(index);

          return (
            <motion.article
              key={ticket.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-3"
              animate={
                reduceMotion
                  ? { opacity: 1, y: 0, scale: 1 }
                  : {
                      opacity: [0.2, 0.2, 1, 1, 0.25],
                      y: [8, 8, 0, 0, 8],
                      scale: [0.99, 0.99, 1, 1, 0.99],
                    }
              }
              transition={{
                duration: LOOP_DURATION,
                repeat: Infinity,
                ease: "linear",
                times: [0, activate + 0.12, ticketShow, settle + 0.08, 1],
              }}
            >
              <p className="text-sm leading-snug text-[var(--text)]">{ticket.title}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-[0.08em] text-[var(--muted)]">Priority</span>
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${priorityClass(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  <button
                    type="button"
                    className="rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2.5 py-1 text-[10px] font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)]"
                  >
                    Solve
                  </button>
                </div>
              </div>
            </motion.article>
          );
        })}
      </div>
    </div>
  );
}

function HeroSection({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <section className="mx-auto w-full max-w-[1300px] px-6 pb-16 pt-14 sm:px-10 lg:px-16">
      <div className="max-w-[860px]">
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">TicketCraft</p>
        <h1 className="mt-4 text-4xl font-bold leading-[1.05] text-[var(--text)] sm:text-5xl lg:text-[3.5rem]">
          From production bug signals to structured developer tickets.
        </h1>
        <p className="mt-5 max-w-[700px] text-base leading-relaxed text-[var(--muted)] sm:text-lg">
          Real incidents from monitoring, logs, support, and screenshots flow through TicketCraft Engine and become
          triage-ready tickets your team can execute immediately.
        </p>
      </div>

      <div className="relative mt-14">
        <WireNetwork reduceMotion={reduceMotion} />

        <div className="relative z-20 grid gap-8 lg:grid-cols-[1.06fr_0.9fr_1.04fr]">
          <div
            className="relative h-[560px] overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-3"
            style={{ boxShadow: "var(--card-shadow)" }}
          >
            <p className="px-1 text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Production Bug Signals</p>
            {BUG_SIGNALS.map((signal, index) => (
              <BugSignalCard key={signal.id} signal={signal} index={index} reduceMotion={reduceMotion} />
            ))}
          </div>

          <div className="relative h-[560px]">
            <ProcessingNode reduceMotion={reduceMotion} />
          </div>

          <TicketPanel reduceMotion={reduceMotion} />
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  const reduceMotion = useReducedMotion() ?? false;
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") {
      return "dark";
    }

    const stored = window.localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") {
      return stored;
    }

    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", mode);
    window.localStorage.setItem(THEME_KEY, mode);
  }, [mode]);

  return (
    <main className="page-grid min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar mode={mode} onToggle={() => setMode((current) => (current === "dark" ? "light" : "dark"))} />
      <HeroSection reduceMotion={reduceMotion} />
    </main>
  );
}
