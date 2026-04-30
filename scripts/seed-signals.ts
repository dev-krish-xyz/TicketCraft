import { config } from "dotenv";
import { resolve } from "path";
import { createHash } from "crypto";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

config({ path: resolve(process.cwd(), ".env.local") });

// Inline minimal schema to avoid path-alias issues in the script
const teams = pgTable("teams", {
  id: uuid("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
});

const signals = pgTable("signals", {
  id: uuid("id").defaultRandom().primaryKey(),
  teamId: uuid("team_id").notNull(),
  source: text("source").notNull(),
  title: text("title").notNull(),
  rawPayload: jsonb("raw_payload").notNull(),
  fingerprint: text("fingerprint").notNull(),
  status: text("status").notNull().default("new"),
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
});

function fingerprint(content: string) {
  return createHash("sha256")
    .update(content.toLowerCase().replace(/\s+/g, " ").trim())
    .digest("hex");
}

const DEMO_SIGNALS = [
  {
    source: "sentry",
    title: "NullPointerException in PaymentService.processRefund()",
    status: "new",
    rawPayload: {
      error: "NullPointerException",
      location: "PaymentService.java:248",
      environment: "production",
      affected_users: 142,
    },
  },
  {
    source: "logs",
    title: "Database connection pool exhausted — max 20 connections reached",
    status: "processing",
    rawPayload: {
      service: "api-server",
      level: "CRITICAL",
      pool_size: 20,
      waiting_requests: 38,
    },
  },
  {
    source: "slack",
    title: "Alert: Checkout success rate dropped below 85% threshold",
    status: "new",
    rawPayload: {
      channel: "#alerts",
      metric: "checkout_success_rate",
      current: 0.83,
      threshold: 0.85,
    },
  },
  {
    source: "terminal",
    title: "Memory leak detected in image resizing worker process",
    status: "converted",
    rawPayload: {
      process: "image-worker",
      heap_used_mb: 1840,
      heap_limit_mb: 2048,
      uptime_hours: 6.2,
    },
  },
  {
    source: "support",
    title: "Multiple users unable to reset password — email not delivered",
    status: "new",
    rawPayload: {
      reported_by: "support-team",
      affected_users: 27,
      email_provider: "sendgrid",
      bounced: true,
    },
  },
  // Batch 2
  {
    source: "sentry",
    title: "Unhandled Promise rejection in AuthMiddleware — token validation failed",
    status: "new",
    rawPayload: {
      error: "UnhandledPromiseRejection",
      location: "auth.middleware.ts:91",
      environment: "production",
      affected_users: 58,
    },
  },
  {
    source: "terminal",
    title: "Deployment pipeline failed — Docker image build timed out after 10m",
    status: "new",
    rawPayload: {
      pipeline: "ci-prod",
      step: "docker-build",
      timeout_minutes: 10,
      exit_code: 124,
    },
  },
  {
    source: "logs",
    title: "Rate limiter triggered — 429 responses spiked to 3,400/min on /api/search",
    status: "converted",
    rawPayload: {
      endpoint: "/api/search",
      rate_429_per_min: 3400,
      threshold: 500,
      client_ips: 12,
    },
  },
  {
    source: "support",
    title: "Enterprise customers reporting CSV export producing empty files",
    status: "processing",
    rawPayload: {
      plan: "enterprise",
      feature: "csv-export",
      reported_count: 9,
      ticket_ids: ["T-1041", "T-1044", "T-1049"],
    },
  },
  {
    source: "slack",
    title: "P95 API latency crossed 4s on /api/dashboard — SLO breach imminent",
    status: "new",
    rawPayload: {
      channel: "#oncall",
      metric: "api_p95_latency_ms",
      current: 4120,
      slo_limit_ms: 3000,
    },
  },
  {
    source: "screenshot",
    title: "Sidebar nav collapse broken on Safari 17 — items hidden behind overflow",
    status: "dismissed",
    rawPayload: {
      browser: "Safari",
      version: "17.4",
      component: "DashboardSidebar",
      viewport: "1280x800",
    },
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set in .env.local");

  const db = drizzle(neon(url), { schema: { teams, signals } });

  // Pick the first available team
  const [team] = await db.select({ id: teams.id, name: teams.name }).from(teams).limit(1);
  if (!team) {
    console.error("No teams found. Create a team in the dashboard first.");
    process.exit(1);
  }

  console.log(`Seeding signals into team: ${team.name} (${team.id})\n`);

  for (const demo of DEMO_SIGNALS) {
    const fp = fingerprint(JSON.stringify(demo.rawPayload));
    await db.insert(signals).values({
      teamId: team.id,
      source: demo.source,
      title: demo.title,
      rawPayload: demo.rawPayload,
      fingerprint: fp,
      status: demo.status,
    });
    console.log(`  ✓ [${demo.source}] ${demo.title}`);
  }

  console.log("\nDone — 5 demo signals added.");
}

main().catch((err) => { console.error(err); process.exit(1); });
