"use server";

import { signIn } from "@/server/auth";
import { AuthError } from "next-auth";

export async function signInWithGithub() {
  try {
    await signIn("github", { redirectTo: "/dashboard" });
  } catch (error) {
    // Auth.js throws NEXT_REDIRECT on success — rethrow so Next can follow it
    if (error instanceof AuthError) {
      return { error: error.type || "Configuration" };
    }
    throw error;
  }
}
