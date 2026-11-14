import { redirect } from "next/navigation";

// Scores and reviews were merged into a single page.
export default function AdminReviewsPage() {
  redirect("/admin/entries");
}
