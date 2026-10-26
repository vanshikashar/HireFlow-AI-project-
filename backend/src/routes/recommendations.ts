
import { Router } from "express";
import { z } from "zod";
import { Job } from "../models/Job.js";
import { JobPreference } from "../models/JobPreference.js";
import { requireAuth } from "../middleware/auth.js";
import { ApiError } from "../middleware/errors.js";
import { recommendJobs } from "../services/jobRecommendations.js";

const router = Router();

const preferenceSchema = z.object({
  skills: z.array(z.string().trim().min(1).max(60)).max(50).default([]),
  preferredLocations: z
    .array(z.string().trim().min(1).max(100))
    .max(20)
    .default([]),
  preferredWorkModes: z
    .array(z.enum(["Remote", "Hybrid", "On-site"]))
    .max(3)
    .default([]),
  preferredEmploymentTypes: z
    .array(z.enum(["Full-time", "Internship", "Contract"]))
    .max(3)
    .default([]),
  experienceLevel: z.string().trim().max(100).default(""),
}).strict();

router.use(requireAuth);

router.get("/preferences", async (req, res) => {
  const preferences = await JobPreference.findOne({
    userId: req.userId!,
  }).lean();

  res.json({
    preferences: preferences ?? {
      skills: [],
      preferredLocations: [],
      preferredWorkModes: [],
      preferredEmploymentTypes: [],
      experienceLevel: "",
    },
  });
});

router.put("/preferences", async (req, res) => {
  const input = preferenceSchema.parse(req.body);

  const preferences = await JobPreference.findOneAndUpdate(
    { userId: req.userId! },
    {
      $set: {
        skills: [...new Set(input.skills.map((value) => value.trim()))],
        preferredLocations: [
          ...new Set(input.preferredLocations.map((value) => value.trim())),
        ],
        preferredWorkModes: [...new Set(input.preferredWorkModes)],
        preferredEmploymentTypes: [...new Set(input.preferredEmploymentTypes)],
        experienceLevel: input.experienceLevel,
      },
    },
    {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    }
  ).lean();

  res.json({ preferences });
});

router.get("/", async (req, res) => {
  const preferences = await JobPreference.findOne({
    userId: req.userId!,
  }).lean();

  if (!preferences) {
    res.json({
      items: [],
      message: "Save your job preferences to get personalized recommendations.",
    });
    return;
  }

  const jobs = await Job.find({})
    .select("-__v")
    .sort({ postedAt: -1 })
    .limit(200)
    .lean();

  const items = recommendJobs(jobs, {
    skills: preferences.skills ?? [],
    preferredLocations: preferences.preferredLocations ?? [],
    preferredWorkModes: preferences.preferredWorkModes ?? [],
    preferredEmploymentTypes: preferences.preferredEmploymentTypes ?? [],
    experienceLevel: preferences.experienceLevel ?? "",
  });

  res.json({ items });
});

export default router;
