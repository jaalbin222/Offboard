import type { Difficulty } from "./types";

export const DIFFICULTY_ORDER: Difficulty[] = [
  "easy",
  "medium",
  "limited",
  "hard",
  "impossible",
];

export const DIFFICULTY_META: Record<
  Difficulty,
  { label: string; summary: string; group: string }
> = {
  easy: {
    label: "Easy",
    summary: "A delete button, usually done in one sitting.",
    group: "Easy to delete",
  },
  medium: {
    label: "Medium",
    summary: "Extra steps, a wait, or a subscription to cancel.",
    group: "Takes a few steps",
  },
  limited: {
    label: "Limited",
    summary: "Only some of the data can be removed.",
    group: "Partial deletion only",
  },
  hard: {
    label: "Hard",
    summary: "Support tickets, ID checks, or a long wait.",
    group: "Hard to delete",
  },
  impossible: {
    label: "Impossible",
    summary: "No deletion path. Lock the account instead.",
    group: "Cannot be deleted. Lock them",
  },
};

export function isDifficulty(value: string): value is Difficulty {
  return DIFFICULTY_ORDER.includes(value as Difficulty);
}
