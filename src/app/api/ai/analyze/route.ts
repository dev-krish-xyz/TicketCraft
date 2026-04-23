import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { signals, aiAnalyses, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getAIProvider } from "@/server/ai/provider";
import { canMakeRequest } from "@/server/ai/rate-limit";
import { createHash } from "crypto";
import { z } from "zod";

const analyzeSchema = z.object({
  signalId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = analyzeSchema.safeParse(body);
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

  // Verify team membership
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

  const provider = await getAIProvider();
  if (!canMakeRequest(provider.name)) {
    return NextResponse.json(
      { error: "AI rate limit exceeded" },
      { status: 429 }
    );
  }

  const signalContent = `[${signal.source.toUpperCase()}] ${signal.title}\n${JSON.stringify(signal.rawPayload, null, 2)}`;

  const startTime = Date.now();
  const analysis = await provider.analyzeSignal(signalContent);
  const latencyMs = Date.now() - startTime;

  const promptHash = createHash("sha256")
    .update(signalContent)
    .digest("hex")
    .substring(0, 16);

  await getDb().insert(aiAnalyses).values({
    signalId: signal.id,
    provider: provider.name,
    model: provider.model,
    promptHash,
    response: analysis as unknown as Record<string, unknown>,
    latencyMs,
  });

  return NextResponse.json(analysis);
}
