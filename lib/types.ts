export type MatchStage =
  | "group"
  | "r32"
  | "r16"
  | "qf"
  | "sf"
  | "third"
  | "final";

export type MatchStatus = "upcoming" | "live" | "finished";

export interface WcupMatch {
  id: number;
  round: string;
  group: string;
  team1: string;
  team2: string;
  flag1: string;
  flag2: string;
  status: string;
  score: [number, number] | null;
  live_minute: number | null;
  date: string;
  time: string;
  datetime: number;
  ground: string;
}

export interface Match {
  id: string;
  external_id: number;
  round: string;
  stage: MatchStage;
  group_name: string | null;
  team1: string;
  team2: string;
  flag1: string | null;
  flag2: string | null;
  venue: string | null;
  kickoff_at: string;
  status: MatchStatus;
  home_score: number | null;
  away_score: number | null;
  synced_at: string | null;
}

export interface Participant {
  id: string;
  display_name: string;
  avatar_color: string;
  created_at: string;
}

export interface Prediction {
  id: string;
  participant_id: string;
  match_id: string;
  home_pred: number;
  away_pred: number;
  points: number;
  created_at: string;
  updated_at: string;
}

export interface LeaderboardEntry {
  participant_id: string;
  display_name: string;
  avatar_color: string;
  total_points: number;
  exact_scores: number;
  predictions_made: number;
  rank: number;
}

export interface PredictionWithParticipant extends Prediction {
  participants: Pick<Participant, "display_name" | "avatar_color">;
}
