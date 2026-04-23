"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

interface Team {
  id: string;
  name: string;
  slug: string;
  role: string;
}

interface TeamContextValue {
  teams: Team[];
  activeTeam: Team | null;
  setActiveTeam: (team: Team) => void;
  loading: boolean;
}

const TeamContext = createContext<TeamContextValue>({
  teams: [],
  activeTeam: null,
  setActiveTeam: () => {},
  loading: true,
});

const STORAGE_KEY = "ticketcraft-active-team";

export function TeamProvider({ children }: { children: ReactNode }) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeamState] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/teams")
      .then((r) => r.json())
      .then((data: Team[]) => {
        if (!Array.isArray(data) || data.length === 0) {
          setLoading(false);
          return;
        }
        setTeams(data);

        // Restore previously selected team from localStorage
        const saved = localStorage.getItem(STORAGE_KEY);
        const found = saved ? data.find((t) => t.id === saved) : null;
        setActiveTeamState(found ?? data[data.length - 1]); // default to most recently created
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const setActiveTeam = (team: Team) => {
    setActiveTeamState(team);
    localStorage.setItem(STORAGE_KEY, team.id);
  };

  return (
    <TeamContext.Provider value={{ teams, activeTeam, setActiveTeam, loading }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  return useContext(TeamContext);
}
