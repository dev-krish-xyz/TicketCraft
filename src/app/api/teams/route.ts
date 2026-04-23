import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { teams, teamMembers } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { createTeamSchema } from "@/server/validators/teams";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userTeams = await getDb()
    .select({
      id: teams.id,
      name: teams.name,
      slug: teams.slug,
      role: teamMembers.role,
      createdAt: teams.createdAt,
    })
    .from(teamMembers)
    .innerJoin(teams, eq(teamMembers.teamId, teams.id))
    .where(eq(teamMembers.userId, session.user.id));

  return NextResponse.json(userTeams);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createTeamSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await getDb()
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.slug, parsed.data.slug))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json(
      { error: "A team with this slug already exists" },
      { status: 409 }
    );
  }

  const [team] = await getDb()
    .insert(teams)
    .values({ name: parsed.data.name, slug: parsed.data.slug })
    .returning();

  await getDb()
    .insert(teamMembers)
    .values({ teamId: team.id, userId: session.user.id, role: "owner" });

  return NextResponse.json(team, { status: 201 });
}
