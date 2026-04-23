import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getDb } from "@/server/db";
import { teams, teamMembers, users } from "@/server/db/schema";
import { eq, and } from "drizzle-orm";
import { addMemberSchema } from "@/server/validators/teams";

async function getTeamWithRole(slug: string, userId: string) {
  const result = await getDb()
    .select({ teamId: teams.id, role: teamMembers.role })
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
  const membership = await getTeamWithRole(slug, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const members = await getDb()
    .select({
      userId: teamMembers.userId,
      role: teamMembers.role,
      joinedAt: teamMembers.joinedAt,
      name: users.name,
      email: users.email,
      image: users.image,
    })
    .from(teamMembers)
    .innerJoin(users, eq(teamMembers.userId, users.id))
    .where(eq(teamMembers.teamId, membership.teamId));

  return NextResponse.json(members);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const membership = await getTeamWithRole(slug, session.user.id);
  if (!membership) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }
  if (membership.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const parsed = addMemberSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const [user] = await getDb()
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await getDb()
    .insert(teamMembers)
    .values({
      teamId: membership.teamId,
      userId: user.id,
      role: parsed.data.role,
    })
    .onConflictDoNothing();

  return NextResponse.json({ success: true }, { status: 201 });
}
