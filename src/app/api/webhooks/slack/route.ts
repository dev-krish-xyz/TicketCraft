import { NextResponse } from "next/server";
import { getDb } from "@/server/db";
import { signals } from "@/server/db/schema";
import { generateFingerprint } from "@/server/signals/fingerprint";
import {
  parseSlackPayload,
  type SlackEventPayload,
} from "@/server/signals/parsers/slack";

export async function POST(request: Request) {
  const payload: SlackEventPayload = await request.json();

  // Handle Slack URL verification challenge
  if (payload.challenge) {
    return NextResponse.json({ challenge: payload.challenge });
  }

  const teamId = request.headers.get("x-team-id");
  if (!teamId) {
    return NextResponse.json(
      { error: "x-team-id header required" },
      { status: 400 }
    );
  }

  const { title, content, rawPayload } = parseSlackPayload(payload);
  const fingerprint = generateFingerprint(content);

  const [signal] = await getDb()
    .insert(signals)
    .values({
      teamId,
      source: "slack",
      title,
      rawPayload,
      fingerprint,
    })
    .returning();

  return NextResponse.json(signal, { status: 201 });
}
