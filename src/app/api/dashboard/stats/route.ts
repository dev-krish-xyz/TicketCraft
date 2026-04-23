import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { signals, tickets, teamMembers } from "@/server/db/schema";
import { eq, and, count, sql } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json({ error: "teamId is required" }, { status: 400 });
  }

  const membership = await getDb()
    .select()
    .from(teamMembers)
    .where(
      and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.user.id))
    )
    .limit(1);

  if (membership.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [signalStats] = await getDb()
    .select({
      total: count(),
      newCount: count(
        sql`CASE WHEN ${signals.status} = 'new' THEN 1 END`
      ),
      processingCount: count(
        sql`CASE WHEN ${signals.status} = 'processing' THEN 1 END`
      ),
      convertedCount: count(
        sql`CASE WHEN ${signals.status} = 'converted' THEN 1 END`
      ),
    })
    .from(signals)
    .where(eq(signals.teamId, teamId));

  const [ticketStats] = await getDb()
    .select({
      total: count(),
      openCount: count(
        sql`CASE WHEN ${tickets.status} = 'open' THEN 1 END`
      ),
      inProgressCount: count(
        sql`CASE WHEN ${tickets.status} = 'in_progress' THEN 1 END`
      ),
      resolvedCount: count(
        sql`CASE WHEN ${tickets.status} = 'resolved' THEN 1 END`
      ),
      criticalCount: count(
        sql`CASE WHEN ${tickets.priority} = 'critical' THEN 1 END`
      ),
      highCount: count(
        sql`CASE WHEN ${tickets.priority} = 'high' THEN 1 END`
      ),
    })
    .from(tickets)
    .where(eq(tickets.teamId, teamId));

  return NextResponse.json({
    signals: signalStats,
    tickets: ticketStats,
  });
}
