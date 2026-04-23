"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";

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

type ContentItem = {
  title: string;
  description: string;
};

type CapabilityDemoKey = "analysis" | "ticket" | "dedupe" | "priority";

type CapabilityItem = ContentItem & {
  demo: CapabilityDemoKey;
};

type SignalDemoKey = "runtime" | "logs" | "terminal" | "support" | "screenshot";

type SignalShowcaseItem = ContentItem & {
  demo: SignalDemoKey;
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

const OVERVIEW_POINTS = [
  "TicketCraft automatically converts raw bug signals from logs, runtime errors, support messages, and screenshots into structured developer tickets.",
  "Instead of manually triaging errors across tools, developers receive clean, actionable tickets with context and priority.",
];

const CAPABILITIES: CapabilityItem[] = [
  {
    title: "AI Bug Analysis",
    description: "TicketCraft analyzes stack traces, logs, and error signals to identify the likely root issue.",
    demo: "analysis",
  },
  {
    title: "Automatic Ticket Generation",
    description: "Bug reports are converted into clean, structured developer tickets in one consistent format.",
    demo: "ticket",
  },
  {
    title: "Bug Deduplication",
    description: "Similar error signals are grouped together so teams don’t investigate the same issue repeatedly.",
    demo: "dedupe",
  },
  {
    title: "Priority Detection",
    description: "The system highlights which bugs require urgent attention based on impact and frequency.",
    demo: "priority",
  },
];

const SIGNAL_CATEGORIES: SignalShowcaseItem[] = [
  {
    title: "Runtime Exceptions",
    description: "Application crashes and uncaught runtime errors from production traffic.",
    demo: "runtime",
  },
  {
    title: "Application Logs",
    description: "Server logs, stack traces, and service-level error signals.",
    demo: "logs",
  },
  {
    title: "Terminal Failures",
    description: "Build-time failures or runtime crashes encountered during development.",
    demo: "terminal",
  },
  {
    title: "Support Reports",
    description: "Issues reported directly by users or collected from support teams.",
    demo: "support",
  },
  {
    title: "Screenshots",
    description: "Visual bug reports captured from the UI when behavior is hard to explain in text.",
    demo: "screenshot",
  },
];

const WORKFLOW_STEPS = [
  "Bug signals appear during development or production.",
  "TicketCraft collects and analyzes those signals.",
  "The platform generates structured developer tickets.",
  "Developers review the tickets and fix the issue.",
];

const BENEFITS: ContentItem[] = [
  { title: "Reduce debugging time", description: "Spend less time triaging and more time shipping fixes." },
  { title: "Understand production issues faster", description: "Get immediate clarity on source, impact, and urgency." },
  { title: "Organize bug reports automatically", description: "Keep incoming bug noise structured and prioritized by default." },
  { title: "Focus on fixing bugs", description: "Avoid repetitive manual ticket writing and context switching." },
];

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SECTION_EASE: [number, number, number, number] = [0.18, 0.95, 0.32, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: EASE },
  },
};

const stagger = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.05 },
  },
};

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
  joinX: RIGHT_WIRE_END.x,
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
      className="group relative flex h-9 w-16 items-center rounded-full border border-[var(--border)] bg-[var(--surface)] px-1.5 transition hover:bg-[var(--hover)]"
      aria-label={`Switch to ${mode === "dark" ? "light" : "dark"} mode`}
      title={mode === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      <motion.span
        className="absolute h-6 w-6 rounded-full border border-[var(--border-soft)] bg-[var(--bg)]"
        animate={{ x: mode === "dark" ? 0 : 28 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
      />
      <span className="relative z-10 flex w-full items-center justify-between px-[2px]">
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="1.7">
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.8 4.8l1.6 1.6M17.6 17.6l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.8 19.2l1.6-1.6M17.6 6.4l1.6-1.6" />
        </svg>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="1.7">
          <path d="M21 14.4A8.8 8.8 0 1 1 9.6 3a7.2 7.2 0 0 0 11.4 11.4Z" />
        </svg>
      </span>
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
          <a
            href="/login"
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] no-underline"
          >
            Login
          </a>
          <a
            href="/signup"
            className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text)] transition hover:bg-[var(--hover)] no-underline"
          >
            Signup
          </a>
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

function BugAnalysisDemo({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
      <div className="font-mono text-[10px] leading-relaxed text-[var(--text)]">
        <motion.p
          animate={reduceMotion ? { opacity: 1 } : { opacity: [0.25, 1, 1, 1, 0.25] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "linear" }}
        >
          {"TypeError: Cannot read property 'map'"}
        </motion.p>
        <motion.p
          className="text-[var(--muted)]"
          animate={reduceMotion ? { opacity: 1 } : { opacity: [0.15, 0.9, 0.9, 0.9, 0.15] }}
          transition={{ duration: 5.8, repeat: Infinity, ease: "linear", delay: 0.1 }}
        >
          ProductList.jsx:42
        </motion.p>
      </div>

      {!reduceMotion && (
        <motion.span
          className="pointer-events-none absolute left-0 top-2 h-8 w-20 rounded"
          style={{ background: "linear-gradient(90deg, transparent, rgba(96,165,250,0.35), transparent)" }}
          animate={{ x: [-20, 180], opacity: [0, 0.65, 0] }}
          transition={{ duration: 2.1, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
        />
      )}

      <motion.div
        className="absolute bottom-3 left-3 right-3 rounded-md border border-[var(--border-soft)] bg-[var(--surface)] p-2"
        animate={
          reduceMotion
            ? { opacity: 1, y: 0 }
            : { opacity: [0, 0, 1, 1, 0], y: [6, 6, 0, 0, 6] }
        }
        transition={{ duration: 5.8, repeat: Infinity, ease: "linear", times: [0, 0.35, 0.52, 0.86, 1] }}
      >
        <p className="text-[10px] uppercase tracking-[0.08em] text-blue-400">Root Cause</p>
        <p className="mt-1 text-[11px] text-[var(--text)]">API returned undefined products array.</p>
      </motion.div>
    </div>
  );
}

function TicketGenerationDemo({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="h-36 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
      <div className="grid h-full grid-cols-[1fr_auto_1fr] items-center gap-2">
        <motion.div
          className="rounded-md border border-[var(--border-soft)] bg-[var(--surface)] p-2 font-mono text-[10px] text-[var(--text)]"
          animate={
            reduceMotion
              ? { opacity: 1, y: 0 }
              : { opacity: [0, 1, 1, 1, 0], y: [4, 0, 0, 0, 4] }
          }
          transition={{ duration: 6.2, repeat: Infinity, ease: "linear", times: [0, 0.12, 0.5, 0.86, 1] }}
        >
          <p>Checkout crash</p>
          <p className="text-[var(--muted)]">after card submit</p>
        </motion.div>

        <motion.div
          className="relative h-px w-7 bg-blue-400/70"
          animate={reduceMotion ? { opacity: 1, scaleX: 1 } : { opacity: [0, 0, 1, 1, 0], scaleX: [0.3, 0.3, 1, 1, 0.3] }}
          transition={{ duration: 6.2, repeat: Infinity, ease: "linear", times: [0, 0.2, 0.35, 0.86, 1] }}
        >
          <span className="absolute -right-0.5 -top-[3px] h-1.5 w-1.5 rotate-45 border-r border-t border-blue-400/70" />
        </motion.div>

        <motion.div
          className="rounded-md border border-[var(--border-soft)] bg-[var(--surface)] p-2 text-[10px]"
          animate={reduceMotion ? { opacity: 1, x: 0 } : { opacity: [0, 0, 1, 1, 0], x: [6, 6, 0, 0, 6] }}
          transition={{ duration: 6.2, repeat: Infinity, ease: "linear", times: [0, 0.34, 0.5, 0.88, 1] }}
        >
          <p className="text-[var(--muted)]">Title</p>
          <motion.p
            className="text-[var(--text)]"
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "linear", repeatDelay: 3.6, delay: 0.2 }}
          >
            Checkout fails
          </motion.p>
          <p className="mt-1 text-[var(--muted)]">Priority: High</p>
          <p className="text-[var(--muted)]">Context: payment</p>
        </motion.div>
      </div>
    </div>
  );
}

function DeduplicationDemo({ reduceMotion }: { reduceMotion: boolean }) {
  const items = [
    { label: "Runtime Error", top: "10%", delay: 0 },
    { label: "API Failure", top: "39%", delay: 0.05 },
    { label: "User Report", top: "68%", delay: 0.1 },
  ];

  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
      {items.map((item) => (
        <motion.div
          key={item.label}
          className="absolute left-3 w-24 rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-2 py-1 text-[10px] text-[var(--text)]"
          style={{ top: item.top }}
          animate={
            reduceMotion
              ? { opacity: 1, x: 0, y: 0 }
              : { opacity: [0, 1, 1, 0, 0], x: [0, 0, 38, 50, 50], y: [0, 0, 14, 20, 20], scale: [1, 1, 0.98, 0.92, 0.92] }
          }
          transition={{ duration: 6.4, repeat: Infinity, ease: "linear", delay: item.delay, times: [0, 0.12, 0.38, 0.56, 1] }}
        >
          {item.label}
        </motion.div>
      ))}

      <motion.div
        className="absolute right-3 top-[37%] w-28 rounded-md border border-[var(--border-strong)] bg-[var(--surface)] px-2 py-2 text-center text-[10px] text-[var(--text)]"
        style={{ boxShadow: "var(--card-shadow)" }}
        animate={
          reduceMotion
            ? { opacity: 1, scale: 1 }
            : {
                opacity: [0, 0, 1, 1, 0],
                scale: [0.94, 0.94, 1, 1, 0.98],
                boxShadow: ["none", "none", "0 0 16px rgba(96,165,250,0.35)", "none", "none"],
              }
        }
        transition={{ duration: 6.4, repeat: Infinity, ease: "linear", times: [0, 0.44, 0.58, 0.88, 1] }}
      >
        <p className="text-[var(--muted)]">Merged Into</p>
        <p className="mt-1 font-medium">Grouped Issue</p>
      </motion.div>
    </div>
  );
}

function PriorityDetectionDemo({ reduceMotion }: { reduceMotion: boolean }) {
  const rows = [
    { id: "minor-ui", title: "Minor UI bug", critical: false, level: "minor" as const },
    { id: "checkout", title: "Checkout crash", critical: true, level: "critical" as const },
    { id: "console", title: "Console warning", critical: false, level: "warning" as const },
  ];

  return (
    <div className="h-36 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
      <motion.div
        className="space-y-2"
        animate={reduceMotion ? { opacity: 1 } : { opacity: [0.25, 1, 1, 1, 0.25] }}
        transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
      >
        {rows.map((row) => (
          <motion.div
            key={row.id}
            className="flex items-center justify-between rounded-md border border-[var(--border-soft)] bg-[var(--surface)] px-2 py-1.5"
            animate={
              row.critical && !reduceMotion
                ? {
                    borderColor: ["var(--border-soft)", "var(--border-active)", "var(--border-soft)"],
                    scale: [1, 1.01, 1],
                  }
                : undefined
            }
            transition={row.critical ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : undefined}
          >
            <span className="text-[10px] text-[var(--text)]">{row.title}</span>
            {row.critical ? (
              <motion.span
                className="rounded-full border border-red-500/50 bg-red-500/10 px-2 py-0.5 text-[9px] font-medium text-[var(--priority-critical)]"
                animate={reduceMotion ? { opacity: 1 } : { opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              >
                CRITICAL
              </motion.span>
            ) : row.level === "warning" ? (
              <span className="rounded-full border border-amber-500/45 bg-amber-500/10 px-2 py-0.5 text-[9px] font-medium text-[var(--priority-medium)]">
                WARNING
              </span>
            ) : (
              <span className="text-[9px] text-[var(--muted)]">normal</span>
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

function FeatureDemoCard({
  item,
  reduceMotion,
}: {
  item: CapabilityItem;
  reduceMotion: boolean;
}) {
  const demoMap: Record<CapabilityDemoKey, ReactNode> = {
    analysis: <BugAnalysisDemo reduceMotion={reduceMotion} />,
    ticket: <TicketGenerationDemo reduceMotion={reduceMotion} />,
    dedupe: <DeduplicationDemo reduceMotion={reduceMotion} />,
    priority: <PriorityDetectionDemo reduceMotion={reduceMotion} />,
  };

  return (
    <motion.article
      variants={fadeUp}
      whileHover={reduceMotion ? undefined : { scale: 1.015, y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div>{demoMap[item.demo]}</div>
      <div className="mt-4">
        <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
      </div>
    </motion.article>
  );
}

function FeatureCard({
  item,
  reduceMotion,
}: {
  item: ContentItem;
  reduceMotion: boolean;
}) {
  return (
    <motion.article
      variants={fadeUp}
      whileHover={reduceMotion ? undefined : { scale: 1.015, y: -2 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
    </motion.article>
  );
}

function RuntimeErrorDemo({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
      <motion.div
        className="h-full overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface)]"
        animate={reduceMotion ? { opacity: 1 } : { opacity: [0.35, 1, 1, 0.35] }}
        transition={{ duration: 4.4, repeat: Infinity, ease: "linear" }}
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)]/45 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-[9px] tracking-wide text-[var(--muted)]">runtime.log</span>
        </div>

        <motion.span
          className="absolute right-[18px] top-[18px] h-2 w-2 rounded-full bg-red-400"
          animate={reduceMotion ? { opacity: 1 } : { opacity: [0.45, 1, 0.45] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="px-2.5 pt-2 font-mono text-[10px] leading-relaxed text-[var(--text)]">
          <motion.p
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 1, 1, 0.2] }}
            transition={{ duration: 4.4, repeat: Infinity, ease: "linear", times: [0, 0.2, 0.8, 1] }}
          >
            {"TypeError: Cannot read property 'map'"}
          </motion.p>
          <motion.p
            className="text-[var(--muted)]"
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 0.95, 0.95, 0.2] }}
            transition={{ duration: 4.4, repeat: Infinity, ease: "linear", delay: 0.15, times: [0, 0.2, 0.8, 1] }}
          >
            ProductList.jsx:42
          </motion.p>
        </div>
      </motion.div>
      {!reduceMotion && (
        <motion.div
          className="pointer-events-none absolute left-4 right-4 top-[4.2rem] h-px bg-red-400/60"
          animate={{ opacity: [0, 0.75, 0] }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.8 }}
        />
      )}
    </div>
  );
}

function LogSignalDemo({ reduceMotion }: { reduceMotion: boolean }) {
  const lines = [
    { text: "[INFO] Server started", tone: "text-[var(--muted)]" },
    { text: "[WARN] Slow query detected", tone: "text-amber-400" },
    { text: "[ERROR] PaymentService timeout", tone: "text-red-400" },
  ];

  return (
    <div className="h-36 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
      <div className="h-full overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)]/45 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-[9px] tracking-wide text-[var(--muted)]">production.log</span>
        </div>
        <div className="space-y-1.5 px-2.5 pt-2 font-mono text-[10px]">
          {lines.map((line, index) => (
            <motion.p
              key={line.text}
              className={line.tone}
              animate={
                reduceMotion
                  ? { opacity: 1, x: 0 }
                  : { opacity: [0, 1, 1, 0.25], x: [4, 0, 0, 0] }
              }
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: "linear",
                delay: index * 0.2,
                times: [0, 0.18, 0.8, 1],
              }}
            >
              {line.text}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
}

function TerminalFailureDemo({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="h-36 rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
      <div className="h-full overflow-hidden rounded-md border border-[var(--border-soft)] bg-[var(--surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border)] bg-[var(--panel)]/45 px-2 py-1.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-400/80" />
            <span className="h-2 w-2 rounded-full bg-amber-400/80" />
            <span className="h-2 w-2 rounded-full bg-emerald-400/80" />
          </div>
          <span className="text-[9px] tracking-wide text-[var(--muted)]">terminal</span>
        </div>
        <div className="px-2.5 pt-2 font-mono text-[10px] leading-relaxed text-[var(--text)]">
          <motion.p
            animate={
              reduceMotion
                ? { opacity: 1 }
                : { opacity: [0, 1, 1, 0.2] }
            }
            transition={{ duration: 4.8, repeat: Infinity, ease: "linear", times: [0, 0.16, 0.85, 1] }}
          >
            Running build...
          </motion.p>
          <motion.p
            className="text-[var(--muted)]"
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 1, 1, 0.2] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "linear", delay: 0.18, times: [0, 0.2, 0.85, 1] }}
          >
            Compiling modules...
          </motion.p>
          <motion.p
            className="mt-1 text-amber-400"
            animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 0, 1, 1, 0.25] }}
            transition={{ duration: 4.8, repeat: Infinity, ease: "linear", times: [0, 0.42, 0.58, 0.86, 1] }}
          >
            ERROR Build failed
          </motion.p>
        </div>
      </div>
    </div>
  );
}

function SupportMessageDemo({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
      <motion.div
        className="max-w-[92%] rounded-lg border border-[var(--border-soft)] bg-[var(--surface)] px-3 py-2 text-[10px] text-[var(--text)]"
        animate={reduceMotion ? { opacity: 1, x: 0 } : { opacity: [0, 1, 1, 0.3], x: [-12, 0, 0, 0] }}
        transition={{ duration: 4.8, repeat: Infinity, ease: "linear", times: [0, 0.2, 0.82, 1] }}
      >
        {"Users reporting checkout failure after entering card details."}
      </motion.div>
      <motion.span
        className="absolute right-3 top-3 h-2 w-2 rounded-full bg-blue-400"
        animate={reduceMotion ? { scale: 1 } : { scale: [1, 1.25, 1] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function ScreenshotBugDemo({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="relative h-36 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--panel)] p-3">
      <motion.div
        className="rounded-md border border-[var(--border-soft)] bg-[var(--surface)] p-2"
        animate={reduceMotion ? { opacity: 1, y: 0 } : { opacity: [0, 1, 1, 0.25], y: [6, 0, 0, 6] }}
        transition={{ duration: 5, repeat: Infinity, ease: "linear", times: [0, 0.2, 0.82, 1] }}
      >
        <div className="grid h-16 place-items-center rounded border border-dashed border-[var(--border-soft)] text-[10px] text-[var(--muted)]">
          checkout-error.png
        </div>
      </motion.div>
      <motion.span
        className="absolute bottom-4 right-4 rounded border border-red-500/40 bg-red-500/10 px-2 py-0.5 text-[9px] font-medium text-[var(--priority-critical)]"
        animate={reduceMotion ? { opacity: 1 } : { opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", repeatDelay: 1.2 }}
      >
        UI Error Detected
      </motion.span>
    </div>
  );
}

function BugSignalFeatureCard({
  item,
  reduceMotion,
}: {
  item: SignalShowcaseItem;
  reduceMotion: boolean;
}) {
  const demoMap: Record<SignalDemoKey, ReactNode> = {
    runtime: <RuntimeErrorDemo reduceMotion={reduceMotion} />,
    logs: <LogSignalDemo reduceMotion={reduceMotion} />,
    terminal: <TerminalFailureDemo reduceMotion={reduceMotion} />,
    support: <SupportMessageDemo reduceMotion={reduceMotion} />,
    screenshot: <ScreenshotBugDemo reduceMotion={reduceMotion} />,
  };

  return (
    <motion.article
      variants={fadeUp}
      whileHover={reduceMotion ? undefined : { scale: 1.015 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4"
      style={{ boxShadow: "var(--card-shadow)" }}
    >
      <div>{demoMap[item.demo]}</div>
      <div className="mt-4">
        <h3 className="text-base font-semibold text-[var(--text)]">{item.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">{item.description}</p>
      </div>
    </motion.article>
  );
}

function WorkflowStep({
  text,
  index,
  reduceMotion,
  isLast,
}: {
  text: string;
  index: number;
  reduceMotion: boolean;
  isLast: boolean;
}) {
  const accents = [
    { ring: "border-blue-400/45", dot: "bg-blue-400", line: "bg-blue-400/35" },
    { ring: "border-amber-400/45", dot: "bg-amber-400", line: "bg-amber-400/35" },
    { ring: "border-emerald-400/45", dot: "bg-emerald-400", line: "bg-emerald-400/35" },
    { ring: "border-red-400/45", dot: "bg-red-400", line: "bg-red-400/35" },
  ];
  const accent = accents[index % accents.length];

  return (
    <motion.li variants={fadeUp} className="relative pl-14">
      {!isLast && (
        <motion.span
          className={`absolute left-[1.02rem] top-7 h-[calc(100%+1.25rem)] w-px ${accent.line}`}
          initial={reduceMotion ? false : { scaleY: 0 }}
          whileInView={reduceMotion ? {} : { scaleY: 1 }}
          viewport={{ once: false, amount: 0.3 }}
          transition={{ duration: 0.7, ease: SECTION_EASE }}
          style={{ transformOrigin: "top center" }}
        />
      )}
      <span className={`absolute left-0 top-0.5 grid h-8 w-8 place-items-center rounded-full border ${accent.ring} bg-[var(--surface)] text-xs font-semibold text-[var(--text)]`}>
        {index + 1}
        <span className={`absolute bottom-[5px] h-1 w-1 rounded-full ${accent.dot}`} />
      </span>
      <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4" style={{ boxShadow: "var(--card-shadow)" }}>
        <p className="text-sm leading-relaxed text-[var(--text)]">{text}</p>
      </div>
    </motion.li>
  );
}

function ProductOverviewSection({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.section
      className="mx-auto w-full max-w-[1300px] px-6 py-20 sm:px-10 lg:px-16"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{ duration: 0.75, ease: SECTION_EASE }}
    >
      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.25 }}
        variants={fadeUp}
        className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]"
      >
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Product Overview</p>
          <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">
            Built for developer triage in real-world production environments.
          </h2>
          <div className="mt-5 space-y-4">
            {OVERVIEW_POINTS.map((point) => (
              <p key={point} className="text-base leading-relaxed text-[var(--muted)]">
                {point}
              </p>
            ))}
          </div>
        </div>

        <motion.div
          variants={fadeUp}
          className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-6"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--muted)]">Signal Processing Snapshot</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
              Runtime + logs + support + screenshots
            </div>
            <div className="flex items-center justify-center text-xs text-[var(--muted)]">processed by</div>
            <div className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-3 py-3 text-center text-sm font-semibold text-[var(--text)]">
              TicketCraft Engine
            </div>
            <div className="flex items-center justify-center text-xs text-[var(--muted)]">outputs</div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text)]">
              Structured ticket with context + priority
            </div>
          </div>
        </motion.div>
      </motion.div>
    </motion.section>
  );
}

function KeyCapabilitiesSection({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.section
      className="mx-auto w-full max-w-[1300px] px-6 py-20 sm:px-10 lg:px-16"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{ duration: 0.75, ease: SECTION_EASE }}
    >
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={fadeUp}>
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Key Capabilities</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">Core platform capabilities</h2>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={stagger}
        className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {CAPABILITIES.map((item) => (
          <FeatureDemoCard key={item.title} item={item} reduceMotion={reduceMotion} />
        ))}
      </motion.div>
    </motion.section>
  );
}

function BugSignalsSection({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.section
      className="mx-auto w-full max-w-[1300px] px-6 py-20 sm:px-10 lg:px-16"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{ duration: 0.75, ease: SECTION_EASE }}
    >
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={fadeUp}>
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Bug Signals</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">
          Bug signals developers deal with every day
        </h2>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={stagger}
        className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {SIGNAL_CATEGORIES.map((item) => (
          <BugSignalFeatureCard key={item.title} item={item} reduceMotion={reduceMotion} />
        ))}
      </motion.div>
    </motion.section>
  );
}

function DeveloperWorkflowSection({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.section
      className="mx-auto w-full max-w-[1300px] px-6 py-20 sm:px-10 lg:px-16"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{ duration: 0.75, ease: SECTION_EASE }}
    >
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={fadeUp}>
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Developer Workflow</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">
          How teams use TicketCraft in practice
        </h2>
      </motion.div>

      <motion.ol
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={stagger}
        className="mx-auto mt-10 max-w-[820px] space-y-5"
      >
        {WORKFLOW_STEPS.map((step, index) => (
          <WorkflowStep key={step} text={step} index={index} reduceMotion={reduceMotion} isLast={index === WORKFLOW_STEPS.length - 1} />
        ))}
      </motion.ol>
    </motion.section>
  );
}

function WhyTicketCraftSection({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.section
      className="mx-auto w-full max-w-[1300px] px-6 py-20 sm:px-10 lg:px-16"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{ duration: 0.75, ease: SECTION_EASE }}
    >
      <motion.div initial="hidden" whileInView="visible" viewport={{ once: false, amount: 0.2 }} variants={fadeUp}>
        <p className="text-xs uppercase tracking-[0.15em] text-[var(--muted)]">Why TicketCraft</p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">Why teams adopt TicketCraft</h2>
      </motion.div>

      <motion.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: false, amount: 0.2 }}
        variants={stagger}
        className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
      >
        {BENEFITS.map((item) => (
          <FeatureCard key={item.title} item={item} reduceMotion={reduceMotion} />
        ))}
      </motion.div>
    </motion.section>
  );
}

function FinalCTASection({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <motion.section
      className="mx-auto w-full max-w-[1300px] px-6 pb-24 pt-20 sm:px-10 lg:px-16"
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? {} : { opacity: 1, y: 0 }}
      viewport={{ once: false, amount: 0.18 }}
      transition={{ duration: 0.75, ease: SECTION_EASE }}
    >
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.985 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: false, amount: 0.35 }}
        transition={{ duration: reduceMotion ? 0 : 0.55, ease: EASE }}
        className="rounded-2xl border border-[var(--border)] bg-[var(--panel)] p-10 text-center"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <h2 className="text-3xl font-semibold leading-tight text-[var(--text)] sm:text-4xl">
          Stop chasing stack traces.
          <br />
          Start fixing bugs faster.
        </h2>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <a
            href="/signup"
            className="rounded-lg border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-2.5 text-sm font-medium text-[var(--text)] transition hover:bg-[var(--hover)] no-underline"
          >
            Get Started
          </a>
          <a
            href="/dashboard"
            className="rounded-lg border border-[var(--border)] bg-transparent px-5 py-2.5 text-sm font-medium text-[var(--muted)] transition hover:bg-[var(--hover)] hover:text-[var(--text)] no-underline"
          >
            View Demo
          </a>
        </div>
      </motion.div>
    </motion.section>
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
      <ProductOverviewSection reduceMotion={reduceMotion} />
      <KeyCapabilitiesSection reduceMotion={reduceMotion} />
      <BugSignalsSection reduceMotion={reduceMotion} />
      <DeveloperWorkflowSection reduceMotion={reduceMotion} />
      <WhyTicketCraftSection reduceMotion={reduceMotion} />
      <FinalCTASection reduceMotion={reduceMotion} />
    </main>
  );
}
