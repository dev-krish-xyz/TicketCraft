import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { tickets, teamMembers } from "@/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { createTicketSchema } from "@/server/validators/tickets";

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

  const status = searchParams.get("status");
  const priority = searchParams.get("priority");

  let query = getDb()
    .select()
    .from(tickets)
    .where(eq(tickets.teamId, teamId))
    .orderBy(desc(tickets.createdAt))
    .limit(100);

  if (status) {
    query = getDb()
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.teamId, teamId),
          eq(tickets.status, status as "open" | "in_progress" | "resolved" | "closed")
        )
      )
      .orderBy(desc(tickets.createdAt))
      .limit(100);
  }

  if (priority) {
    query = getDb()
      .select()
      .from(tickets)
      .where(
        and(
          eq(tickets.teamId, teamId),
          eq(tickets.priority, priority as "critical" | "high" | "medium" | "minor")
        )
      )
      .orderBy(desc(tickets.createdAt))
      .limit(100);
  }

  const results = await query;
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

  const body = await request.json();
  const parsed = createTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [ticket] = await getDb()
    .insert(tickets)
    .values({
      teamId,
      createdBy: session.user.id,
      ...parsed.data,
    })
    .returning();

  return NextResponse.json(ticket, { status: 201 });
}
