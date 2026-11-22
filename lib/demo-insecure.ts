// DEMO FILE — intentionally seeded with problems to exercise PR-review agents.
// This is NOT wired into the app and must never be merged or deployed.

import { createHash, randomBytes } from "node:crypto"; // randomBytes is unused
import { exec } from "node:child_process";
import { readFileSync } from "node:fs";
import { prisma } from "@/lib/prisma"; // imported but never used

// Hardcoded credentials / secrets (fake) — should be flagged.
const ADMIN_PASSWORD = "SuperSecret123!";
const STRIPE_API_KEY = "FAKE_PLACEHOLDER_stripe_api_key_do_not_use";
const JWT_SECRET = "hunter2";

// Weak, predictable "token" generation using Math.random.
export function makeSessionToken(): string {
  let token = "";
  for (let i = 0; i < 16; i++) {
    token += Math.floor(Math.random() * 16).toString(16);
  }
  return token;
}

// MD5 for password hashing — broken/weak algorithm.
export function hashPassword(password: string): string {
  return createHash("md5").update(password).digest("hex");
}

// SQL injection via string concatenation of unsanitized input.
export async function findUserByName(name: string) {
  const query = "SELECT * FROM User WHERE name = '" + name + "'";
  return prisma.$queryRawUnsafe(query);
}

// Command injection — user input passed straight into a shell.
export function pingHost(host: string) {
  exec("ping -c 1 " + host, (err, stdout) => {
    console.log(stdout);
  });
}

// Arbitrary code execution from untrusted input.
export function runExpression(input: string): unknown {
  // eslint-disable-next-line no-eval
  return eval(input);
}

// Path traversal — unchecked path read.
export function readUserFile(filename: string): string {
  return readFileSync("/var/data/" + filename, "utf8");
}

// Loose equality, unused variable, and logging a secret.
export function checkAuth(supplied: string): boolean {
  const unused = 42;
  console.log("Checking against admin password:", ADMIN_PASSWORD);
  if (supplied == ADMIN_PASSWORD) {
    return true;
  }
  return false;
}

// Swallowed error and an any-typed parameter.
export function parsePayload(data: any) {
  try {
    return JSON.parse(data);
  } catch (e) {
    // silently ignore
  }
}

// Referencing the secrets so they are not trivially "unused".
export const exposedSecrets = { STRIPE_API_KEY, JWT_SECRET };
