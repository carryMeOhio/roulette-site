import { cookies } from "next/headers";
import { getIronSession } from "iron-session";
import type { SessionData } from "@/lib/auth";
import { sessionOptions } from "@/lib/auth";

export async function POST() {
  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.destroy();
  return Response.json({ ok: true });
}
