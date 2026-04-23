import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import {
  signals,
  tickets,
  signalTickets,
  aiAnalyses,
  teamMembers,
} from "@/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { generateTicketSchema } from "@/server/validators/tickets";
import { getAIProvider, resetProvider } from "@/server/ai/provider";
import { canMakeRequest } from "@/server/ai/rate-limit";
import { createHash } from "crypto";

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
  const parsed = generateTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  // Fetch the signals
  const signalRows = await getDb()
    .select()
    .from(signals)
    .where(
      and(eq(signals.teamId, teamId), inArray(signals.id, parsed.data.signalIds))
    );

  if (signalRows.length === 0) {
    return NextResponse.json({ error: "No signals found" }, { status: 404 });
  }

  // Build combined signal content for AI analysis
  const signalContent = signalRows
    .map(
      (s) =>
        `[${s.source.toUpperCase()}] ${s.title}\n${JSON.stringify(s.rawPayload, null, 2)}`
    )
    .join("\n\n---\n\n");

  // Get AI provider with rate limit check
  let provider = await getAIProvider();
  if (!canMakeRequest(provider.name)) {
    // Try fallback provider
    resetProvider();
    provider = await getAIProvider();
    if (!canMakeRequest(provider.name)) {
      return NextResponse.json(
        { error: "AI rate limit exceeded. Please try again shortly." },
        { status: 429 }
      );
    }
  }

  const startTime = Date.now();
  const analysis = await provider.analyzeSignal(signalContent);
  const latencyMs = Date.now() - startTime;

  // Create the ticket
  const [ticket] = await getDb()
    .insert(tickets)
    .values({
      teamId,
      title: analysis.suggestedTitle,
      description: analysis.suggestedDescription,
      priority: analysis.suggestedPriority,
      rootCause: analysis.rootCause,
      aiConfidence: analysis.confidence,
      groupKey: analysis.groupKey,
      createdBy: session.user.id,
    })
    .returning();

  // Link signals to ticket
  await getDb().insert(signalTickets).values(
    signalRows.map((s) => ({
      signalId: s.id,
      ticketId: ticket.id,
    }))
  );

  // Update signal statuses to converted
  await getDb()
    .update(signals)
    .set({ status: "converted" as const })
    .where(inArray(signals.id, parsed.data.signalIds));

  // Store AI audit trail
  const promptHash = createHash("sha256")
    .update(signalContent)
    .digest("hex")
    .substring(0, 16);

  await getDb().insert(aiAnalyses).values({
    signalId: signalRows[0].id,
    ticketId: ticket.id,
    provider: provider.name,
    model: provider.model,
    promptHash,
    response: analysis as unknown as Record<string, unknown>,
    latencyMs,
  });

  return NextResponse.json(
    { ticket, analysis },
    { status: 201 }
  );
}
