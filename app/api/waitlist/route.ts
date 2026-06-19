import { NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";

// This route handler stores waitlist submissions. It is intentionally a simple
// placeholder backend for the MVP:
//
//   WAITLIST_STORAGE_MODE=local  -> append entries to data/waitlist.json
//   WAITLIST_STORAGE_MODE=demo   -> accept the submission but persist nothing
//
// No secrets are collected. Swap this for a real database/service later by
// replacing the persist() implementation.

export const runtime = "nodejs";

const STORAGE_MODE = process.env.WAITLIST_STORAGE_MODE ?? "demo";
const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "waitlist.json");

type Entry = {
  name: string;
  email: string;
  useCase: string;
  createdAt: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function persist(entry: Entry) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  let existing: Entry[] = [];
  try {
    const raw = await fs.readFile(DATA_FILE, "utf8");
    existing = JSON.parse(raw) as Entry[];
    if (!Array.isArray(existing)) existing = [];
  } catch {
    // File doesn't exist yet — start fresh.
    existing = [];
  }
  existing.push(entry);
  await fs.writeFile(DATA_FILE, JSON.stringify(existing, null, 2), "utf8");
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const name = String(body.name ?? "").trim();
  const email = String(body.email ?? "").trim();
  const useCase = String(body.useCase ?? "").trim();

  // Simple server-side validation.
  if (name.length < 2) {
    return NextResponse.json(
      { ok: false, error: "Please enter your name." },
      { status: 422 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please enter a valid email address." },
      { status: 422 },
    );
  }

  const entry: Entry = {
    name,
    email,
    useCase,
    createdAt: new Date().toISOString(),
  };

  if (STORAGE_MODE === "local") {
    try {
      await persist(entry);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Could not save your submission. Please try again." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true, mode: STORAGE_MODE });
}
