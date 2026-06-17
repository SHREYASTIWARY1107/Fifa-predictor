"use client";

import { useEffect, useState } from "react";
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
import { toast } from "sonner";

interface PinGateProps {
  onVerified: () => void;
}

export function PinGate({ onVerified }: PinGateProps) {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const res = await fetch("/api/auth/check-pin");
        const data = await res.json();
        if (data.verified) {
          onVerified();
        } else {
          setOpen(true);
        }
      } catch {
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }

    check();
  }, [onVerified]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Invalid PIN");
        return;
      }

      setOpen(false);
      onVerified();
      toast.success("Welcome to the league!");
    } catch {
      toast.error("Could not verify PIN");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading...
      </div>
    );
  }

  return (
    <Dialog open={open}>
      <DialogContent showCloseButton={false} className="border-emerald-500/20">
        <DialogHeader>
          <DialogTitle className="text-xl">Enter League PIN</DialogTitle>
          <DialogDescription>
            Ask your friend group for the shared PIN to join predictions.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="pin">PIN</Label>
            <Input
              id="pin"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="4-6 digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              className="text-center text-2xl tracking-[0.4em]"
              autoFocus
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500"
            disabled={submitting || pin.length < 4}
          >
            {submitting ? "Checking..." : "Join League"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
