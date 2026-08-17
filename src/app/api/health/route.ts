import { NextResponse } from "next/server";

/**
 * Safe production diagnostic: reports which env vars are present (not values).
 * Used to debug Vercel misconfiguration without exposing secrets.
 */
export async function GET() {
  const authUrl = process.env.AUTH_URL ?? null;
  const authUrlValid = !!authUrl && /^https?:\/\/.+/i.test(authUrl);

  return NextResponse.json({
    ok: true,
    host: process.env.VERCEL_URL ?? null,
    productionHost: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
    env: {
      DATABASE_URL: Boolean(process.env.DATABASE_URL),
      AUTH_SECRET: Boolean(process.env.AUTH_SECRET),
      AUTH_GITHUB_ID: Boolean(process.env.AUTH_GITHUB_ID),
      AUTH_GITHUB_SECRET: Boolean(process.env.AUTH_GITHUB_SECRET),
      AUTH_URL: authUrl,
      AUTH_URL_VALID: authUrlValid,
      GOOGLE_GENERATIVE_AI_API_KEY: Boolean(
        process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ),
      GROQ_API_KEY: Boolean(process.env.GROQ_API_KEY),
      UPLOADTHING_TOKEN: Boolean(process.env.UPLOADTHING_TOKEN),
    },
  });
}
