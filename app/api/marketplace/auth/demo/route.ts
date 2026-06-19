// ============================================================================
// DEMO-ONLY auth route.
//
// This handler exists solely so a local developer can explore role-gated pages
// without a real auth backend. It sets/clears the `leda_demo_role` cookie that
// lib/marketplace/auth.ts reads in demo mode. The cookie is intentionally NOT
// httpOnly so client UI can read the active demo role and reflect it.
//
// IMPORTANT: this is inert/insecure impersonation for local exploration only.
// It must be disabled (and is naturally bypassed) once real Supabase auth is on
// — getSessionUser() ignores the demo cookie whenever Supabase is configured.
// ============================================================================

import { NextResponse, type NextRequest } from "next/server";

import { DEMO_ROLE_COOKIE } from "@/lib/marketplace/auth";
import { USER_ROLES, type ActionResult, type UserRole } from "@/lib/marketplace/types";

export const runtime = "nodejs";

/** 7 days, in seconds. */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (USER_ROLES as readonly string[]).includes(value);
}

function jsonResult(result: ActionResult, status = 200): NextResponse {
  return NextResponse.json(result, { status });
}

/** Builds a response that clears the demo role cookie. */
function clearedResponse(message: string): NextResponse {
  const res = jsonResult({ ok: true, demo: true, message });
  res.cookies.set({
    name: DEMO_ROLE_COOKIE,
    value: "",
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return res;
}

/**
 * POST { role } — sets the demo role cookie. role "guest" clears it. Any other
 * value is rejected.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResult(
      { ok: false, demo: true, error: "Invalid JSON body." },
      400,
    );
  }

  const role = (body as { role?: unknown } | null)?.role;

  if (role === "guest") {
    return clearedResponse("Signed out of demo session.");
  }

  if (!isUserRole(role)) {
    return jsonResult(
      {
        ok: false,
        demo: true,
        error: `Invalid role. Expected one of: guest, ${USER_ROLES.join(", ")}.`,
      },
      400,
    );
  }

  const res = jsonResult({
    ok: true,
    demo: true,
    message: `Demo role set to "${role}".`,
  });
  res.cookies.set({
    name: DEMO_ROLE_COOKIE,
    value: role,
    httpOnly: false,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return res;
}

/** DELETE — clears the demo role cookie (sign out of the demo session). */
export async function DELETE(): Promise<NextResponse> {
  return clearedResponse("Signed out of demo session.");
}
