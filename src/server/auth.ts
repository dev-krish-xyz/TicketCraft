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

export const { handlers, auth, signIn, signOut } = NextAuth(() => {
  // Fail with a clear message if production secrets are missing
  const secret = requireEnv("AUTH_SECRET");
  const clientId = requireEnv("AUTH_GITHUB_ID");
  const clientSecret = requireEnv("AUTH_GITHUB_SECRET");
  // Ensures DATABASE_URL is present before adapter init
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
