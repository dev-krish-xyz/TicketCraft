"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState, type ReactNode } from "react";
import { TeamProvider, useTeam } from "./team-context";

interface User {
  name?: string | null;
  email?: string | null;
  image?: string | null;
}

function IconOverview() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
      <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  );
}

function IconSignals() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1 7.5h2.5L5.5 4l3 7 2-5.5 1.5 2.5H14" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconTickets() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.5 5.5a1 1 0 011-1h10a1 1 0 011 1v1a1.5 1.5 0 000 3v1a1 1 0 01-1 1h-10a1 1 0 01-1-1v-1a1.5 1.5 0 000-3v-1z" stroke="currentColor" strokeWidth="1.4" />
      <line x1="5.5" y1="4.5" x2="5.5" y2="10.5" stroke="currentColor" strokeWidth="1.2" strokeDasharray="1 1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="7.5" cy="7.5" r="2" stroke="currentColor" strokeWidth="1.4" />
      <path d="M7.5 1.5v1.5M7.5 12v1.5M1.5 7.5H3M12 7.5h1.5M3.44 3.44l1.06 1.06M10.5 10.5l1.06 1.06M10.5 4.5l1.06-1.06M3.44 11.56l1.06-1.06" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2.5 4.5l3.5 3.5 3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const NAV_ITEMS: { href: string; label: string; Icon: () => React.JSX.Element }[] = [
  { href: "/dashboard", label: "Overview", Icon: IconOverview },
  { href: "/dashboard/signals", label: "Signals", Icon: IconSignals },
  { href: "/dashboard/tickets", label: "Tickets", Icon: IconTickets },
  { href: "/dashboard/settings", label: "Settings", Icon: IconSettings },
];

function Sidebar({ user }: { user: User }) {
  const pathname = usePathname();
  const { teams, activeTeam, setActiveTeam } = useTeam();
  const [showTeamPicker, setShowTeamPicker] = useState(false);

  return (
    <aside
      className="w-64 border-r flex flex-col shrink-0"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      {/* Logo */}
      <div
        className="h-14 flex items-center gap-2.5 px-5 border-b"
        style={{ borderColor: "var(--border)" }}
      >
        <div
          className="w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold shrink-0"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "white" }}
        >
          TC
        </div>
        <span className="font-semibold text-sm" style={{ color: "var(--text)" }}>
          TicketCraft
        </span>
      </div>

      {/* Team switcher */}
      {activeTeam && (
        <div className="px-3 pt-3 relative">
          <button
            onClick={() => setShowTeamPicker((v) => !v)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer"
            style={{
              background: "var(--panel)",
              borderColor: "var(--border)",
              color: "var(--text)",
            }}
          >
            <div
              className="w-5 h-5 rounded flex items-center justify-center text-xs font-bold shrink-0"
              style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}
            >
              {activeTeam.name[0].toUpperCase()}
            </div>
            <span className="truncate font-medium flex-1 text-left">{activeTeam.name}</span>
            <span style={{ color: "var(--muted)" }}>
              <IconChevron />
            </span>
          </button>
          {showTeamPicker && teams.length > 1 && (
            <div
              className="absolute left-3 right-3 top-full mt-1 rounded-lg border z-10 py-1"
              style={{ background: "var(--surface)", borderColor: "var(--border)" }}
            >
              {teams.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTeam(t); setShowTeamPicker(false); }}
                  className="w-full text-left px-3 py-2 text-sm cursor-pointer flex items-center gap-2"
                  style={{
                    background: t.id === activeTeam.id ? "var(--hover)" : "transparent",
                    color: "var(--text)",
                    border: "none",
                  }}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ background: "var(--accent-muted)", color: "var(--accent-text)" }}
                  >
                    {t.name[0].toUpperCase()}
                  </div>
                  <span className="flex-1">{t.name}</span>
                  {t.id === activeTeam.id && (
                    <span className="text-xs" style={{ color: "var(--accent-text)" }}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5 mt-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 py-2 rounded-lg text-sm transition-colors"
              style={{
                background: isActive ? "var(--accent-muted)" : "transparent",
                color: isActive ? "var(--accent-text)" : "var(--muted)",
                borderLeft: `2px solid ${isActive ? "var(--accent)" : "transparent"}`,
                paddingLeft: "10px",
                paddingRight: "12px",
                fontWeight: isActive ? 500 : 400,
              }}
            >
              <item.Icon />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-3 border-t" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center gap-3 px-3 py-2">
          {user.image ? (
            <Image
              src={user.image}
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 rounded-full"
              style={{ boxShadow: "0 0 0 2px var(--border)" }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ background: "var(--panel-deep)", color: "var(--muted)" }}
            >
              {user.name?.[0] ?? "?"}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate font-medium" style={{ color: "var(--text)" }}>
              {user.name ?? "User"}
            </p>
            <p className="text-xs truncate" style={{ color: "var(--muted)" }}>
              {user.email}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full mt-1 px-3 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
          style={{ color: "var(--muted)", background: "transparent", border: "none" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--hover)";
            e.currentTarget.style.color = "var(--text)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = "var(--muted)";
          }}
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}

export function DashboardShell({ user, children }: { user: User; children: ReactNode }) {
  return (
    <TeamProvider>
      <div className="min-h-screen flex" style={{ background: "var(--bg)" }}>
        <Sidebar user={user} />
        <main className="flex-1 overflow-auto">
          <div className="max-w-6xl mx-auto p-8">{children}</div>
        </main>
      </div>
    </TeamProvider>
  );
}
