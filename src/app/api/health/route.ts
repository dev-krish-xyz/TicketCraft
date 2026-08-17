import { NextResponse } from "next/server";

/**
 * Safe production diagnostic: reports which env vars are present (not values).
 * Used to debug Vercel misconfiguration without exposing secrets.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    host: process.env.VERCEL_URL ?? null,
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
      AUTH_GITHUB_ID: Boolean(process.env.AUTH_GITHUB_ID),
      AUTH_GITHUB_SECRET: Boolean(process.env.AUTH_GITHUB_SECRET),
      AUTH_URL: process.env.AUTH_URL ?? null,
      GOOGLE_GENERATIVE_AI_API_KEY: Boolean(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ),
      GROQ_API_KEY: Boolean(process.env.GROQ_API_KEY),
      UPLOADTHING_TOKEN: Boolean(process.env.UPLOADTHING_TOKEN),
    },
  });
}
