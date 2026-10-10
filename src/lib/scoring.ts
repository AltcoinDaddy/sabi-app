export type Prediction = "home" | "draw" | "away";

/**
 * Standard Sabi scoring — points are locked in the moment a pick is made
 * (prototype rule; post-match settlement with -5 for wrong picks comes later).
 */
export const POINTS_FOR_PICK: Record<Prediction, number> = {
  home: 10,
  draw: 12,
  away: 15,
};

export const WRONG_PICK_POINTS = -5;

export function pointsForPrediction(p: Prediction): number {
  return POINTS_FOR_PICK[p] ?? 0;
}

export function formatPoints(n: number): string {
  return `${n > 0 ? "+" : ""}${n}`;
}

export const SCORING_LEGEND: { label: string; points: string; hint: string }[] = [
  { label: "Home", points: "+10 PTS", hint: "Favourite wins" },
  { label: "Draw", points: "+12 PTS", hint: "Stalemate call" },
  { label: "Away", points: "+15 PTS", hint: "Underdog call" },
];
