import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { getDb } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing environment variable: ${name}. Set it in Vercel → Project → Settings → Environment Variables (Production), then redeploy.`
    );
  }
  return value;
}

/**
 * Auth.js crashes with "Invalid URL" if AUTH_URL is set but not a real URL.
 * On Vercel production, always prefer the stable production host so OAuth
 * cookies + callback stay on ticket-craft.vercel.app.
 */
function ensureAuthUrl(): void {
  // Stable production domain for OAuth redirect + cookies
  if (process.env.VERCEL_ENV === "production") {
    const productionHost =
      process.env.VERCEL_PROJECT_PRODUCTION_URL || "ticket-craft.vercel.app";
    process.env.AUTH_URL = `https://${productionHost}`;
    return;
  }

  const current = process.env.AUTH_URL;
  const looksLikeUrl = !!current && /^https?:\/\/.+/i.test(current);
  if (looksLikeUrl) return;

  if (process.env.VERCEL_URL) {
    process.env.AUTH_URL = `https://${process.env.VERCEL_URL}`;
    return;
  }

  if (current) {
    delete process.env.AUTH_URL;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  ensureAuthUrl();

  const secret = requireEnv("AUTH_SECRET");
  const clientId = requireEnv("AUTH_GITHUB_ID");
  const clientSecret = requireEnv("AUTH_GITHUB_SECRET");
  const db = getDb();

  return {
    secret,
    // Keep adapter so users/accounts are stored for teams, but use JWT
    // sessions — more reliable on Vercel serverless than DB session rows.
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    session: {
      strategy: "jwt",
    },
    providers: [
      GitHub({
        clientId,
        clientSecret,
        // Ensure we always get an email for account creation
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
      async jwt({ token, user }) {
        if (user?.id) {
          token.sub = user.id;
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
