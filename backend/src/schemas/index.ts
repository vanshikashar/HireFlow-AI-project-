import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(254),
  password: z.string().min(12).max(128)
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(254),
  password: z.string().min(1).max(128)
});

export const jobQuerySchema = z.object({
  search: z.string().trim().max(100).optional(),
  location: z.string().trim().max(100).optional(),
  workMode: z.enum(["Remote", "Hybrid", "On-site"]).optional(),
  employmentType: z.enum(["Full-time", "Internship", "Contract"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
  sort: z.enum(["newest", "salaryAsc", "salaryDesc"]).default("newest")
});

export const createApplicationSchema = z.object({
  jobId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid job ID"),
  notes: z.string().trim().max(2000).optional()
});

export const updateApplicationSchema = z.object({
  status: z.enum([
    "Applied",
    "Shortlisted",
    "Interview",
    "Offer",
    "Rejected"
  ]).optional(),
  notes: z.string().trim().max(2000).optional()
}).refine(
  (data) => data.status !== undefined || data.notes !== undefined,
  "Provide at least one field to update"
);

export const resumeSchema = z.object({
  jobId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid job ID"),
  resumeText: z.string().trim().min(30).max(20000)
});