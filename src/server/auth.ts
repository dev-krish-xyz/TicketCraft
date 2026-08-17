import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { and, eq } from "drizzle-orm";
import { getDb } from "./db";
import { users, accounts } from "./db/schema";

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Set it in Vercel → Settings → Environment Variables (Production), then redeploy.`
    );
  }
  return value;
}

/**
 * Keep OAuth on the stable production host so cookies + callback match.
 */
function ensureAuthUrl(): void {
  if (process.env.VERCEL_ENV === "production") {
    const host =
      process.env.VERCEL_PROJECT_PRODUCTION_URL || "ticket-craft.vercel.app";
    process.env.AUTH_URL = `https://${host}`;
    return;
  }

  const current = process.env.AUTH_URL?.trim();
  if (current && /^https?:\/\/.+/i.test(current)) return;

  if (process.env.VERCEL_URL) {
    process.env.AUTH_URL = `https://${process.env.VERCEL_URL}`;
    return;
  }

  if (current) delete process.env.AUTH_URL;
}

/**
 * Ensure a DB user exists for GitHub logins so team membership works.
 * Avoids DrizzleAdapter during the OAuth handshake (common Vercel failure source).
 */
async function ensureGithubUser(params: {
  providerAccountId: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}): Promise<string> {
  const db = getDb();

  const existing = await db
    .select({ userId: accounts.userId })
    .from(accounts)
    .where(
      and(
        eq(accounts.provider, "github"),
        eq(accounts.providerAccountId, params.providerAccountId)
      )
    )
    .limit(1);

  if (existing[0]?.userId) {
    return existing[0].userId;
  }

  if (params.email) {
    const byEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, params.email))
      .limit(1);

    if (byEmail[0]?.id) {
      await db
        .insert(accounts)
        .values({
          userId: byEmail[0].id,
          type: "oauth",
          provider: "github",
          providerAccountId: params.providerAccountId,
        })
        .onConflictDoNothing();
      return byEmail[0].id;
    }
  }

  const [created] = await db
    .insert(users)
    .values({
      email: params.email ?? null,
      name: params.name ?? null,
      image: params.image ?? null,
    })
    .returning({ id: users.id });

  await db.insert(accounts).values({
    userId: created.id,
    type: "oauth",
    provider: "github",
    providerAccountId: params.providerAccountId,
  });

  return created.id;
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  ensureAuthUrl();

  const secret = requireEnv("AUTH_SECRET");
  const clientId = requireEnv("AUTH_GITHUB_ID");
  const clientSecret = requireEnv("AUTH_GITHUB_SECRET");

  return {
    secret,
    // No database adapter in the OAuth path — JWT only (more reliable on Vercel)
    session: {
      strategy: "jwt",
      maxAge: 30 * 24 * 60 * 60,
    },
    providers: [
      GitHub({
        clientId,
        clientSecret,
        authorization: {
          params: { scope: "read:user user:email" },
        },
      }),
    ],
    trustHost: true,
    pages: {
      signIn: "/login",
      error: "/login",
    },
    callbacks: {
      async jwt({ token, account, profile }) {
        if (account?.provider === "github" && account.providerAccountId) {
          try {
            const userId = await ensureGithubUser({
              providerAccountId: account.providerAccountId,
              email:
                (profile as { email?: string } | undefined)?.email ??
                token.email,
              name:
                (profile as { name?: string } | undefined)?.name ?? token.name,
              image:
                (profile as { avatar_url?: string; picture?: string } | undefined)
                  ?.avatar_url ??
                (profile as { picture?: string } | undefined)?.picture ??
                (token.picture as string | undefined),
            });
            token.sub = userId;
          } catch (err) {
            console.error("[auth] ensureGithubUser failed", err);
            // Still allow JWT with provider id if DB write fails mid-demo
            token.sub = account.providerAccountId;
          }
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user && token.sub) {
          session.user.id = token.sub;
        }
        return session;
      },
    },
  };
});
