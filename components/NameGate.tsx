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
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/participants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name.trim() }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not create profile");
        return;
      }

      localStorage.setItem(PARTICIPANT_STORAGE_KEY, data.participant.id);
      setOpen(false);
      onReady(data.participant);
      toast.success(`You're in as ${data.participant.display_name}!`);
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
          <DialogTitle>Pick your display name</DialogTitle>
          <DialogDescription>
            This is how you&apos;ll appear on the leaderboard. Names are unique and
            can&apos;t be changed later.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
        </form>
      </DialogContent>
    </Dialog>
  );
}
