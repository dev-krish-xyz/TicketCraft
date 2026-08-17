import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { signals, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { ingestSignalSchema } from "@/server/validators/signals";
import { generateFingerprint } from "@/server/signals/fingerprint";
import { parseGenericContent } from "@/server/signals/parsers/generic";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json(
      { error: "teamId is required" },
      { status: 400 }
    );
  }

  const membership = await getDb()
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, teamId),
        eq(teamMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = ingestSignalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { title, content, rawPayload } = parseGenericContent(parsed.data.content);
  const fingerprint = generateFingerprint(parsed.data.content);

  // Dedup before insert: identical content for this team reuses the existing row
  // instead of writing another signal and only flagging after the fact.
  const existing = await getDb()
    .select()
    .from(signals)
    .where(
      and(eq(signals.teamId, teamId), eq(signals.fingerprint, fingerprint))
    )
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      {
        ...existing[0],
        isDuplicate: true,
        duplicateCount: 1,
        fingerprintContent: content.substring(0, 200),
      },
      { status: 200 }
    );
  }

  const [signal] = await getDb()
    .insert(signals)
    .values({
      teamId,
      source: parsed.data.source,
      title: parsed.data.title ?? title,
      rawPayload,
      fingerprint,
    })
    .returning();

  return NextResponse.json(
    {
      ...signal,
      isDuplicate: false,
      duplicateCount: 1,
      fingerprintContent: content.substring(0, 200),
    },
    { status: 201 }
  );
}
