import { z } from "zod";

export const leadKinds = ["project", "sculpture"] as const;
export const projectTypeOptions = ["residential", "public", "interior", "landscape", "sculpture", "other"] as const;
export const budgetOptions = ["unknown", "lt50", "50to200", "200to500", "gt500"] as const;

export const leadSchema = z.object({
  kind: z.enum(leadKinds),
  locale: z.enum(["fr", "en"]),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).optional().default(""),
  projectType: z.enum(projectTypeOptions).optional(),
  location: z.string().trim().max(160).optional().default(""),
  budget: z.enum(budgetOptions).optional(),
  piece: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().min(10).max(4000),
  consent: z.literal(true),
  /** Honeypot: must stay empty. Bots fill it. */
  website: z.string().max(0).optional().default(""),
  turnstileToken: z.string().optional().default(""),
});

export type LeadInput = z.input<typeof leadSchema>;
export type Lead = z.output<typeof leadSchema>;
