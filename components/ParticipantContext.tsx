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

export function ParticipantProvider({ children }: { children: React.ReactNode }) {
  const [participant, setParticipantState] = useState<ParticipantState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const stored = localStorage.getItem(PARTICIPANT_STORAGE_KEY);
      if (!stored) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/participants/${stored}`);
        if (res.ok) {
          const data = await res.json();
          setParticipantState(data.participant);
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
