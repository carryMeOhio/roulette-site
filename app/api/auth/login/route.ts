import { cookies, headers } from "next/headers";
import { getIronSession } from "iron-session";
import { createHash, timingSafeEqual } from "node:crypto";
import { sessionOptions, type SessionData } from "@/lib/session";
import { isRateLimited, recordFailure, clearFailures } from "@/lib/rate-limit";

// Hashing both sides first gives equal-length buffers (required by
// timingSafeEqual) without leaking the password length.
function passwordsMatch(supplied: string, expected: string): boolean {
  const a = createHash("sha256").update(supplied).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const hdrs = await headers();
  const ip =
    hdrs.get("x-real-ip") ??
    hdrs.get("x-forwarded-for")?.split(",")[0].trim() ??
    "unknown";

  if (isRateLimited(ip)) {
    return Response.json(
      { error: "Забагато спроб. Спробуйте за 15 хвилин." },
      { status: 429 }
    );
  }

  const { password } = await request.json();
  const expected = process.env.ADMIN_PASSWORD;

  if (!expected || typeof password !== "string" || !passwordsMatch(password, expected)) {
    recordFailure(ip);
    return Response.json({ error: "Невірний пароль" }, { status: 401 });
  }

  clearFailures(ip);

  const session = await getIronSession<SessionData>(await cookies(), sessionOptions);
  session.isAdmin = true;
  await session.save();

  return Response.json({ ok: true });
}
