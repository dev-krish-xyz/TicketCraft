import { handlers } from "@/server/auth";

// Auth.js App Router handlers — keep unwrapped so redirects/cookies work correctly
export const { GET, POST } = handlers;
