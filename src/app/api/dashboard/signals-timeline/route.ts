import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { signals, teamMembers } from "@/server/db/schema";
import { eq, and, gte, lt, sql } from "drizzle-orm";

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

  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()), 10);
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1), 10);

  if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
    return NextResponse.json({ error: "Invalid year or month" }, { status: 400 });
  }

  const membership = await getDb()
    .select()
    .from(teamMembers)
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.userId, session.user.id)))
    .limit(1);

  if (membership.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const startOfMonth = new Date(year, month - 1, 1);
  const startOfNextMonth = new Date(year, month, 1);

  const rows = await getDb()
    .select({
      day: sql<string>`DATE(${signals.createdAt})`.as("day"),
      total: sql<number>`COUNT(*)`.as("total"),
      newCount: sql<number>`COUNT(CASE WHEN ${signals.status} = 'new' THEN 1 END)`.as("new_count"),
      processingCount: sql<number>`COUNT(CASE WHEN ${signals.status} = 'processing' THEN 1 END)`.as("processing_count"),
      convertedCount: sql<number>`COUNT(CASE WHEN ${signals.status} = 'converted' THEN 1 END)`.as("converted_count"),
      dismissedCount: sql<number>`COUNT(CASE WHEN ${signals.status} = 'dismissed' THEN 1 END)`.as("dismissed_count"),
    })
    .from(signals)
    .where(
      and(
        eq(signals.teamId, teamId),
        gte(signals.createdAt, startOfMonth),
        lt(signals.createdAt, startOfNextMonth)
      )
    )
    .groupBy(sql`DATE(${signals.createdAt})`)
    .orderBy(sql`DATE(${signals.createdAt}) ASC`);

  return NextResponse.json(
    rows.map((r) => ({
      date: r.day,
      total: Number(r.total),
      new: Number(r.newCount),
      processing: Number(r.processingCount),
      converted: Number(r.convertedCount),
      dismissed: Number(r.dismissedCount),
    }))
  );
}
