import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";
import { sessionOptions, type SessionData } from "./session";

export { sessionOptions, type SessionData };

async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function requireAdmin(): Promise<void> {
  const session = await getSession();
  if (!session.isAdmin) {
    throw new Error("Unauthorized");
  }
}
