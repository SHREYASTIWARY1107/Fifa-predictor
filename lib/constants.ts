export const WCUP_API_URL = "https://wcup2026.org/api/data.php?action=all";

export const AVATAR_COLORS = [
  "#22c55e",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
  "#6366f1",
  "#84cc16",
];

export const PIN_COOKIE = "fifa_pin_verified";
export const PARTICIPANT_STORAGE_KEY = "fifa_participant_id";

export const STAGE_LABELS: Record<string, string> = {
  group: "Group Stage",
  r32: "Round of 32",
  r16: "Round of 16",
  qf: "Quarter-finals",
  sf: "Semi-finals",
  third: "3rd Place",
  final: "Final",
};

export const STAGE_ORDER = [
  "group",
  "r32",
  "r16",
  "qf",
  "sf",
  "third",
  "final",
] as const;
