import { describe, expect, it } from "vitest";
import { projectSchema, sculptureSchema, slugSchema } from "@/lib/content/schemas";

const text = { title: "T", summary: "", description: "" };

describe("slugSchema", () => {
  it("accepts kebab-case", () => expect(slugSchema.safeParse("casa-arco-2").success).toBe(true));
  it("rejects uppercase, spaces, leading dash", () => {
    for (const bad of ["Casa", "casa arco", "-casa", "casa--arco", ""]) {
      expect(slugSchema.safeParse(bad).success).toBe(false);
    }
  });
});

describe("projectSchema", () => {
  const valid = { slug: "x", type: "residential", year: 2024, cover: "/media/projects/x/01.webp", fr: text, en: text };
  it("applies defaults", () => {
    const p = projectSchema.parse(valid);
    expect(p.gallery).toEqual([]);
    expect(p.featured).toBe(false);
    expect(p.surface).toBeNull();
  });
  it("rejects an image outside /media", () => {
    expect(projectSchema.safeParse({ ...valid, cover: "/etc/passwd" }).success).toBe(false);
  });
  it("rejects unknown type", () => {
    expect(projectSchema.safeParse({ ...valid, type: "castle" }).success).toBe(false);
  });
});

describe("sculptureSchema", () => {
  const valid = { slug: "x", year: 2024, status: "available", images: ["/media/sculptures/x/01.webp"], fr: text, en: text };
  it("requires at least one image", () => {
    expect(sculptureSchema.safeParse({ ...valid, images: [] }).success).toBe(false);
  });
  it("accepts null price (on request)", () => {
    expect(sculptureSchema.parse(valid).price).toBeNull();
  });
  it("rejects negative price", () => {
    expect(sculptureSchema.safeParse({ ...valid, price: -1 }).success).toBe(false);
  });
});
