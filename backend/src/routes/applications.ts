import { Router } from "express";
import mongoose from "mongoose";
import { Application } from "../models/Application.js";
import { Job } from "../models/Job.js";
import {
  createApplicationSchema,
  updateApplicationSchema
} from "../schemas/index.js";
import { ApiError } from "../middleware/errors.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", async (req, res) => {
  const items = await Application.find({ userId: req.userId })
    .populate("jobId")
    .sort({ updatedAt: -1 })
    .lean();

  res.json({ items });
});

router.post("/", async (req, res) => {
  const data = createApplicationSchema.parse(req.body);

  const jobExists = await Job.exists({ _id: data.jobId });

  if (!jobExists) {
    throw new ApiError(404, "Job not found");
  }

  const application = await Application.create({
    userId: req.userId,
    jobId: data.jobId,
    notes: data.notes ?? "",
    status: "Applied"
  });

  res.status(201).json({ application });
});

router.patch("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const data = updateApplicationSchema.parse(req.body);

  const application = await Application.findOneAndUpdate(
    {
      _id: req.params.id,
      userId: req.userId
    },
    { $set: data },
    { new: true, runValidators: true }
  ).populate("jobId");

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  res.json({ application });
});

router.delete("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    throw new ApiError(400, "Invalid application ID");
  }

  const application = await Application.findOneAndDelete({
    _id: req.params.id,
    userId: req.userId
  });

  if (!application) {
    throw new ApiError(404, "Application not found");
  }

  res.status(204).end();
});

export default router;