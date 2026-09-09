// Push the Prisma schema to the database, without the ability to hang forever.
//
// This exists because `prisma db push` in the build command took the whole
// site down. The deploy that broke it was the first in a while to actually
// alter a table; every deploy before that found the schema already in sync and
// exited in milliseconds. A real `ALTER TABLE` behaves differently: if any
// other connection holds a conflicting lock on the table — an idle-in-
// transaction serverless function, a pooler holding a session open — Postgres
// waits for that lock with no timeout and no output. The build log stops dead
// after Prisma prints the datasource line and the deploy eventually dies of
// old age, with nothing anywhere saying why.
//
// Three guards, each closing off one way that happens:
//
//   1. DDL goes to the DIRECT host, never the pooler. Neon's pooled endpoint
//      (…-pooler.…) runs PgBouncer in transaction mode, which is fine for
//      queries and unreliable for schema changes. `directUrl` in schema.prisma
//      is meant to be the unpooled one, but nothing enforces that the env var
//      actually holds an unpooled URL — so normalize it here rather than trust it.
//   2. lock_timeout / statement_timeout, so a blocked ALTER fails in seconds
//      with a real Postgres error instead of waiting out the build.
//   3. A wall-clock kill, in case something hangs before Postgres is even
//      reached (DNS, TLS, a suspended compute that never wakes).
//
// Set ALLOW_PARTIAL_DEPLOY=1 to let the build continue when the push fails.
// That ships the marketing site with a stale schema — every static page works,
// anything touching a new column 500s — which is worth it when the alternative
// is no deploy at all, and is why it's opt-in rather than the default.

import { spawn } from "node:child_process";

const TIMEOUT_MS = 120_000;
const LOCK_TIMEOUT = "15s";
const STATEMENT_TIMEOUT = "90s";

const raw = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!raw) {
  console.error("[db-push] Neither DATABASE_URL_UNPOOLED nor DATABASE_URL is set.");
  process.exit(1);
}

/**
 * The direct-connection form of a Neon URL, with timeouts attached.
 *
 * Neon names the two endpoints for the same database `ep-x-y-123.region…` and
 * `ep-x-y-123-pooler.region…`. Only the first can be trusted with DDL. Any
 * other provider's host is left alone — the `-pooler` suffix is Neon's
 * convention, not a general one.
 */
function directUrl(input) {
  let url;
  try {
    url = new URL(input);
  } catch {
    console.error("[db-push] Connection string is not a valid URL.");
    process.exit(1);
  }

  const pooled = url.hostname.includes("-pooler.");
  if (pooled) url.hostname = url.hostname.replace("-pooler.", ".");

  // PgBouncer-oriented flags are meaningless (and unhelpful) on a direct link.
  url.searchParams.delete("pgbouncer");
  url.searchParams.delete("connection_limit");

  url.searchParams.set("connect_timeout", "15");
  // Server-side ceilings. `options` is passed through to the backend, so a
  // lock we can't get surfaces as "canceling statement due to lock timeout"
  // rather than as silence.
  url.searchParams.set(
    "options",
    `-c lock_timeout=${LOCK_TIMEOUT} -c statement_timeout=${STATEMENT_TIMEOUT}`,
  );

  return { url: url.toString(), pooled, host: url.hostname };
}

const { url, pooled, host } = directUrl(raw);

console.log(`[db-push] host: ${host}`);
if (pooled) {
  console.log("[db-push] source URL was the pooled endpoint; using the direct one for DDL.");
}
console.log(`[db-push] lock_timeout=${LOCK_TIMEOUT} statement_timeout=${STATEMENT_TIMEOUT} wall=${TIMEOUT_MS / 1000}s`);

const child = spawn(
  "npx",
  ["prisma", "db", "push", "--accept-data-loss", "--skip-generate"],
  {
    stdio: "inherit",
    env: {
      ...process.env,
      // Both, because schema.prisma reads `url` from one and `directUrl` from
      // the other, and this command should use the direct link for each.
      DATABASE_URL: url,
      DATABASE_URL_UNPOOLED: url,
    },
  },
);

let timedOut = false;
const timer = setTimeout(() => {
  timedOut = true;
  console.error(`\n[db-push] No response after ${TIMEOUT_MS / 1000}s — killing it.`);
  child.kill("SIGKILL");
}, TIMEOUT_MS);

child.on("exit", (code) => {
  clearTimeout(timer);

  if (code === 0 && !timedOut) {
    console.log("[db-push] Schema is in sync.");
    process.exit(0);
  }

  console.error(
    timedOut
      ? "\n[db-push] FAILED: the push never returned. Most likely an ALTER TABLE " +
          "blocked on a lock held by another connection."
      : `\n[db-push] FAILED: prisma db push exited ${code}.`,
  );

  if (process.env.ALLOW_PARTIAL_DEPLOY === "1") {
    console.error("[db-push] ALLOW_PARTIAL_DEPLOY=1 — continuing with a stale schema.");
    process.exit(0);
  }

  console.error("[db-push] Set ALLOW_PARTIAL_DEPLOY=1 to deploy anyway without the schema change.");
  process.exit(1);
});
