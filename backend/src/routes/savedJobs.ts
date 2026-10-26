
import { Router } from "express";
import mongoose from "mongoose";
import { SavedJob } from "../models/SavedJob.js";
import { Job } from "../models/Job.js";
import { ApiError } from "../middleware/errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// Every saved-jobs endpoint requires an authenticated user.
router.use(requireAuth);

// Get the current user's saved jobs.
router.get("/", async (req, res) => {
  const items = await SavedJob.find({ userId: req.userId })
    .populate("jobId")
    .sort({ createdAt: -1 })
    .lean();

  res.json({ items });
});

// Save a job.
router.post("/", async (req, res) => {
  const { jobId } = req.body ?? {};

  if (typeof jobId !== "string" || !mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "A valid job ID is required");
  }

  const jobExists = await Job.exists({ _id: jobId });

  if (!jobExists) {
    throw new ApiError(404, "Job not found");
  }

  const savedJob = await SavedJob.create({
    userId: req.userId,
    jobId,
  });

  res.status(201).json({ savedJob });
});

// Remove a job from the current user's saved list.
router.delete("/:jobId", async (req, res) => {
  const { jobId } = req.params;

  if (!mongoose.isValidObjectId(jobId)) {
    throw new ApiError(400, "Invalid job ID");
  }

  const savedJob = await SavedJob.findOneAndDelete({
    userId: req.userId,
    jobId,
  });

  if (!savedJob) {
    throw new ApiError(404, "Saved job not found");
  }

  res.status(204).end();
});

export default router;
