import { scoreBadgeClass } from "@/lib/score";
import { fmtScore } from "@/lib/queries";
import { cn } from "@/lib/utils";

interface Props {
  score: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function ScoreBadge({ score, className, size = "md" }: Props) {
  const sizes = { sm: "text-xs px-1.5 py-0.5", md: "text-sm px-2 py-0.5", lg: "text-base px-3 py-1" };
  if (score === null)
    return (
      <span className={cn("text-muted-foreground text-sm", className)}>—</span>
    );
  return (
    <span
      className={cn(
        "inline-block rounded border font-mono font-semibold",
        sizes[size],
        scoreBadgeClass(score),
        className
      )}
    >
      {fmtScore(score)}
    </span>
  );
}
