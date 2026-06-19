import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

// Preorder email capture. Mirrors the waitlist demo backend:
//   WAITLIST_STORAGE_MODE=local -> append to data/preorders.json
//   otherwise (demo)            -> accept but persist nothing
// Collects ONLY an email (no secrets). Swap persist() for a real store later.

export const runtime = "nodejs";

const STORAGE_MODE = process.env.WAITLIST_STORAGE_MODE ?? "demo";
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "preorders.json");

type Entry = { email: string; createdAt: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function persist(entry: Entry) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let existing: Entry[] = [];
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    existing = JSON.parse(raw) as Entry[];
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }
  // De-dupe by email (case-insensitive).
  const lower = entry.email.toLowerCase();
  if (!existing.some((e) => e.email.toLowerCase() === lower)) {
    existing.push(entry);
    await fs.writeFile(DATA_FILE, JSON.stringify(existing, null, 2), "utf8");
  }
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const email = String(body.email ?? "").trim();
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 422 },
    );
  }

  const entry: Entry = { email, createdAt: new Date().toISOString() };

  if (STORAGE_MODE === "local") {
    try {
      await persist(entry);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Could not save your preorder. Please try again." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, mode: STORAGE_MODE });
}
