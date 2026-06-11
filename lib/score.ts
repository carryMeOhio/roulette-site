export function scoreColorClass(score: number): string {
  if (score >= 8) return "text-emerald-600 font-semibold";
  if (score >= 7) return "text-lime-600 font-semibold";
  if (score >= 6) return "text-yellow-600";
  if (score >= 5) return "text-orange-500";
  return "text-red-500";
}

export function scoreBadgeClass(score: number): string {
  if (score >= 8) return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (score >= 7) return "bg-lime-100 text-lime-800 border-lime-200";
  if (score >= 6) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  if (score >= 5) return "bg-orange-100 text-orange-800 border-orange-200";
  return "bg-red-100 text-red-800 border-red-200";
}
