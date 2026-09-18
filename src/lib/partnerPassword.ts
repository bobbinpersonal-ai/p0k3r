// The password rules, and nothing else.
//
// Split out of partnerAuth.ts because the signup and claim forms need to know
// the minimum length, and partnerAuth imports Prisma and node:crypto. A client
// component importing it pulled the whole database client into the browser
// bundle — 150kB of code that cannot run there, shipped to every partner on a
// phone. Nothing in this file touches the server, so it is safe on both sides.

/** The shortest password we'll accept. Length beats character classes. */
export const MIN_PASSWORD_LENGTH = 10;

/**
 * Passwords that are long enough and still worthless. Not a blocklist of any
 * size — just the handful somebody in a hurry actually types.
 */
const OBVIOUS = new Set([
  "password12",
  "password123",
  "1234567890",
  "12345678901",
  "qwertyuiop",
  "letmein123",
  "iloveyou12",
  "aaaaaaaaaa",
]);

export type PasswordProblem = string | null;

/**
 * Why this password can't be used, or null if it can.
 *
 * `context` is the strings that are obvious guesses for this particular
 * account — their business name, the local part of their email.
 */
export function checkPassword(password: string, context: string[] = []): PasswordProblem {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Make it at least ${MIN_PASSWORD_LENGTH} characters. Length matters more than symbols.`;
  }
  if (password.length > 200) return "That's longer than we can store. Trim it a bit.";

  const lower = password.toLowerCase();
  if (OBVIOUS.has(lower)) return "That's one of the first passwords anybody guesses. Pick another.";
  if (/^(.)\1+$/.test(password)) return "That's the same character repeated. Pick another.";

  // Each hint is checked whole and word by word. Comparing only the whole
  // string lets "alpine-solar-2026" through for Alpine Solar, which is the
  // password that business owner was always going to pick.
  const stripped = lower.replace(/[^a-z0-9]/g, "");
  for (const hint of context) {
    for (const word of hintWords(hint)) {
      if (lower.includes(word) || stripped.includes(word)) {
        return "Don't use your business name or email in the password.";
      }
    }
  }
  return null;
}

/**
 * A hint broken into the pieces worth banning: the whole thing, and any word
 * of four characters or more.
 *
 * Four rather than three keeps "LLC", "Inc" and "and" out of it — banning
 * those would reject a lot of perfectly good passwords for no gain.
 */
function hintWords(hint: string): string[] {
  const clean = hint.trim().toLowerCase();
  if (!clean) return [];
  const out = new Set<string>();
  if (clean.length >= 4) out.add(clean);
  for (const word of clean.split(/[^a-z0-9]+/)) {
    if (word.length >= 4) out.add(word);
  }
  return [...out];
}
