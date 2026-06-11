// Shared between lib/auth.ts (Node runtime) and proxy.ts (edge runtime) —
// keep this module free of imports like next/headers or prisma.

export interface SessionData {
  isAdmin?: boolean;
}

export const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "roulette-admin",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};
