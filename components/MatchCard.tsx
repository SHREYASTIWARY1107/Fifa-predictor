"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Match, Prediction } from "@/lib/types";
import { toast } from "sonner";
import { Lock, Radio } from "lucide-react";

interface MatchCardProps {
  match: Match;
  participantId: string;
  prediction?: Prediction;
  onSaved?: (prediction: Prediction) => void;
  showPoints?: boolean;
}

function TeamFlag({ flag, team }: { flag: string | null; team: string }) {
  if (flag) {
    return (
      <img
        src={flag}
        alt={team}
        className="h-8 w-8 rounded-full border border-border/50 object-cover"
      />
    );
  }

  return (
    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
      {team.slice(0, 3).toUpperCase()}
    </div>
  );
}

export function MatchCard({
  match,
  participantId,
  prediction,
  onSaved,
  showPoints = true,
}: MatchCardProps) {
  const [homePred, setHomePred] = useState(
    prediction ? String(prediction.home_pred) : ""
  );
  const [awayPred, setAwayPred] = useState(
    prediction ? String(prediction.away_pred) : ""
  );
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, []);

  const locked = useMemo(() => {
    if (match.status !== "upcoming") return true;
    return new Date(match.kickoff_at).getTime() <= now;
  }, [match.kickoff_at, match.status, now]);

  const countdown = useMemo(() => {
    if (locked) return null;
    return formatDistanceToNowStrict(new Date(match.kickoff_at), {
      addSuffix: true,
    });
  }, [locked, match.kickoff_at]);

  async function handleSave() {
    if (locked) return;

    const home = Number(homePred);
    const away = Number(awayPred);

    if (Number.isNaN(home) || Number.isNaN(away)) {
      toast.error("Enter valid scores");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/predictions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          participant_id: participantId,
          match_id: match.id,
          home_pred: home,
          away_pred: away,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not save");
        return;
      }

      onSaved?.(data.prediction);
      toast.success("Prediction saved");
    } catch {
      toast.error("Could not save prediction");
    } finally {
      setSaving(false);
    }
  }

  const statusBadge = () => {
    if (match.status === "live") {
      return (
        <Badge className="animate-pulse bg-red-500/20 text-red-300">
          <Radio className="mr-1 h-3 w-3" /> LIVE
        </Badge>
      );
    }
    if (match.status === "finished") {
      return <Badge variant="secondary">FT</Badge>;
    }
    if (locked) {
      return (
        <Badge variant="outline" className="text-muted-foreground">
          <Lock className="mr-1 h-3 w-3" /> Locked
        </Badge>
      );
    }
    return <Badge className="bg-emerald-500/20 text-emerald-300">Open</Badge>;
  };

  return (
    <Card className="overflow-hidden border-border/60 bg-card/80 backdrop-blur">
      <CardContent className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="text-xs text-muted-foreground">
            {match.round}
            {match.group_name ? ` · ${match.group_name}` : ""}
          </div>
          {statusBadge()}
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="flex flex-col items-center gap-2 text-center">
            <TeamFlag flag={match.flag1} team={match.team1} />
            <span className="text-sm font-semibold leading-tight">
              {match.team1}
            </span>
          </div>

          <div className="flex flex-col items-center gap-1">
            {match.status === "finished" || match.status === "live" ? (
              <div className="text-2xl font-bold tabular-nums">
                {match.home_score ?? "-"} : {match.away_score ?? "-"}
              </div>
            ) : locked && prediction ? (
              <div className="text-xl font-bold tabular-nums text-emerald-300">
                {prediction.home_pred} : {prediction.away_pred}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  inputMode="numeric"
                  className="h-10 w-12 text-center text-lg font-bold"
                  value={homePred}
                  onChange={(e) =>
                    setHomePred(e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  disabled={locked}
                />
                <span className="text-muted-foreground">:</span>
                <Input
                  inputMode="numeric"
                  className="h-10 w-12 text-center text-lg font-bold"
                  value={awayPred}
                  onChange={(e) =>
                    setAwayPred(e.target.value.replace(/\D/g, "").slice(0, 2))
                  }
                  disabled={locked}
                />
              </div>
            )}
            {countdown ? (
              <span className="text-[11px] text-emerald-400">
                Locks {countdown}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col items-center gap-2 text-center">
            <TeamFlag flag={match.flag2} team={match.team2} />
            <span className="text-sm font-semibold leading-tight">
              {match.team2}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{match.venue}</span>
          <span>
            {new Date(match.kickoff_at).toLocaleString(undefined, {
              weekday: "short",
              month: "short",
              day: "numeric",
              hour: "numeric",
              minute: "2-digit",
            })}
          </span>
        </div>

        {!locked && match.status === "upcoming" ? (
          <Button
            className="w-full bg-emerald-600 hover:bg-emerald-500"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? "Saving..." : prediction ? "Update Prediction" : "Save Prediction"}
          </Button>
        ) : null}

        {showPoints && match.status === "finished" && prediction ? (
          <div className="rounded-lg bg-muted/50 px-3 py-2 text-center text-sm">
            Your points:{" "}
            <span className="font-bold text-emerald-400">{prediction.points}</span>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
