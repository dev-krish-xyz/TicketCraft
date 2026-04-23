import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { signals, teamMembers } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createSignalSchema } from "@/server/validators/signals";
import { generateFingerprint } from "@/server/signals/fingerprint";

export async function GET(request: Request) {
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

  const status = searchParams.get("status");
  const results = await getDb()
    .select()
    .from(signals)
    .where(
      status
        ? and(
            eq(signals.teamId, teamId),
            eq(signals.status, status as "new" | "processing" | "converted" | "dismissed")
          )
        : eq(signals.teamId, teamId)
    )
    .orderBy(desc(signals.createdAt))
    .limit(100);

  return NextResponse.json(results);
}

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
  const parsed = createSignalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const fingerprint = generateFingerprint(JSON.stringify(parsed.data.rawPayload));

  const [signal] = await getDb()
    .insert(signals)
    .values({
      teamId,
      source: parsed.data.source,
      title: parsed.data.title,
      rawPayload: parsed.data.rawPayload,
      fileUrl: parsed.data.fileUrl,
      fingerprint,
    })
    .returning();

  // Check for duplicates
  const duplicates = await getDb()
    .select({ id: signals.id })
    .from(signals)
    .where(
      and(eq(signals.teamId, teamId), eq(signals.fingerprint, fingerprint))
    );

  return NextResponse.json(
    {
      ...signal,
      isDuplicate: duplicates.length > 1,
      duplicateCount: duplicates.length,
    },
    { status: 201 }
  );
}
