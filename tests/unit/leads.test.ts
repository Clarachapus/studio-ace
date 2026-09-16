import { describe, expect, it } from "vitest";
import { leadSchema } from "@/lib/leads/schema";
import { isRateLimited } from "@/lib/leads/rate-limit";

const base = { kind: "project", locale: "fr", name: "Ana", email: "ana@example.com", message: "Bonjour, un projet de maison.", consent: true };

describe("leadSchema", () => {
  it("accepts a minimal valid lead", () => expect(leadSchema.safeParse(base).success).toBe(true));
  it("rejects a filled honeypot", () => expect(leadSchema.safeParse({ ...base, website: "http://spam" }).success).toBe(false));
  it("rejects missing consent", () => expect(leadSchema.safeParse({ ...base, consent: false }).success).toBe(false));
  it("rejects a short message", () => expect(leadSchema.safeParse({ ...base, message: "hi" }).success).toBe(false));
});

describe("isRateLimited", () => {
  it("allows 5 then blocks the 6th", () => {
    const key = `k-${Math.random()}`;
    for (let i = 0; i < 5; i++) expect(isRateLimited(key, 5, 1000)).toBe(false);
    expect(isRateLimited(key, 5, 1000)).toBe(true);
  });
});
