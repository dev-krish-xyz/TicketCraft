import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { signals, tickets, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getAIProvider } from "@/server/ai/provider";
import { canMakeRequest } from "@/server/ai/rate-limit";
import { z } from "zod";

const deduplicateSchema = z.object({
  signalId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = deduplicateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [signal] = await getDb()
    .select()
    .from(signals)
    .where(eq(signals.id, parsed.data.signalId))
    .limit(1);

  if (!signal) {
    return NextResponse.json({ error: "Signal not found" }, { status: 404 });
  }

  const membership = await getDb()
    .select()
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.teamId, signal.teamId),
        eq(teamMembers.userId, session.user.id)
      )
    )
    .limit(1);

  if (membership.length === 0) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Get existing open tickets for this team
  const existingTickets = await getDb()
    .select({
      id: tickets.id,
      title: tickets.title,
      description: tickets.description,
    })
    .from(tickets)
    .where(
      and(
        eq(tickets.teamId, signal.teamId),
        eq(tickets.status, "open")
      )
    )
    .limit(50);

  if (existingTickets.length === 0) {
    return NextResponse.json({
      isDuplicate: false,
      matchedTicketId: null,
      similarity: 0,
      reason: "No existing tickets to compare against",
    });
  }

  const provider = await getAIProvider();
  if (!canMakeRequest(provider.name)) {
    return NextResponse.json(
      { error: "AI rate limit exceeded" },
      { status: 429 }
    );
  }

  const signalContent = `[${signal.source.toUpperCase()}] ${signal.title}\n${JSON.stringify(signal.rawPayload, null, 2)}`;
  const result = await provider.checkDuplicate(signalContent, existingTickets);

  return NextResponse.json(result);
}
