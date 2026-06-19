import { describe, it, expect } from "vitest";
import {
  listWorkflows,
  listPlugins,
  listCreators,
  listReviews,
  getWorkflowBySlug,
  getPluginBySlug,
  getCreatorByHandle,
  listWorkflowsByOwner,
  listPluginsByOwner,
} from "@/lib/marketplace/data";
import { seedProfiles, seedWorkflows, seedPlugins } from "@/lib/marketplace/seed";

// These assert the read-path security invariant: public list/get functions must
// only ever expose public + approved content, and ownership scoping must hold.
// (The Supabase backend enforces the same rules again via RLS — see 0003_rls.sql.)
describe("marketplace read-path visibility invariant", () => {
  it("listWorkflows returns only public + approved workflows", async () => {
    const items = await listWorkflows();
    expect(items.length).toBeGreaterThan(0);
    for (const w of items) {
      expect(w.visibility).toBe("public");
      expect(w.moderation_status).toBe("approved");
    }
  });

  it("listPlugins returns only approved listings", async () => {
    const items = await listPlugins();
    expect(items.length).toBeGreaterThan(0);
    for (const p of items) {
      expect(p.moderation_status).toBe("approved");
    }
  });

  it("listCreators returns only public profiles", async () => {
    const items = await listCreators();
    for (const c of items) {
      expect(c.profile_visibility).toBe("public");
    }
  });

  it("get-by-slug / handle return null for unknown identifiers", async () => {
    expect(await getWorkflowBySlug("does-not-exist-xyz")).toBeNull();
    expect(await getPluginBySlug("does-not-exist-xyz")).toBeNull();
    expect(await getCreatorByHandle("nobody_xyz")).toBeNull();
  });

  it("owner-scoped lists only return that owner's content", async () => {
    const owner = seedProfiles[0];
    const wf = await listWorkflowsByOwner(owner.id);
    for (const w of wf) expect(w.owner_id).toBe(owner.id);
    const pl = await listPluginsByOwner(owner.id);
    for (const p of pl) expect(p.owner_id).toBe(owner.id);
  });

  it("listReviews only returns visible reviews", async () => {
    for (const wf of seedWorkflows) {
      const reviews = await listReviews("workflow", wf.id);
      for (const r of reviews) expect(r.moderation_status).toBe("visible");
    }
    for (const pl of seedPlugins) {
      const reviews = await listReviews("plugin", pl.id);
      for (const r of reviews) expect(r.moderation_status).toBe("visible");
    }
  });
});
