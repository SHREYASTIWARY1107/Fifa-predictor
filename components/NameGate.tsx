"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PARTICIPANT_STORAGE_KEY } from "@/lib/constants";
import type { Participant } from "@/lib/types";
import { toast } from "sonner";

interface NameGateProps {
  onReady: (participant: Participant) => void;
}

export function NameGate({ onReady }: NameGateProps) {
  const [open, setOpen] = useState(true);
  const [mode, setMode] = useState<"new" | "reclaim">("new");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  function saveParticipant(participant: Participant) {
    localStorage.setItem(PARTICIPANT_STORAGE_KEY, participant.id);
    setOpen(false);
    onReady(participant);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name.trim() }),
      });

      const data = await res.json();
      if (res.status === 409) {
        setMode("reclaim");
        toast.message("Name taken — enter your reclaim password to continue on this device");
        return;
      }
      if (!res.ok) {
        toast.error(data.error ?? "Could not create profile");
        return;
      }

      saveParticipant(data.participant);
      toast.success(`You're in as ${data.participant.display_name}!`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleReclaim(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/participants/reclaim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not reclaim account");
        return;
      }

      saveParticipant(data.participant);
      toast.success(`Welcome back, ${data.participant.display_name}!`);
    } catch {
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {mode === "reclaim" ? "Reclaim your account" : "Pick your display name"}
          </DialogTitle>
          <DialogDescription>
            {mode === "reclaim"
              ? "Enter the reclaim password to load your picks on this device."
              : "This is how you'll appear on the leaderboard. Names are unique."}
          </DialogDescription>
        </DialogHeader>

        {mode === "new" ? (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input
                id="name"
                maxLength={20}
                placeholder="e.g. Shreyas"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500"
              disabled={loading || name.trim().length < 2}
            >
              {loading ? "Saving..." : "Start Predicting"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setMode("reclaim")}
            >
              Already joined on another phone?
            </button>
          </form>
        ) : (
          <form onSubmit={handleReclaim} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reclaim-name">Display name</Label>
              <Input
                id="reclaim-name"
                maxLength={20}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reclaim-password">Reclaim password</Label>
              <Input
                id="reclaim-password"
                type="password"
                inputMode="numeric"
                placeholder="Default: 12345678"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500"
              disabled={loading || name.trim().length < 2 || password.length < 4}
            >
              {loading ? "Checking..." : "Load My Account"}
            </Button>
            <button
              type="button"
              className="w-full text-center text-sm text-muted-foreground underline-offset-4 hover:underline"
              onClick={() => setMode("new")}
            >
              New player? Pick a name
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
