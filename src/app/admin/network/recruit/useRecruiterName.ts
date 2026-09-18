"use client";

import { useSyncExternalStore } from "react";

// Who is doing the calling.
//
// Lives in the browser rather than on a row because it is a property of the
// person at the keyboard, not of the business: two people working this queue
// from different machines each want their own name in the script and in the
// text they send. A column would make it one shared value and get it wrong for
// whoever logged in second.
//
// A module-level store rather than per-component state, because the name is
// typed in one component (the script) and read in another (every prospect's
// follow-up text). With independent useState the first version of this shipped
// a script that correctly said "it's Dana from LoveMeAfter" next to a text
// message that still said "— from LoveMeAfter", which is precisely the sort of
// thing nobody notices until a contractor gets it.
//
// Every storage access is wrapped: it throws outright in some private-browsing
// modes, and the desk has to keep working when it does.

const NAME_KEY = "lma_recruiter_name";

let current = "";
let hydrated = false;
const listeners = new Set<() => void>();

function read(): string {
  if (!hydrated) {
    hydrated = true;
    try {
      current = window.localStorage.getItem(NAME_KEY) ?? "";
    } catch {
      current = "";
    }
  }
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setRecruiterName(value: string): void {
  current = value;
  hydrated = true;
  try {
    window.localStorage.setItem(NAME_KEY, value);
  } catch {
    /* no storage — it still holds for this session */
  }
  listeners.forEach((l) => l());
}

export function useRecruiterName(): [string, (value: string) => void] {
  // The server has no name to render, so the snapshot there is empty and the
  // first client render matches it before localStorage is consulted.
  const name = useSyncExternalStore(subscribe, read, () => "");
  return [name, setRecruiterName];
}
