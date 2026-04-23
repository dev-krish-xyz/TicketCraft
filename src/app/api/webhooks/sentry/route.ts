import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { signals } from "@/server/db/schema";
import { generateFingerprint } from "@/server/signals/fingerprint";
import {
  parseSentryPayload,
  type SentryWebhookPayload,
} from "@/server/signals/parsers/sentry";

export async function POST(request: Request) {
  // Verify Sentry webhook signature if configured
  const sentrySecret = process.env.SENTRY_WEBHOOK_SECRET;
  if (sentrySecret) {
    const signature = request.headers.get("sentry-hook-signature");
    if (!signature) {
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }
    // In production, verify HMAC-SHA256 signature here
  }

  const teamId = request.headers.get("x-team-id");
  if (!teamId) {
    return NextResponse.json(
      { error: "x-team-id header required" },
      { status: 400 }
    );
  }

  const payload: SentryWebhookPayload = await request.json();

  // Handle Sentry's verification request
  if (payload.action === "verification") {
    return NextResponse.json({ status: "ok" });
  }

  const { title, content, rawPayload } = parseSentryPayload(payload);
  const fingerprint = generateFingerprint(content);

  const [signal] = await getDb()
    .insert(signals)
    .values({
      teamId,
      source: "sentry",
      title,
      rawPayload,
      fingerprint,
    })
    .returning();

  return NextResponse.json(signal, { status: 201 });
}
