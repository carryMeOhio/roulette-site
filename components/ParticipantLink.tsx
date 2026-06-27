import Link from "next/link";
import { cn } from "@/lib/utils";

interface Props {
  id?: number | null;
  name: string;
  className?: string;
}

// Renders a participant's name as a link to their page. Falls back to plain
// text when no id is available (e.g. an album with no known submitter).
export function ParticipantLink({ id, name, className }: Props) {
  if (id == null) return <span className={className}>{name}</span>;
  return (
    <Link href={`/participants/${id}`} className={cn("hover:underline", className)}>
      {name}
    </Link>
  );
}
