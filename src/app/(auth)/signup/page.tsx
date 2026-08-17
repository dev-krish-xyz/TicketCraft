"use client";

import { signIn } from "next-auth/react";
import Link from "next/link";

export default function SignupPage() {
  return (
    <div
      className="page-grid min-h-screen flex items-center justify-center px-4"
      style={{ background: "var(--bg)" }}
    >
      <div
        className="tc-auth-card w-full max-w-md p-8 rounded-xl border"
        style={{
          background: "var(--surface)",
          borderColor: "var(--border)",
          boxShadow: "var(--card-shadow)",
        }}
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-bold"
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
              }}
            >
              TC
            </div>
            <span className="text-lg font-semibold" style={{ color: "var(--text)" }}>
              TicketCraft
            </span>
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: "var(--text)" }}>
            Create your account
          </h1>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            Get started with TicketCraft in under a minute
          </p>
        </div>

        <button
          onClick={() => signIn("github", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium transition-colors cursor-pointer"
          style={{
            background: "var(--surface)",
            borderColor: "var(--border-strong)",
            color: "var(--text)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--hover)";
            e.currentTarget.style.borderColor = "var(--border-active)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--surface)";
            e.currentTarget.style.borderColor = "var(--border-strong)";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
          Sign up with GitHub
        </button>

        <p className="mt-4 text-center text-xs" style={{ color: "var(--muted)" }}>
          Already have an account?{" "}
          <Link
            href="/login"
            className="underline transition-colors"
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            Sign in
          </Link>
        </p>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm transition-colors"
            style={{ color: "var(--muted)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--text)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--muted)")}
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
