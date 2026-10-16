import { DIFFICULTY_META } from "@/lib/labels";
import type { Difficulty } from "@/lib/types";

const STYLES: Record<Difficulty, string> = {
  easy: "bg-mist text-pine",
  medium: "bg-gold-soft text-gold",
  limited: "bg-sea-soft text-sea",
  hard: "bg-sienna-soft text-sienna",
  impossible: "bg-stone-soft text-stone",
};

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-[0.14em] uppercase ${STYLES[difficulty]}`}
    >
      {DIFFICULTY_META[difficulty].label}
    </span>
  );
}
