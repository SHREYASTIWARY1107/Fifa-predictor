"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { PARTICIPANT_STORAGE_KEY } from "@/lib/constants";

interface ParticipantState {
  id: string;
  display_name: string;
  avatar_color: string;
}

interface ParticipantContextValue {
  participant: ParticipantState | null;
  setParticipant: (participant: ParticipantState) => void;
  loading: boolean;
}

const ParticipantContext = createContext<ParticipantContextValue | null>(null);

async function fetchParticipantById(id: string): Promise<ParticipantState | null> {
  const res = await fetch(`/api/participants/${id}`);
  if (!res.ok) return null;
  const data = await res.json();
  return data.participant ?? null;
}

export function ParticipantProvider({ children }: { children: React.ReactNode }) {
  const [participant, setParticipantState] = useState<ParticipantState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const meRes = await fetch("/api/participants/me");
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.participant) {
            localStorage.setItem(PARTICIPANT_STORAGE_KEY, meData.participant.id);
            setParticipantState(meData.participant);
            return;
          }
        }

        const stored = localStorage.getItem(PARTICIPANT_STORAGE_KEY);
        if (!stored) return;

        const loaded = await fetchParticipantById(stored);
        if (loaded) {
          setParticipantState(loaded);
        } else {
          localStorage.removeItem(PARTICIPANT_STORAGE_KEY);
        }
      } catch {
        localStorage.removeItem(PARTICIPANT_STORAGE_KEY);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  const setParticipant = useCallback((value: ParticipantState) => {
    localStorage.setItem(PARTICIPANT_STORAGE_KEY, value.id);
    setParticipantState(value);
  }, []);

  return (
    <ParticipantContext.Provider value={{ participant, setParticipant, loading }}>
      {children}
    </ParticipantContext.Provider>
  );
}

export function useParticipant() {
  const context = useContext(ParticipantContext);
  if (!context) {
    throw new Error("useParticipant must be used within ParticipantProvider");
  }
  return context;
}
