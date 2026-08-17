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
 * Auth.js crashes with "Invalid URL" if AUTH_URL is set but not a real URL
 * (common misconfig: pasting a secret into AUTH_URL).
 * On Vercel, fall back to the production / deployment host.
 */
function ensureAuthUrl(): void {
  const current = process.env.AUTH_URL;
  const looksLikeUrl = !!current && /^https?:\/\/.+/i.test(current);

  if (looksLikeUrl) return;

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    process.env.AUTH_URL = `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    return;
  }

  if (process.env.VERCEL_URL) {
    process.env.AUTH_URL = `https://${process.env.VERCEL_URL}`;
    return;
  }

  // Leave unset — trustHost will derive from the request
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
    adapter: DrizzleAdapter(db, {
      usersTable: users,
      accountsTable: accounts,
      sessionsTable: sessions,
      verificationTokensTable: verificationTokens,
    }),
    providers: [
      GitHub({
        clientId,
        clientSecret,
      }),
    ],
    trustHost: true,
    pages: {
      signIn: "/login",
    },
    callbacks: {
      session({ session, user }) {
        session.user.id = user.id;
        return session;
      },
    },
  };
});
