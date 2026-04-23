import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { signals, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { updateSignalSchema } from "@/server/validators/signals";

async function getSignalWithAuth(signalId: string, userId: string) {
  const result = await getDb()
    .select()
    .from(signals)
    .where(eq(signals.id, signalId))
    .limit(1);

  if (result.length === 0) return null;

  const signal = result[0];
  const membership = await getDb()
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, signal.teamId),
        eq(teamMembers.userId, userId)
      )
    )
    .limit(1);

  if (membership.length === 0) return null;
  return signal;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const signal = await getSignalWithAuth(id, session.user.id);
  if (!signal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(signal);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const signal = await getSignalWithAuth(id, session.user.id);
  if (!signal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const parsed = updateSignalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await getDb()
    .update(signals)
    .set(parsed.data)
    .where(eq(signals.id, id))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const signal = await getSignalWithAuth(id, session.user.id);
  if (!signal) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await getDb().delete(signals).where(eq(signals.id, id));
  return NextResponse.json({ success: true });
}
