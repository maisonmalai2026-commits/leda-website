"use client";

import { useEffect, useState } from "react";

import { USER_ROLES, type Role, type UserRole } from "@/lib/marketplace/types";

// ---------------------------------------------------------------------------
// useDemoIdentity — client hook that reads the non-httpOnly demo role cookie
// (DEMO_ROLE_COOKIE = "leda_demo_role") from document.cookie to decide the
// guest-vs-signed-in UX for the interactive action buttons.
//
// This is a presentational hint only: the server actions independently re-check
// the real session and will return ok:false for guests regardless of what the
// client believes. We intentionally do NOT import the server-only auth module
// here; we just duplicate the cookie name as a literal so this stays a pure
// client module.
// ---------------------------------------------------------------------------

/** Mirror of auth.DEMO_ROLE_COOKIE. Kept as a literal to avoid importing the
 * server-only auth module from a client component. */
export const DEMO_ROLE_COOKIE = "leda_demo_role";

function readRoleCookie(): Role {
  if (typeof document === "undefined") return "guest";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${DEMO_ROLE_COOKIE}=`));
  if (!match) return "guest";
  const raw = decodeURIComponent(match.slice(DEMO_ROLE_COOKIE.length + 1));
  return (USER_ROLES as readonly string[]).includes(raw)
    ? (raw as UserRole)
    : "guest";
}

export interface DemoIdentity {
  /** The current demo role, or "guest" when not signed in / unknown. */
  role: Role;
  /** True when the demo cookie holds a real (non-guest) role. */
  isSignedIn: boolean;
  /** True once the cookie has been read on the client (post-hydration). */
  ready: boolean;
}

/**
 * Reads the demo identity after mount. Returns guest during SSR/first paint so
 * server and client markup match, then updates once `document.cookie` is read.
 */
export function useDemoIdentity(): DemoIdentity {
  const [role, setRole] = useState<Role>("guest");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setRole(readRoleCookie());
    setReady(true);
  }, []);

  return {
    role,
    isSignedIn: role !== "guest",
    ready,
  };
}
