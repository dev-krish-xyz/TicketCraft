import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { teams, teamMembers } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { updateTeamSchema } from "@/server/validators/teams";

async function getTeamForUser(slug: string, userId: string) {
  const result = await getDb()
    .select({ team: teams, role: teamMembers.role })
    .from(teams)
    .innerJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .where(and(eq(teams.slug, slug), eq(teamMembers.userId, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const result = await getTeamForUser(slug, session.user.id);
  if (!result) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  return NextResponse.json({ ...result.team, role: result.role });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const result = await getTeamForUser(slug, session.user.id);
  if (!result) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  if (result.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = updateTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [updated] = await getDb()
    .update(teams)
    .set(parsed.data)
    .where(eq(teams.id, result.team.id))
    .returning();

  return NextResponse.json(updated);
}
