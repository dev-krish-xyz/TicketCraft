import { handlers } from "@/server/auth";
import type { NextRequest } from "next/server";

/**
 * Wrap Auth.js handlers so production misconfig errors return a JSON body
 * instead of an empty 500 (easier to diagnose on Vercel).
 */
async function withAuthErrorHandling(
  handler: (req: NextRequest) => Promise<Response>,
  req: NextRequest
): Promise<Response> {
  try {
    return await handler(req);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown auth error";
    console.error("[auth]", message, err);
    return Response.json(
      {
        error: "Auth configuration error",
        message,
        hint: "Set DATABASE_URL, AUTH_SECRET, AUTH_GITHUB_ID, AUTH_GITHUB_SECRET, and AUTH_URL on Vercel (Production), then redeploy.",
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return withAuthErrorHandling(handlers.GET, req);
}

export async function POST(req: NextRequest) {
  return withAuthErrorHandling(handlers.POST, req);
}
