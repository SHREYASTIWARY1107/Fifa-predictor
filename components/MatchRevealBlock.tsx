"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Match } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MatchSummaryHeader } from "@/components/MatchSummaryHeader";
import { burstExactScore } from "@/lib/confetti";
import type { PredictionRow } from "@/components/MatchResults";
import { Play } from "lucide-react";

type RevealStep = "idle" | "score" | "yours" | "others" | "done";

function usePrefersReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

function PickRow({
  prediction,
  participantId,
  showPoints,
  visible,
  flashClass,
}: {
  prediction: PredictionRow;
  participantId?: string;
  showPoints: boolean;
  visible: boolean;
  flashClass?: string;
}) {
  if (!visible) return null;

  return (
    <div
      className={`flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm reveal-card-in ${flashClass ?? ""}`}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-bold text-white"
          style={{ backgroundColor: prediction.participants?.avatar_color ?? "#666" }}
        >
          {(prediction.participants?.display_name ?? "?").slice(0, 2).toUpperCase()}
        </span>
        <span className="font-medium">
          {prediction.participants?.display_name ?? "Unknown"}
          {prediction.participant_id === participantId ? (
            <span className="ml-2 text-[10px] text-emerald-400">YOU</span>
          ) : null}
        </span>
      </div>
      <div className="flex items-center gap-3 tabular-nums">
        <span>
          {prediction.home_pred} - {prediction.away_pred}
        </span>
        {showPoints ? (
          <span className="font-bold text-emerald-400">{prediction.points} pts</span>
        ) : null}
      </div>
    </div>
  );
}

export function MatchRevealBlock({
  match,
  predictions,
  participantId,
  autoReveal = false,
}: {
  match: Match;
  predictions: PredictionRow[];
  participantId?: string;
  autoReveal?: boolean;
}) {
  const reducedMotion = usePrefersReducedMotion();
  const [step, setStep] = useState<RevealStep>("idle");
  const [revealedOthers, setRevealedOthers] = useState(0);
  const [started, setStarted] = useState(false);
  const rowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const mine = predictions.find((p) => p.participant_id === participantId);
  const others = predictions.filter((p) => p.participant_id !== participantId);

  const showAll = reducedMotion && started;

  const startReveal = useCallback(() => {
    setStarted(true);
    if (reducedMotion) {
      setStep("done");
      setRevealedOthers(others.length);
      return;
    }
    setStep("score");
    setRevealedOthers(0);
  }, [reducedMotion, others.length]);

  useEffect(() => {
    if (autoReveal && !started) {
      startReveal();
    }
  }, [autoReveal, started, startReveal]);

  useEffect(() => {
    if (!started || reducedMotion || step === "idle" || step === "done") return;

    if (step === "score") {
      const t = setTimeout(() => setStep("yours"), 900);
      return () => clearTimeout(t);
    }

    if (step === "yours") {
      const t = setTimeout(() => setStep("others"), mine ? 600 : 200);
      return () => clearTimeout(t);
    }

    if (step === "others") {
      if (revealedOthers >= others.length) {
        const t = setTimeout(() => setStep("done"), 400);
        return () => clearTimeout(t);
      }

      const t = setTimeout(() => {
        const next = others[revealedOthers];
        if (next?.points === 3) {
          const el = rowRefs.current.get(next.id);
          if (el) {
            const rect = el.getBoundingClientRect();
            burstExactScore({
              x: (rect.left + rect.width / 2) / window.innerWidth,
              y: (rect.top + rect.height / 2) / window.innerHeight,
            });
          } else {
            burstExactScore();
          }
        }
        setRevealedOthers((n) => n + 1);
      }, 320);

      return () => clearTimeout(t);
    }
  }, [step, started, reducedMotion, revealedOthers, others, mine]);

  useEffect(() => {
    if (!started || reducedMotion || step !== "yours" || !mine) return;
    if (mine.points === 3) {
      const t = setTimeout(() => burstExactScore({ x: 0.5, y: 0.45 }), 200);
      return () => clearTimeout(t);
    }
  }, [step, started, reducedMotion, mine]);

  const scoreVisible = showAll || step !== "idle";
  const yoursVisible = showAll || step === "yours" || step === "others" || step === "done";
  const othersVisible = showAll || step === "others" || step === "done";

  function flashForPoints(points: number) {
    if (points === 3) return "reveal-flash-exact";
    if (points === 1) return "reveal-flash-win";
    return "reveal-flash-miss";
  }

  return (
    <div className="space-y-3">
      {!started ? (
        <Card className="border-border/60 bg-card/80">
          <CardContent className="space-y-3 p-4">
            <MatchSummaryHeader match={match} />
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-emerald-500/30 text-emerald-300"
              onClick={startReveal}
            >
              <Play className="h-4 w-4" />
              Show reveal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className={scoreVisible ? "reveal-score-slam" : "opacity-0"}>
            <Card className="overflow-hidden border-emerald-500/30 bg-gradient-to-b from-emerald-950/40 to-card/90">
              <CardContent className="space-y-2 p-4 text-center">
                <p className="text-xs font-bold uppercase tracking-[0.35em] text-emerald-400">
                  Full time
                </p>
                <p className="text-sm text-muted-foreground">
                  Let&apos;s see who called it.
                </p>
                <MatchSummaryHeader match={match} />
              </CardContent>
            </Card>
          </div>

          {participantId ? (
            <div
              className={`rounded-lg border border-border/40 bg-muted/20 px-3 py-2 text-sm ${
                yoursVisible ? "reveal-card-in" : "hidden"
              }`}
            >
              <span className="text-xs font-medium uppercase tracking-wide text-emerald-400">
                Your pick
              </span>
              {mine ? (
                <div
                  className={`mt-1 flex items-center justify-between tabular-nums ${flashForPoints(mine.points)}`}
                >
                  <span className="font-semibold">
                    {mine.home_pred} - {mine.away_pred}
                  </span>
                  <span className="font-bold text-emerald-400">{mine.points} pts</span>
                </div>
              ) : (
                <p className="mt-1 text-muted-foreground">You didn&apos;t predict this match</p>
              )}
            </div>
          ) : null}

          <Card className="border-border/60 bg-card/60">
            <CardContent className="space-y-2 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Everyone&apos;s predictions
              </p>
              {predictions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No predictions yet</p>
              ) : others.length === 0 && !mine ? (
                <p className="text-sm text-muted-foreground">No predictions yet</p>
              ) : (
                others.map((p, index) => (
                  <div
                    key={p.id}
                    ref={(el) => {
                      if (el) rowRefs.current.set(p.id, el);
                    }}
                  >
                    <PickRow
                      prediction={p}
                      participantId={participantId}
                      showPoints
                      visible={othersVisible && (showAll || index < revealedOthers)}
                      flashClass={flashForPoints(p.points)}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
