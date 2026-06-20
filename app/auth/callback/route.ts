import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/marketplace/supabase/server";

export const runtime = "nodejs";

// OAuth + email-confirmation callback. Google (and magic-link) redirect here
// with a ?code that we exchange for a real session, then send the user on.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/account";

  if (code) {
    const supabase = await getServerSupabase();
    if (supabase) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        return NextResponse.redirect(
          `${origin}/login?error=${encodeURIComponent("Sign-in failed. Please try again.")}`,
        );
      }
    }
  }

  // Only redirect to same-origin relative paths.
  const dest = next.startsWith("/") ? next : "/account";
  return NextResponse.redirect(`${origin}${dest}`);
}
